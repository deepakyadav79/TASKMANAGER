const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all tasks for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'manager') {
      // Managers see all tasks they created
      tasks = await Task.find({ userId: req.user.userId }).populate('assignedTo', 'username email').sort({ createdAt: -1 });
    } else {
      // Team members see tasks assigned to them
      tasks = await Task.find({ assignedTo: req.user.userId }).populate('userId', 'username email').sort({ createdAt: -1 });
    }
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Create new task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;
    console.log('Creating task with data:', { title, description, assignedTo, userRole: req.user.role });

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Only managers can assign tasks to others
    if (assignedTo && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can assign tasks' });
    }

    const task = new Task({
      title,
      description: description || '',
      userId: req.user.userId,
      assignedTo: assignedTo || null
    });

    await task.save();
    console.log('Task created successfully:', task);

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        userId: task.userId,
        assignedTo: task.assignedTo,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status, actualHours, priority, skills } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user can update this task
    const canUpdate = task.userId.toString() === req.user.userId || 
                     (task.assignedTo && task.assignedTo.toString() === req.user.userId);
    
    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = task.status;
    
    // Update task fields
    Object.assign(task, req.body);

    // Track status changes
    if (oldStatus !== status) {
      if (status === 'completed' && oldStatus !== 'completed') {
        task.completedAt = new Date();
        
        // Update user statistics
        if (task.assignedTo) {
          const user = await User.findById(task.assignedTo);
          if (user) {
            // Initialize fields if they don't exist
            user.totalTasksCompleted = (user.totalTasksCompleted || 0) + 1;
            user.totalHoursWorked = (user.totalHoursWorked || 0) + (task.actualHours || 0);
            
            // Simple average completion time (1 hour default if no tracking)
            const completionTime = 1; // Default 1 hour per task
            const currentTotal = user.totalTasksCompleted;
            user.averageCompletionTime = 
              ((user.averageCompletionTime || 0) * (currentTotal - 1) + completionTime) / currentTotal;
            
            await user.save();
          }
        }
      } else if (status === 'pending' && oldStatus === 'completed') {
        // Task reopened - decrease statistics
        if (task.assignedTo) {
          const user = await User.findById(task.assignedTo);
          if (user && user.totalTasksCompleted > 0) {
            user.totalTasksCompleted = Math.max(0, (user.totalTasksCompleted || 0) - 1);
            user.totalHoursWorked = Math.max(0, (user.totalHoursWorked || 0) - (task.actualHours || 0));
            await user.save();
          }
        }
        task.completedAt = null;
      }
    }

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findOneAndDelete({ 
      _id: taskId, 
      userId: req.user.userId 
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// Get team members (for managers to assign tasks)
router.get('/team', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Managers only.' });
    }

    console.log('Fetching team members for manager:', req.user.userId);
    
    const teamMembers = await User.find({ 
      role: 'member',
      isApproved: true // Only show approved team members
    }).select('-password');
    
    console.log('Found approved team members:', teamMembers.length);
    
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user analytics and performance metrics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get task statistics
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const completedTasks = await Task.countDocuments({ assignedTo: userId, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ assignedTo: userId, status: 'in_progress' });

    // Get weekly/monthly summaries
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyCompleted = await Task.countDocuments({
      assignedTo: userId,
      status: 'completed',
      completedAt: { $gte: weekAgo }
    });

    const monthlyCompleted = await Task.countDocuments({
      assignedTo: userId,
      status: 'completed',
      completedAt: { $gte: monthAgo }
    });

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get recent tasks for timeline
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status updatedAt actualHours');

    res.json({
      user: {
        username: user.username,
        skills: user.skills || [],
        achievements: user.achievements || [],
        totalTasksCompleted: user.totalTasksCompleted || 0,
        totalHoursWorked: user.totalHoursWorked || 0,
        averageCompletionTime: user.averageCompletionTime || 0
      },
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completionRate: Math.round(completionRate)
      },
      periodStats: {
        weeklyCompleted,
        monthlyCompleted
      },
      recentTasks
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// Award achievement to user
router.post('/achievements', authMiddleware, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if achievement already exists
    const existingAchievement = user.achievements.find(ach => ach.name === name);
    if (existingAchievement) {
      return res.status(400).json({ message: 'Achievement already earned' });
    }

    user.achievements.push({
      name,
      description,
      icon,
      earnedAt: new Date()
    });

    await user.save();
    res.json({ message: 'Achievement awarded!', achievement: user.achievements[user.achievements.length - 1] });
  } catch (error) {
    console.error('Error awarding achievement:', error);
    res.status(500).json({ message: 'Error awarding achievement' });
  }
});

module.exports = router;
