import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isOverdue, formatDate } from '../utils/dates';
import { getCompletionColor } from '../utils/colors';
import Avatar from '../components/UI/Avatar';
import ProgressBar from '../components/UI/ProgressBar';
import TaskForm from '../components/Tasks/TaskForm';

function StatCard({ icon, label, value, color, onClick }) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: color + '20' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [taskModal, setTaskModal] = useState(false);

  const filteredTasks = state.filterProject === 'all'
    ? state.tasks
    : state.tasks.filter(t => t.projectId === state.filterProject);

  const overdueTasks = filteredTasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done');
  const dueSoonTasks = filteredTasks.filter(t => {
    const due = new Date(t.dueDate);
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400000);
    return due >= now && due <= in7 && t.status !== 'done';
  });

  const recentTasks = [...filteredTasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
          label="Total Projects"
          value={state.projects.length}
          color="#6366f1"
          onClick={() => navigate('/projects')}
        />
        <StatCard
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          label="Total Tasks"
          value={filteredTasks.length}
          color="#f59e0b"
          onClick={() => navigate('/board')}
        />
        <StatCard
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          label="Team Members"
          value={state.teamMembers.length}
          color="#10b981"
          onClick={() => navigate('/team')}
        />
        <StatCard
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Overdue Tasks"
          value={overdueTasks.length}
          color="#ef4444"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Tasks</h2>
            <button
              onClick={() => setTaskModal(true)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTasks.map(task => {
              const project = state.projects.find(p => p.id === task.projectId);
              const assignee = state.teamMembers.find(m => m.id === task.assigneeId);
              const overdue = isOverdue(task.dueDate) && task.status !== 'done';
              const color = getCompletionColor(task.completionPercentage, state.colorConfig);

              return (
                <div key={task.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      {project?.name} · {task.completionPercentage}% complete
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                      {overdue ? 'OVERDUE' : formatDate(task.dueDate)}
                    </span>
                    {assignee && <Avatar name={assignee.name} color={assignee.avatarColor} size="sm" />}
                  </div>
                </div>
              );
            })}
            {recentTasks.length === 0 && (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">No tasks yet</div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Due Soon */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Due This Week</h2>
            </div>
            <div className="p-4 space-y-3">
              {dueSoonTasks.slice(0, 5).map(task => {
                const color = getCompletionColor(task.completionPercentage, state.colorConfig);
                return (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400">{formatDate(task.dueDate)}</p>
                    </div>
                    <div className="w-16">
                      <ProgressBar percentage={task.completionPercentage} height={4} />
                    </div>
                  </div>
                );
              })}
              {dueSoonTasks.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-3">All caught up!</p>
              )}
            </div>
          </div>

          {/* Projects Progress */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Projects</h2>
            </div>
            <div className="p-4 space-y-4">
              {state.projects.map(project => {
                const projectTasks = state.tasks.filter(t => t.projectId === project.id);
                const avg = projectTasks.length > 0
                  ? Math.round(projectTasks.reduce((sum, t) => sum + t.completionPercentage, 0) / projectTasks.length)
                  : 0;
                return (
                  <div key={project.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        <span className="text-sm font-medium text-slate-700">{project.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{avg}%</span>
                    </div>
                    <ProgressBar percentage={avg} height={6} />
                    <p className="text-xs text-slate-400 mt-1">{projectTasks.length} tasks</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="font-semibold text-red-700">{overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueTasks.map(task => {
              const project = state.projects.find(p => p.id === task.projectId);
              const assignee = state.teamMembers.find(m => m.id === task.assigneeId);
              return (
                <div key={task.id} className="bg-white rounded-lg border border-red-200 p-3">
                  <p className="text-sm font-medium text-slate-800">{task.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{project?.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-red-600 font-medium">Due {formatDate(task.dueDate)}</span>
                    {assignee && <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TaskForm isOpen={taskModal} onClose={() => setTaskModal(false)} />
    </div>
  );
}
