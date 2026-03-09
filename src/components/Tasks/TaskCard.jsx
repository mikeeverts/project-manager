import React from 'react';
import { useApp } from '../../context/AppContext';
import Avatar from '../UI/Avatar';
import ProgressBar from '../UI/ProgressBar';
import PriorityBadge from '../UI/PriorityBadge';
import { formatDate, isOverdue } from '../../utils/dates';

export default function TaskCard({ task, onClick, onDelete, compact = false }) {
  const { state } = useApp();
  const project = state.projects.find(p => p.id === task.projectId);
  const assignee = state.teamMembers.find(m => m.id === task.assigneeId);
  const department = state.departments?.find(d => d.id === task.departmentId);
  const overdue = isOverdue(task.dueDate) && task.status !== 'done';

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        overdue ? 'border-red-300' : 'border-slate-200'
      }`}
      onClick={onClick}
    >
      {/* Project color bar */}
      {project && (
        <div
          className="h-1 rounded-t-lg"
          style={{ backgroundColor: project.color }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-slate-800 line-clamp-2 flex-1">{task.title}</h3>
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(task.id); }}
              className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {!compact && task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
        )}

        <ProgressBar percentage={task.completionPercentage} />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <span className="text-xs font-medium text-slate-500">{task.completionPercentage}%</span>
          </div>
          {assignee && (
            <Avatar name={assignee.name} color={assignee.avatarColor} size="sm" />
          )}
          {!assignee && department && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: department.color + '20', color: department.color }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: department.color }} />
              {department.name}
            </span>
          )}
        </div>

        {!compact && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{overdue ? 'Overdue: ' : 'Due: '}{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
