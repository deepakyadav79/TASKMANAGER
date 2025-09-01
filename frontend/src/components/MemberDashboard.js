import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';

const MemberDashboard = ({ tasks, onTaskUpdate }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  const fetchAnalytics = async () => {
    try {
      const response = await taskAPI.getAnalytics();
      setAnalytics(response.data);
      checkAchievements(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default analytics if API fails
      setAnalytics({
        user: {
          username: 'User',
          skills: [],
          achievements: [],
          totalTasksCompleted: 0,
          totalHoursWorked: 0,
          averageCompletionTime: 0
        },
        taskStats: {
          total: 0,
          completed: 0,
          pending: 0,
          completionRate: 0
        },
        periodStats: {
          weeklyCompleted: 0,
          monthlyCompleted: 0
        },
        recentTasks: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAchievements = async (data) => {
    if (!data || !data.user || !data.taskStats) return;
    
    const achievements = [];
    
    // First Task Achievement
    if (data.taskStats.completed >= 1 && !data.user.achievements.find(a => a.name === 'First Task')) {
      achievements.push({
        name: 'First Task',
        description: 'Completed your first task!',
        icon: '🎯'
      });
    }
    
    // Task Master Achievement
    if (data.taskStats.completed >= 10 && !data.user.achievements.find(a => a.name === 'Task Master')) {
      achievements.push({
        name: 'Task Master',
        description: 'Completed 10 tasks!',
        icon: '🏆'
      });
    }
    
    // Speed Demon Achievement
    if (data.user.averageCompletionTime <= 2 && data.taskStats.completed >= 5 && 
        !data.user.achievements.find(a => a.name === 'Speed Demon')) {
      achievements.push({
        name: 'Speed Demon',
        description: 'Average completion time under 2 hours!',
        icon: '⚡'
      });
    }

    // Award new achievements
    for (const achievement of achievements) {
      try {
        await taskAPI.awardAchievement(achievement);
        // Refresh analytics to show new achievement
        fetchAnalytics();
      } catch (error) {
        console.error('Error awarding achievement:', error);
      }
    }
  };

  const handleStatusToggle = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    console.log('Updating task:', task.id || task._id, 'to status:', newStatus);
    
    try {
      await onTaskUpdate(task.id || task._id, { status: newStatus });
      console.log('Task updated successfully');
      
      // Refresh analytics after status change
      setTimeout(fetchAnalytics, 1500);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };


  // Get current user from localStorage to filter tasks
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const myTasks = tasks.filter(task => task.assignedTo === currentUser.id);
  
  // Filter tasks by skill and time
  const filteredTasks = myTasks.filter(task => {
    const skillMatch = selectedSkill === 'all' || 
                      (task.skills && task.skills.includes(selectedSkill));
    
    if (timeFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return skillMatch && new Date(task.createdAt) >= weekAgo;
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return skillMatch && new Date(task.createdAt) >= monthAgo;
    }
    
    return skillMatch;
  });
  
  const pendingTasks = filteredTasks.filter(task => task.status === 'pending');
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');

  // Get unique skills for filtering
  const allSkills = [...new Set(myTasks.flatMap(task => task.skills || []))];

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  return (
    <div className="member-dashboard">
      <h2>Personal Dashboard</h2>
      
      {/* Performance Metrics */}
      {analytics && (
        <div className="performance-section">
          <h3>📊 Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{analytics.taskStats.completionRate}%</div>
              <div className="metric-label">Completion Rate</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{analytics.user.totalHoursWorked}h</div>
              <div className="metric-label">Total Hours</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{analytics.user.averageCompletionTime.toFixed(1)}h</div>
              <div className="metric-label">Avg. Time</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{analytics.user.totalTasksCompleted}</div>
              <div className="metric-label">Tasks Done</div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly/Monthly Summary */}
      {analytics && (
        <div className="summary-section">
          <h3>📅 Task Summary</h3>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-period">This Week</div>
              <div className="summary-count">{analytics.periodStats.weeklyCompleted} completed</div>
            </div>
            <div className="summary-card">
              <div className="summary-period">This Month</div>
              <div className="summary-count">{analytics.periodStats.monthlyCompleted} completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Badges */}
      {analytics && analytics.user.achievements.length > 0 && (
        <div className="achievements-section">
          <h3>🏆 Achievement Badges</h3>
          <div className="achievements-grid">
            {analytics.user.achievements.map((achievement, index) => (
              <div key={index} className="achievement-badge">
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-name">{achievement.name}</div>
                <div className="achievement-desc">{achievement.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <h3>🎯 My Tasks</h3>
        <div className="filters">
          <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)}>
            <option value="all">All Skills</option>
            {allSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
          
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      
      <div className="task-stats">
        <div className="stat">
          <span className="stat-number">{pendingTasks.length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat">
          <span className="stat-number">{completedTasks.length}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      {myTasks.length === 0 ? (
        <div className="no-tasks">
          <p>No tasks assigned to you yet.</p>
        </div>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <div className="task-section">
              <h3>📋 Pending Tasks</h3>
              <div className="task-list">
                {pendingTasks.map(task => (
                  <div key={task.id || task._id} className="task-item member-task">
                    <div className="task-content">
                      <div className="task-header">
                        <div className="task-title">{task.title}</div>
                        {task.priority && (
                          <span className={`priority-badge ${task.priority}`}>
                            {task.priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <div className="task-description">{task.description}</div>
                      )}
                      {task.skills && task.skills.length > 0 && (
                        <div className="task-skills">
                          {task.skills.map(skill => (
                            <span key={skill} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      )}
                      {task.userId && (
                        <div className="task-creator">
                          Assigned by: {task.userId.username || 'Manager'}
                        </div>
                      )}
                    </div>
                    <div className="task-actions">
                      <button 
                        onClick={() => handleStatusToggle(task)}
                        className="btn-complete"
                      >
                        Mark Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {completedTasks.length > 0 && (
            <div className="task-section">
              <h3>✅ Completed Tasks</h3>
              <div className="task-list">
                {completedTasks.map(task => (
                  <div key={task.id || task._id} className="task-item member-task completed">
                    <div className="task-content">
                      <div className="task-header">
                        <div className="task-title completed">{task.title}</div>
                        {task.actualHours && (
                          <span className="hours-badge">{task.actualHours}h</span>
                        )}
                      </div>
                      {task.description && (
                        <div className="task-description">{task.description}</div>
                      )}
                      {task.skills && task.skills.length > 0 && (
                        <div className="task-skills">
                          {task.skills.map(skill => (
                            <span key={skill} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      )}
                      {task.completedAt && (
                        <div className="completion-date">
                          Completed: {new Date(task.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="task-actions">
                      <button 
                        onClick={() => handleStatusToggle(task)}
                        className="btn-secondary"
                      >
                        Reopen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MemberDashboard;
