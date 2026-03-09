import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/team': 'Team',
  '/board': 'Kanban Board',
  '/calendar': 'Calendar',
  '/gantt': 'Gantt Chart',
  '/settings': 'Settings',
  '/tasks/new': 'New Task',
};

function getTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/projects/')) return 'Project Detail';
  if (pathname.includes('/edit')) return 'Edit Task';
  return 'ProjectHub';
}

export default function Header() {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-slate-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>
    </header>
  );
}
