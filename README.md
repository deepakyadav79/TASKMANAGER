# Task Management System

A comprehensive full-stack task management application with role-based access control, analytics, and team collaboration features.

## Features
- **Authentication**: JWT-based user registration and login with password validation
- **Role-Based Access**: Manager and Team Member roles with different permissions
- **Task Management**: Complete CRUD operations with priority levels and skill tagging
- **Team Collaboration**: Manager approval system for team members
- **Analytics Dashboard**: Performance metrics, completion rates, and achievement badges
- **Modern UI**: Beautiful gradient design with glass-morphism effects
- **Real-time Updates**: Live task status updates and analytics refresh

## Tech Stack
- **Frontend**: React.js, Axios, Modern CSS3 with gradients and animations
- **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs
- **Database**: MongoDB Atlas with Mongoose ODM

## 🚀 Deployment Guide

### Option 1: Local Development

#### Backend Setup
1. Navigate to backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create `.env` file with:
   ```
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   MONGODB_URI=your_mongodb_connection_string
   ```
4. Start server: `npm start`

#### Frontend Setup
1. Navigate to frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm start`

### Option 2: Production Deployment

#### Backend Deployment (Heroku/Railway/Render)
1. Create `Procfile` in backend root:
   ```
   web: node server.js
   ```
2. Set environment variables on hosting platform
3. Deploy backend first
4. Note the backend URL for frontend configuration

#### Frontend Deployment (Netlify/Vercel)
1. Build the project: `npm run build`
2. Update API base URL to production backend
3. Deploy the `build` folder

### Option 3: Docker Deployment
1. Use provided Docker configurations
2. Run: `docker-compose up`

## 🔧 Environment Variables

### Backend (.env)
```
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Tasks
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/analytics` - Get user analytics
- `POST /api/tasks/achievements` - Award achievements
- `GET /api/tasks/team-members` - Get team members (Manager only)
- `GET /api/tasks/pending-members` - Get pending approvals (Manager only)
- `PUT /api/tasks/approve-member/:id` - Approve team member (Manager only)

## 🌐 Default Ports
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## 👥 User Roles
- **Manager**: Can create/assign tasks, approve team members, view analytics
- **Team Member**: Can view assigned tasks, toggle status, see personal dashboard
