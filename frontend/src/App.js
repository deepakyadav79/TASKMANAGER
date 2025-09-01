import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import TaskList from './components/TaskList';
import ManagerDashboard from './components/ManagerDashboard';
import MemberDashboard from './components/MemberDashboard';
import { taskAPI } from './services/api';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      const userData = JSON.parse(savedUser);
      console.log('Restored user from localStorage:', userData);
      setUser(userData);
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getTasks();
      const tasksData = response.data.map(task => ({
        ...task,
        id: task.id || task._id
      }));
      setTasks(tasksData);
    } catch (error) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    console.log('Login userData:', userData);
    setUser(userData);
    fetchTasks();
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTasks([]);
  };

  const handleTaskCreate = async (taskData) => {
    try {
      const response = await taskAPI.createTask(taskData);
      const newTask = response.data.task;
      // Ensure task has consistent ID format
      newTask.id = newTask.id || newTask._id;
      setTasks([newTask, ...tasks]);
      setError('');
    } catch (error) {
      console.error('Task creation error:', error);
      setError('Failed to create task');
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      console.log('App.js - Updating task:', taskId, 'with:', updates);
      const response = await taskAPI.updateTask(taskId, updates);
      console.log('App.js - Update response:', response.data);
      
      setTasks(tasks.map(task => 
        (task.id === taskId || task._id === taskId) ? { ...task, ...updates } : task
      ));
      
      // Refresh tasks from server to get latest data
      setTimeout(fetchTasks, 500);
      
      setError('');
    } catch (error) {
      console.error('App.js - Task update error:', error);
      setError('Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await taskAPI.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId && task._id !== taskId));
      setError('');
    } catch (error) {
      setError('Failed to delete task');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Task Manager</h1>
        <div>
          <span>Welcome, {user.username}! ({user.role || 'member'})</span>
          {user.role === 'member' && !user.isApproved && (
            <span style={{ marginLeft: '10px', color: '#856404', fontSize: '14px', fontStyle: 'italic' }}>
              Waiting for manager approval
            </span>
          )}
          <button onClick={handleLogout} style={{ marginLeft: '15px' }}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}


      {(user.role === 'manager') ? (
        <>
          <ManagerDashboard 
            tasks={tasks}
            onTaskCreate={handleTaskCreate}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
          <TaskList 
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
        </>
      ) : (
        <MemberDashboard 
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}

export default App;
