import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import ConfirmModal from '../components/UI/ConfirmModal';
import TestRunner from './TestRunner';

function CompanyForm({ company, onSave, onClose }) {
  const [name, setName] = useState(company?.name || '');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Company name is required'); return; }
    onSave({ name: name.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="Acme Corp"
          autoFocus
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
          {company ? 'Save Changes' : 'Create Company'}
        </button>
      </div>
    </form>
  );
}

export default function SuperAdminDashboard() {
  const { rawState, dispatch } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [deleteCompany, setDeleteCompany] = useState(null);
  const [activeView, setActiveView] = useState('companies'); // 'companies' | 'tests'

  if (activeView === 'tests') {
    return <TestRunner onBack={() => setActiveView('companies')} />;
  }

  const companies = rawState.companies;

  function getStats(companyId) {
    const members = rawState.teamMembers.filter(m => m.companyId === companyId);
    const projects = rawState.projects.filter(p => p.companyId === companyId);
    const projectIds = new Set(projects.map(p => p.id));
    const tasks = rawState.tasks.filter(t => projectIds.has(t.projectId));
    return { members: members.length, projects: projects.length, tasks: tasks.length };
  }

  function handleCreate(data) {
    dispatch({
      type: 'ADD_COMPANY',
      payload: { id: uuidv4(), ...data, createdAt: new Date().toISOString() },
    });
    setShowCreate(false);
  }

  function handleEdit(data) {
    dispatch({ type: 'UPDATE_COMPANY', payload: { ...editCompany, ...data } });
    setEditCompany(null);
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_COMPANY', payload: id });
    setDeleteCompany(null);
  }

  function handleEnter(companyId) {
    dispatch({ type: 'SET_IMPERSONATION', payload: companyId });
  }

  function handleLogout() {
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800">ProjectHub</h1>
            <p className="text-xs text-slate-400">Site Administration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('tests')}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Test Runner
          </button>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
            Site Admin
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Companies</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {companies.length} {companies.length === 1 ? 'company' : 'companies'} registered
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Company
          </button>
        </div>

        {companies.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No companies yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map(company => {
              const stats = getStats(company.id);
              return (
                <div key={company.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                  {/* Company header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 font-bold text-sm">
                          {company.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{company.name}</h3>
                        <p className="text-xs text-slate-400">
                          Since {new Date(company.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditCompany(company)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Edit company"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteCompany(company)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete company"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span><strong className="text-slate-700">{stats.members}</strong> members</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span><strong className="text-slate-700">{stats.projects}</strong> projects</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span><strong className="text-slate-700">{stats.tasks}</strong> tasks</span>
                    </div>
                  </div>

                  {/* Enter button */}
                  <button
                    onClick={() => handleEnter(company.id)}
                    className="w-full py-2 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Enter as Admin
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Create Company</h2>
            <CompanyForm onSave={handleCreate} onClose={() => setShowCreate(false)} />
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editCompany && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Company</h2>
            <CompanyForm company={editCompany} onSave={handleEdit} onClose={() => setEditCompany(null)} />
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteCompany}
        onClose={() => setDeleteCompany(null)}
        onConfirm={() => handleDelete(deleteCompany?.id)}
        title="Delete Company"
        message={deleteCompany
          ? `Delete "${deleteCompany.name}"? This will permanently remove all members, projects, and tasks for this company.`
          : ''}
        confirmLabel="Delete Company"
        variant="danger"
      />
    </div>
  );
}
