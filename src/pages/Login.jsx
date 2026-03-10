import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { hashPassword, ROLE_LABELS } from '../utils/auth';

export default function Login() {
  const { state, dispatch } = useApp();
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    state.companies.length === 1 ? state.companies[0].id : ''
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHints, setShowHints] = useState(false);

  const selectedCompany = state.companies.find(c => c.id === selectedCompanyId);
  const companyMembers = state.teamMembers.filter(m => m.companyId === selectedCompanyId);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const identifier = email.trim().toLowerCase();

    // ── Site owner (super-admin) login ──────────────────────────────────────
    if (identifier === 'admin') {
      const owner = state.siteOwner;
      if (hashPassword(password) !== owner.password) {
        setError('Incorrect password.');
        return;
      }
      dispatch({
        type: 'LOGIN',
        payload: {
          isSuperAdmin: true,
          name: 'Site Admin',
          email: 'admin',
          role: 'super_admin',
          avatarColor: '#6366f1',
          mustChangePassword: owner.mustChangePassword,
        },
      });
      return;
    }

    // ── Company member login ────────────────────────────────────────────────
    if (!selectedCompanyId) { setError('Please select a company.'); return; }
    const member = companyMembers.find(m => m.email.toLowerCase() === identifier);
    if (!member) { setError('No account found with that email.'); return; }
    if (member.isDisabled) {
      setError('This account has been disabled. Contact your administrator.');
      return;
    }
    if (member.password !== hashPassword(password)) { setError('Incorrect password.'); return; }
    dispatch({
      type: 'LOGIN',
      payload: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatarColor: member.avatarColor,
        companyId: member.companyId,
      },
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-lg" style={{ backgroundColor: state.uiColors?.sidebarBg || '#1e293b' }}>
            {state.companyLogo ? (
              <img src={state.companyLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {state.companyName || 'ProjectHub'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company selector — hidden if only one company */}
            {state.companies.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <select
                  value={selectedCompanyId}
                  onChange={e => { setSelectedCompanyId(e.target.value); setError(''); }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a company…</option>
                  {state.companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email / Username</label>
              <input
                type="text"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                autoFocus
                autoComplete="username"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors mt-2"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Credentials hint — only shown before site admin has changed default password */}
        {state.siteOwner?.mustChangePassword && selectedCompanyId && companyMembers.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowHints(h => !h)}
              className="text-xs text-slate-400 hover:text-slate-600 w-full text-center"
            >
              {showHints ? 'Hide' : 'Show'} credentials hint
            </button>
            {showHints && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                {companyMembers.filter(m => !m.isDisabled).map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-700">{m.email}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                      m.role === 'project_manager' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
