import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../utils/auth';
import Avatar from '../UI/Avatar';

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

const FILTER_PAGES = ['/', '/board', '/calendar', '/gantt'];

function getTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/projects/')) return 'Project Detail';
  if (pathname.includes('/edit')) return 'Edit Task';
  return 'ProjectHub';
}

export default function Header() {
  const location = useLocation();
  const { state, dispatch } = useApp();
  const title = getTitle(location.pathname);
  const showProjectFilter = FILTER_PAGES.includes(location.pathname);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        {showProjectFilter && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <select
              value={state.filterProject}
              onChange={e => dispatch({ type: 'SET_FILTER_PROJECT', payload: e.target.value })}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {state.projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        {/* Date — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-slate-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Current user + logout — always visible */}
        {state.currentUser && (
          <div className="flex items-center gap-2 sm:pl-2 sm:border-l sm:border-slate-200">
            <Avatar name={state.currentUser.name} color={state.currentUser.avatarColor} size="sm" />
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-700 leading-tight">{state.currentUser.name}</p>
              <p className="text-xs text-slate-400 leading-tight">{ROLE_LABELS[state.currentUser.role] || state.currentUser.role}</p>
            </div>
            <div className="sm:hidden">
              <p className="text-xs font-medium text-slate-700 leading-tight">{state.currentUser.name}</p>
              <p className="text-xs text-slate-400 leading-tight">{ROLE_LABELS[state.currentUser.role] || state.currentUser.role}</p>
            </div>
            <button
              onClick={() => dispatch({ type: 'LOGOUT' })}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
