import React, { useState } from 'react';

const TaskList = ({ tasks, onTaskUpdate, onTaskDelete }) => {
  const [editingTask, setEditingTask] = useState(null);
  const [editData, setEditData] = useState({ title: '', description: '' });

  const handleStatusToggle = (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    onTaskUpdate(task.id || task._id, { status: newStatus });
  };

  const handleEditStart = (task) => {
    setEditingTask(task.id || task._id);
    setEditData({ title: task.title, description: task.description || '' });
  };

  const handleEditSave = () => {
    onTaskUpdate(editingTask, editData);
    setEditingTask(null);
    setEditData({ title: '', description: '' });
  };

  const handleEditCancel = () => {
    setEditingTask(null);
    setEditData({ title: '', description: '' });
  };

  if (tasks.length === 0) {
    return (
      <div className="task-list">
        <div className="task-item">
          <p>No tasks yet. Add your first task above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task.id || task._id} className="task-item">
          {editingTask === (task.id || task._id) ? (
            <div className="task-content" style={{ flex: 1 }}>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                style={{ marginBottom: '10px', width: '100%' }}
              />
              <input
                type="text"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Description"
                style={{ width: '100%' }}
              />
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <button onClick={handleEditSave}>Save</button>
                <button onClick={handleEditCancel} className="btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="task-content">
                <div className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
                  {task.title}
                </div>
                {task.description && (
                  <div className="task-description">{task.description}</div>
                )}
              </div>
              
              <div className={`task-status status-${task.status}`}>
                {task.status}
              </div>
              
              <div className="task-actions">
                <button onClick={() => handleStatusToggle(task)}>
                  {task.status === 'pending' ? 'Complete' : 'Reopen'}
                </button>
                <button onClick={() => handleEditStart(task)} className="btn-secondary">
                  Edit
                </button>
                <button onClick={() => onTaskDelete(task.id || task._id)} className="btn-danger">
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default TaskList;
