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

  const { headerBg, headerBorder } = state.uiColors ?? {};

  // Detect if header background is dark so we can flip text colors
  function isDark(hex) {
    const h = (hex || '#ffffff').replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }
  const darkHeader = isDark(headerBg);

  return (
    <header
      className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b"
      style={{
        backgroundColor: headerBg || '#ffffff',
        borderColor: headerBorder || '#e2e8f0',
      }}
    >
      <h1 className={`text-xl font-semibold ${darkHeader ? 'text-white' : 'text-slate-800'}`}>{title}</h1>
      <div className="flex items-center gap-3">
        {showProjectFilter && (
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 flex-shrink-0 ${darkHeader ? 'text-white/60' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <select
              value={state.filterProject}
              onChange={e => dispatch({ type: 'SET_FILTER_PROJECT', payload: e.target.value })}
              className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${darkHeader ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
            >
              <option value="all">All Projects</option>
              {state.projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        {/* Date — hidden on mobile */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg ${darkHeader ? 'bg-white/10' : 'bg-slate-50'}`}>
          <svg className={`w-4 h-4 ${darkHeader ? 'text-white/60' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`text-sm ${darkHeader ? 'text-white/80' : 'text-slate-600'}`}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Current user + logout — always visible */}
        {state.currentUser && (
          <div className={`flex items-center gap-2 sm:pl-2 sm:border-l ${darkHeader ? 'sm:border-white/20' : 'sm:border-slate-200'}`}>
            <Avatar name={state.currentUser.name} color={state.currentUser.avatarColor} size="sm" />
            <div className="hidden sm:block">
              <p className={`text-xs font-medium leading-tight ${darkHeader ? 'text-white' : 'text-slate-700'}`}>{state.currentUser.name}</p>
              <p className={`text-xs leading-tight ${darkHeader ? 'text-white/60' : 'text-slate-400'}`}>{ROLE_LABELS[state.currentUser.role] || state.currentUser.role}</p>
            </div>
            <div className="sm:hidden">
              <p className={`text-xs font-medium leading-tight ${darkHeader ? 'text-white' : 'text-slate-700'}`}>{state.currentUser.name}</p>
              <p className={`text-xs leading-tight ${darkHeader ? 'text-white/60' : 'text-slate-400'}`}>{ROLE_LABELS[state.currentUser.role] || state.currentUser.role}</p>
            </div>
            <button
              onClick={() => dispatch({ type: 'LOGOUT' })}
              title="Sign out"
              className={`p-1.5 rounded-lg transition-colors ${darkHeader ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
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
