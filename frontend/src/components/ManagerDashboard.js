import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';

const ManagerDashboard = ({ tasks, onTaskCreate, onTaskUpdate, onTaskDelete }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    completedTasks: 0,
    availableMembers: 0
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateTeamStats = React.useCallback(() => {
    const totalMembers = teamMembers.length;
    const completedTasks = tasks.filter(task => task.status === 'completed' && task.assignedTo).length;
    const assignedMemberIds = new Set(tasks.filter(task => task.assignedTo).map(task => task.assignedTo));
    const availableMembers = teamMembers.filter(member => !assignedMemberIds.has(member._id)).length;

    setTeamStats({
      totalMembers,
      completedTasks,
      availableMembers
    });
  }, [teamMembers, tasks]);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    calculateTeamStats();
  }, [calculateTeamStats]);

  const fetchTeamMembers = async () => {
    try {
      const response = await taskAPI.getTeamMembers();
      setTeamMembers(response.data);
    } catch (error) {
      setError('Failed to fetch team members');
    }
  };


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      await onTaskCreate({
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo || null
      });
      setFormData({ title: '', description: '', assignedTo: '' });
      setError('');
    } catch (error) {
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manager-dashboard">
      <h2>Manager Dashboard</h2>
      
      {error && <div className="error">{error}</div>}
      
      <div className="task-assignment-form">
        <h3>Assign New Task</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Task description (optional)"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Assign To</label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
            >
              <option value="">Select team member (optional)</option>
              {teamMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.username} ({member.email})
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>


      <div className="team-statistics">
        <h3>Team Overview</h3>
        <div className="team-stats">
          <div className="stat">
            <span className="stat-number">{teamStats.totalMembers}</span>
            <span className="stat-label">Total Team Members</span>
          </div>
          <div className="stat">
            <span className="stat-number">{teamStats.completedTasks}</span>
            <span className="stat-label">Completed by Team</span>
          </div>
          <div className="stat">
            <span className="stat-number">{teamStats.availableMembers}</span>
            <span className="stat-label">Available for Assignment</span>
          </div>
        </div>
      </div>

      <div className="team-members-list">
        <h3>Team Members</h3>
        {teamMembers.length > 0 ? (
          <div className="members-grid">
            {teamMembers.map(member => {
              const memberTasks = tasks.filter(task => task.assignedTo === member._id);
              const completedTasks = memberTasks.filter(task => task.status === 'completed').length;
              const pendingTasks = memberTasks.filter(task => task.status === 'pending').length;
              
              return (
                <div key={member._id} className="member-card">
                  <div className="member-info">
                    <h4>{member.username}</h4>
                    <p className="member-email">{member.email}</p>
                    <div className="member-stats">
                      <span className="task-count">
                        {pendingTasks} pending, {completedTasks} completed
                      </span>
                    </div>
                  </div>
                  <div className="member-status">
                    <span className={`status-indicator ${memberTasks.length > 0 ? 'assigned' : 'available'}`}>
                      {memberTasks.length > 0 ? 'Has Tasks' : 'Available'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-members">No team members found. Team members will appear here when they register.</p>
        )}
      </div>

      <div className="tasks-overview">
        <h3>All Tasks ({tasks.length})</h3>
        <div className="task-stats">
          <div className="stat">
            <span className="stat-number">{tasks.filter(t => t.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat">
            <span className="stat-number">{tasks.filter(t => t.status === 'completed').length}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat">
            <span className="stat-number">{tasks.filter(t => t.assignedTo).length}</span>
            <span className="stat-label">Assigned</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
