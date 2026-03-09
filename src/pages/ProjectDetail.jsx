import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { canDo } from '../utils/auth';
import TaskCard from '../components/Tasks/TaskCard';
import TaskForm from '../components/Tasks/TaskForm';
import ConfirmModal from '../components/UI/ConfirmModal';
import ProgressBar from '../components/UI/ProgressBar';
import { formatDate, isOverdue } from '../utils/dates';

export default function ProjectDetail() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const canManage = canDo(state.currentUser, 'project_manager');
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [filter, setFilter] = useState('all');

  const project = state.projects.find(p => p.id === id);
  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Project not found.</p>
        <button onClick={() => navigate('/projects')} className="mt-3 text-indigo-600 hover:underline text-sm">
          Back to Projects
        </button>
      </div>
    );
  }

  const projectTasks = state.tasks.filter(t => t.projectId === id);
  const filteredTasks = filter === 'all' ? projectTasks : projectTasks.filter(t => t.status === filter);
  const avg = projectTasks.length > 0
    ? Math.round(projectTasks.reduce((sum, t) => sum + t.completionPercentage, 0) / projectTasks.length)
    : 0;
  const overdue = projectTasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length;

  const statusCounts = {
    todo: projectTasks.filter(t => t.status === 'todo').length,
    'in-progress': projectTasks.filter(t => t.status === 'in-progress').length,
    review: projectTasks.filter(t => t.status === 'review').length,
    done: projectTasks.filter(t => t.status === 'done').length,
  };

  function handleDeleteTask(taskId) {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
    setDeleteTask(null);
  }

  function toggleClosed() {
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { ...project, status: isClosed ? 'active' : 'closed' },
    });
  }

  const isClosed = project.status === 'closed';

  return (
    <div className="p-6">
      {/* Back */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Projects
      </button>

      {/* Project header */}
      <div className={`bg-white rounded-xl border shadow-sm p-6 mb-6 ${isClosed ? 'border-slate-300' : 'border-slate-200'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex-shrink-0"
              style={{ backgroundColor: (isClosed ? '#94a3b8' : project.color) + '20' }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: isClosed ? '#94a3b8' : project.color }} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className={`text-xl font-bold ${isClosed ? 'text-slate-400' : 'text-slate-800'}`}>{project.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isClosed ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                  {isClosed ? 'Closed' : 'Open'}
                </span>
              </div>
              {project.description && (
                <p className="text-slate-500 text-sm mt-0.5">{project.description}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">Created {formatDate(project.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canManage && (
              <button
                onClick={() => isClosed ? toggleClosed() : setConfirmClose(true)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  isClosed
                    ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                    : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                }`}
              >
                {isClosed ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reopen Project
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Close Project
                  </>
                )}
              </button>
            )}
            {canManage && !isClosed && (
              <button
                onClick={() => setTaskModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-5 border-t border-slate-100">
          <div>
            <p className="text-2xl font-bold text-slate-800">{projectTasks.length}</p>
            <p className="text-xs text-slate-500">Total tasks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{statusCounts.todo}</p>
            <p className="text-xs text-slate-500">Todo</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{statusCounts['in-progress']}</p>
            <p className="text-xs text-slate-500">In Progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">{statusCounts.done}</p>
            <p className="text-xs text-slate-500">Done</p>
          </div>
          {overdue > 0 && (
            <div>
              <p className="text-2xl font-bold text-red-500">{overdue}</p>
              <p className="text-xs text-slate-500">Overdue</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-600 font-medium">Overall progress</span>
            <span className="text-slate-500">{avg}%</span>
          </div>
          <ProgressBar percentage={avg} height={8} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { key: 'all', label: 'All' },
          { key: 'todo', label: 'Todo' },
          { key: 'in-progress', label: 'In Progress' },
          { key: 'review', label: 'Review' },
          { key: 'done', label: 'Done' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === f.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-75">
                {statusCounts[f.key] ?? projectTasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => setEditTask(task)}
            onDelete={() => setDeleteTask(task)}
          />
        ))}
        {filteredTasks.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400 text-sm">
            {filter === 'all' ? 'No tasks in this project yet.' : `No ${filter} tasks.`}
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskForm
        isOpen={taskModal}
        onClose={() => setTaskModal(false)}
        defaultProjectId={id}
      />
      <TaskForm
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        task={editTask}
      />
      <ConfirmModal
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={() => handleDeleteTask(deleteTask?.id)}
        title="Delete Task"
        message={deleteTask ? `Delete "${deleteTask.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete Task"
        variant="danger"
      />
      <ConfirmModal
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={toggleClosed}
        title="Close Project"
        message={`Close "${project.name}"? The project will be marked as closed and no new tasks can be added. You can reopen it at any time.`}
        confirmLabel="Close Project"
        variant="warning"
      />
    </div>
  );
}
