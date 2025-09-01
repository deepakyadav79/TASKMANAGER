const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate password requirements
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasLowercase || !hasUppercase || !hasNumber) {
      return res.status(400).json({ 
        message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'member'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, isApproved: user.isApproved },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: user.role === 'member' && !user.isApproved ? 
        'Registration successful. Waiting for manager approval.' : 
        'User registered successfully',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email - check if user is registered
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not registered. Please sign up first.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, isApproved: user.isApproved },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role endpoint
router.put('/update-role', auth, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['manager', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { role },
      { new: true }
    );

    // Generate new token with updated role
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, isApproved: user.isApproved },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        isApproved: user.isApproved
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending team member requests (managers only)
router.get('/pending-members', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Managers only.' });
    }

    const pendingMembers = await User.find({
      role: 'member',
      isApproved: false
    }).select('-password');

    res.json(pendingMembers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject team member (managers only)
router.put('/approve-member/:memberId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Managers only.' });
    }

    const { approve } = req.body; // true to approve, false to reject
    const { memberId } = req.params;

    if (approve) {
      const user = await User.findByIdAndUpdate(
        memberId,
        { 
          isApproved: true,
          approvedBy: req.user.userId
        },
        { new: true }
      ).select('-password');

      res.json({ 
        message: 'Team member approved successfully',
        user 
      });
    } else {
      // Reject - delete the user
      await User.findByIdAndDelete(memberId);
      res.json({ message: 'Team member request rejected' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
