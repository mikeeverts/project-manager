import React from 'react';
import { useApp } from '../context/AppContext';

export default function ImpersonationBanner() {
  const { state, dispatch } = useApp();

  if (!state.currentUser?.isSuperAdmin || !state.impersonatedCompanyId) return null;

  // companies is not scoped (not filtered by companyId), so state.companies has all companies
  const company = state.companies.find(c => c.id === state.impersonatedCompanyId)
    || { name: 'Unknown Company' };

  function handleExit() {
    dispatch({ type: 'SET_IMPERSONATION', payload: null });
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-4 text-sm flex-shrink-0">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>
          Viewing <strong>{company.name}</strong> as Site Admin
        </span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Exit to Admin Panel
      </button>
    </div>
  );
}
