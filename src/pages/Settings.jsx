import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import { isAdmin, ROLE_LABELS } from '../utils/auth';
import { getCompletionColor } from '../utils/colors';
import { defaultUiColors, defaultDarkUiColors } from '../context/AppContext';
import Avatar from '../components/UI/Avatar';
import ConfirmModal from '../components/UI/ConfirmModal';

const DEPT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

const BASE_TABS = [
  { id: 'company',         label: 'Company' },
  { id: 'project-members', label: 'Project Members' },
  { id: 'departments',     label: 'Departments' },
  { id: 'colors',          label: 'Colors' },
];
const SUPER_ADMIN_TABS = [
  { id: 'companies', label: 'Companies' },
];

// ── Companies tab (super-admin only) ─────────────────────────────────────────
function CompaniesTab() {
  const { rawState, dispatch } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [deleteCompany, setDeleteCompany] = useState(null);
  const [newName, setNewName] = useState('');
  const [editName, setEditName] = useState('');
  const [nameError, setNameError] = useState('');

  const companies = rawState.companies;

  function getStats(companyId) {
    const members = rawState.teamMembers.filter(m => m.companyId === companyId);
    const projects = rawState.projects.filter(p => p.companyId === companyId);
    const projectIds = new Set(projects.map(p => p.id));
    const tasks = rawState.tasks.filter(t => projectIds.has(t.projectId));
    return { members: members.length, projects: projects.length, tasks: tasks.length };
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) { setNameError('Name is required'); return; }
    dispatch({ type: 'ADD_COMPANY', payload: { id: uuidv4(), name: newName.trim(), createdAt: new Date().toISOString() } });
    setNewName(''); setShowCreate(false); setNameError('');
  }

  function handleEdit(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    dispatch({ type: 'UPDATE_COMPANY', payload: { ...editCompany, name: editName.trim() } });
    setEditCompany(null);
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_COMPANY', payload: id });
    setDeleteCompany(null);
  }

  function handleEnter(companyId) {
    dispatch({ type: 'SET_IMPERSONATION', payload: companyId });
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">All Companies</h2>
            <p className="text-sm text-slate-500 mt-0.5">{companies.length} {companies.length === 1 ? 'company' : 'companies'} registered</p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setNewName(''); setNameError(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Company
          </button>
        </div>

        <div className="space-y-3">
          {showCreate && (
            <form onSubmit={handleCreate} className="flex items-center gap-3 p-3 border border-indigo-200 bg-indigo-50 rounded-lg">
              <input
                type="text"
                value={newName}
                onChange={e => { setNewName(e.target.value); setNameError(''); }}
                placeholder="Company name"
                autoFocus
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
              <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
            </form>
          )}

          {companies.map(company => {
            const stats = getStats(company.id);
            const isEditing = editCompany?.id === company.id;
            return (
              <div key={company.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-bold text-xs">{company.name.slice(0, 2).toUpperCase()}</span>
                </div>
                {isEditing ? (
                  <form onSubmit={handleEdit} className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                    <button type="button" onClick={() => setEditCompany(null)} className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg">Cancel</button>
                  </form>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{company.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {stats.members} members · {stats.projects} projects · {stats.tasks} tasks
                      </p>
                    </div>
                    <button
                      onClick={() => handleEnter(company.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Enter as Admin
                    </button>
                    <button
                      onClick={() => { setEditCompany(company); setEditName(company.name); }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteCompany(company)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {companies.length === 0 && !showCreate && (
            <p className="text-sm text-slate-400 text-center py-6">No companies yet. Click New Company to create one.</p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteCompany}
        onClose={() => setDeleteCompany(null)}
        onConfirm={() => handleDelete(deleteCompany?.id)}
        title="Delete Company"
        message={deleteCompany ? `Delete "${deleteCompany.name}"? All members, projects, and tasks for this company will be permanently removed.` : ''}
        confirmLabel="Delete Company"
        variant="danger"
      />
    </div>
  );
}

// ── Project Members tab ───────────────────────────────────────────────────────
function ProjectMembersTab() {
  const { state, dispatch } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState(
    state.projects[0]?.id ?? null
  );
  // Stores member assignments per project captured just before "select all" was turned on,
  // so toggling it off restores the original state instead of wiping everything.
  const [savedMembers, setSavedMembers] = useState({});

  const selectedProject = state.projects.find(p => p.id === selectedProjectId);
  const projectMembers = selectedProject?.members ?? [];

  function isAssigned(memberId) {
    return projectMembers.some(m => m.memberId === memberId);
  }

  function getMemberProjectRole(memberId) {
    return projectMembers.find(m => m.memberId === memberId)?.projectRole ?? 'user';
  }

  function toggleMember(memberId) {
    if (!selectedProject) return;
    const newMembers = isAssigned(memberId)
      ? projectMembers.filter(m => m.memberId !== memberId)
      : [...projectMembers, { memberId, projectRole: 'user' }];
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...selectedProject, members: newMembers } });
  }

  function updateProjectRole(memberId, projectRole) {
    if (!selectedProject) return;
    const newMembers = projectMembers.map(m =>
      m.memberId === memberId ? { ...m, projectRole } : m
    );
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...selectedProject, members: newMembers } });
  }

  if (state.projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 text-sm">
        No projects yet. Create a project first.
      </div>
    );
  }

  return (
    <div className="flex gap-4" style={{ minHeight: 440 }}>
      {/* Project list */}
      <div className="w-56 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-2 self-start">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 pt-1 pb-2">Projects</p>
        {state.projects.map(project => {
          const count = (project.members ?? []).length;
          const active = selectedProjectId === project.id;
          return (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors mb-0.5 ${
                active ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
              <span className="flex-1 text-sm font-medium truncate">{project.name}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Member assignment panel */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {selectedProject ? (
          <>
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{selectedProject.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Select all</span>
                <button
                  onClick={() => {
                    const allAssigned = state.teamMembers.every(m => isAssigned(m.id));
                    if (allAssigned) {
                      const restored = savedMembers[selectedProjectId] ?? [];
                      dispatch({ type: 'UPDATE_PROJECT', payload: { ...selectedProject, members: restored } });
                      setSavedMembers(prev => { const next = { ...prev }; delete next[selectedProjectId]; return next; });
                    } else {
                      setSavedMembers(prev => ({ ...prev, [selectedProjectId]: projectMembers }));
                      const newMembers = state.teamMembers.map(m =>
                        projectMembers.find(pm => pm.memberId === m.id) ?? { memberId: m.id, projectRole: 'user' }
                      );
                      dispatch({ type: 'UPDATE_PROJECT', payload: { ...selectedProject, members: newMembers } });
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    state.teamMembers.length > 0 && state.teamMembers.every(m => isAssigned(m.id))
                      ? 'bg-indigo-600'
                      : 'bg-slate-200'
                  }`}
                  title="Assign / remove all members"
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    state.teamMembers.length > 0 && state.teamMembers.every(m => isAssigned(m.id)) ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <span className="w-4" />
              <span>Member</span>
              <span>Global Role</span>
              <span className="w-36 text-center">Project Role</span>
            </div>

            {/* Member rows */}
            <div className="divide-y divide-slate-100">
              {state.teamMembers.map(member => {
                const assigned = isAssigned(member.id);
                const projectRole = getMemberProjectRole(member.id);
                const dept = state.departments?.find(d => d.id === member.departmentId);

                return (
                  <div
                    key={member.id}
                    className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3 transition-colors ${
                      assigned ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={assigned}
                      onChange={() => toggleMember(member.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer accent-indigo-600"
                    />
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={member.name} color={member.avatarColor} size="sm" />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${assigned ? 'text-slate-800' : 'text-slate-500'}`}>
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {member.email}{dept ? ` · ${dept.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      member.role === 'admin'           ? 'bg-indigo-100 text-indigo-700' :
                      member.role === 'project_manager' ? 'bg-amber-100 text-amber-700' :
                                                          'bg-slate-100 text-slate-600'
                    }`}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                    <div className="w-36">
                      {assigned ? (
                        <select
                          value={projectRole}
                          onChange={e => updateProjectRole(member.id, e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="user">Viewer</option>
                          <option value="project_manager">Contributor</option>
                          <option value="admin">Manager</option>
                        </select>
                      ) : (
                        <span className="text-xs text-slate-300 px-2">—</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {state.teamMembers.length === 0 && (
                <div className="px-5 py-10 text-center text-slate-400 text-sm">
                  No team members yet.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Select a project to manage members.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Company tab ───────────────────────────────────────────────────────────────
function CompanyTab() {
  const { state, dispatch } = useApp();
  const [companyName, setCompanyName] = useState(state.companyName || 'ProjectHub');
  const [companySaved, setCompanySaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function handleSaveCompany() {
    dispatch({ type: 'UPDATE_COMPANY_NAME', payload: companyName.trim() || 'ProjectHub' });
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2000);
  }

  function handleResetData() {
    localStorage.removeItem('project_manager_state');
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      {/* Company name & logo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Company Branding</h2>
        <p className="text-sm text-slate-500 mb-5">Shown in the sidebar and browser tab title.</p>

        <div className="flex items-start gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-xl border-2 border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
              {state.companyLogo ? (
                <img src={state.companyLogo} alt="Company logo" className="w-full h-full object-contain" />
              ) : (
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <label className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-700 font-medium text-center">
              {state.companyLogo ? 'Change' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => dispatch({ type: 'UPDATE_COMPANY_LOGO', payload: ev.target.result });
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
            </label>
            <span className="text-xs text-slate-400 text-center">128×128px<br />PNG or SVG</span>
            {state.companyLogo && (
              <button
                onClick={() => dispatch({ type: 'UPDATE_COMPANY_LOGO', payload: null })}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          {/* Name */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={companyName}
                onChange={e => { setCompanyName(e.target.value); setCompanySaved(false); }}
                placeholder="Your company name"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
              <button
                onClick={handleSaveCompany}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
              {companySaved && (
                <div className="flex items-center gap-1.5 text-green-600 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* App information */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">App Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Total Projects</p>
            <p className="font-semibold text-slate-800 mt-0.5">{state.projects.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Total Tasks</p>
            <p className="font-semibold text-slate-800 mt-0.5">{state.tasks.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Team Members</p>
            <p className="font-semibold text-slate-800 mt-0.5">{state.teamMembers.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Storage</p>
            <p className="font-semibold text-slate-800 mt-0.5">LocalStorage</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setConfirmReset(true)}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Reset all data to defaults
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetData}
        title="Reset All Data"
        message="This will permanently clear ALL projects, tasks, and members and reload with default seed data. This cannot be undone."
        confirmLabel="Reset Everything"
        variant="danger"
      />
    </div>
  );
}

// ── Departments tab ───────────────────────────────────────────────────────────
function DepartmentsTab() {
  const { state, dispatch } = useApp();
  const [newDept, setNewDept] = useState({ name: '', color: '#6366f1' });
  const [showAddDept, setShowAddDept] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deletingDept, setDeletingDept] = useState(null);

  function handleAddDept() {
    if (!newDept.name.trim()) return;
    dispatch({ type: 'ADD_DEPARTMENT', payload: { id: uuidv4(), companyId: state.currentUser?.companyId ?? state.impersonatedCompanyId, name: newDept.name.trim(), color: newDept.color, createdAt: new Date().toISOString() } });
    setNewDept({ name: '', color: '#6366f1' });
    setShowAddDept(false);
  }

  function handleSaveDept() {
    if (!editingDept.name.trim()) return;
    dispatch({ type: 'UPDATE_DEPARTMENT', payload: { ...editingDept, name: editingDept.name.trim() } });
    setEditingDept(null);
  }

  function handleDeleteDept(id) {
    dispatch({ type: 'DELETE_DEPARTMENT', payload: id });
    setDeletingDept(null);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Departments</h2>
          <p className="text-sm text-slate-500 mt-0.5">Organize your team and assign tasks to departments.</p>
        </div>
        <button
          onClick={() => { setShowAddDept(true); setEditingDept(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      <div className="space-y-2">
        {(state.departments || []).map(dept => (
          <div key={dept.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
            {editingDept?.id === dept.id ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  {DEPT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingDept(d => ({ ...d, color: c }))}
                      className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${editingDept.color === c ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={editingDept.name}
                  onChange={e => setEditingDept(d => ({ ...d, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveDept(); if (e.key === 'Escape') setEditingDept(null); }}
                  autoFocus
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={handleSaveDept} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                <button onClick={() => setEditingDept(null)} className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }} />
                <span className="flex-1 text-sm font-medium text-slate-700">{dept.name}</span>
                <span className="text-xs text-slate-400">
                  {state.teamMembers.filter(m => m.departmentId === dept.id).length} members
                </span>
                <button
                  onClick={() => { setEditingDept({ ...dept }); setShowAddDept(false); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeletingDept(dept)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        ))}

        {showAddDept && (
          <div className="flex items-center gap-3 p-3 border border-indigo-200 bg-indigo-50 rounded-lg">
            <div className="flex items-center gap-2 flex-wrap">
              {DEPT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewDept(d => ({ ...d, color: c }))}
                  className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${newDept.color === c ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              type="text"
              value={newDept.name}
              onChange={e => setNewDept(d => ({ ...d, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') handleAddDept(); if (e.key === 'Escape') setShowAddDept(false); }}
              placeholder="Department name"
              autoFocus
              className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={handleAddDept} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add</button>
            <button onClick={() => setShowAddDept(false)} className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
          </div>
        )}

        {(state.departments || []).length === 0 && !showAddDept && (
          <p className="text-sm text-slate-400 text-center py-6">No departments yet. Click Add to create one.</p>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        onConfirm={() => handleDeleteDept(deletingDept.id)}
        title="Delete Department"
        message={`Delete "${deletingDept?.name}"? Members and tasks assigned to it will become unassigned.`}
        confirmLabel="Delete Department"
        variant="danger"
      />
    </div>
  );
}

// ── Colors tab ────────────────────────────────────────────────────────────────
const UI_COLOR_FIELDS = [
  { key: 'sidebarBg',     label: 'Sidebar Background',  description: 'Main background color of the navigation sidebar.' },
  { key: 'sidebarAccent', label: 'Sidebar Active Item',  description: 'Highlight color for the currently selected menu item.' },
  { key: 'headerBg',      label: 'Header Background',   description: 'Background color of the top navigation bar.' },
  { key: 'headerBorder',  label: 'Header Border',       description: 'Bottom border color of the top navigation bar.' },
  { key: 'contentBg',     label: 'Content Background',  description: 'Background color of the main content area.' },
];

const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Light',
    description: 'Clean white interface',
    preview: (
      <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-200 flex">
        <div className="w-8 bg-slate-800 flex-shrink-0" />
        <div className="flex-1 bg-white flex flex-col">
          <div className="h-4 bg-slate-100 border-b border-slate-200" />
          <div className="flex-1 p-1.5 space-y-1">
            <div className="h-1.5 w-3/4 bg-slate-200 rounded" />
            <div className="h-1.5 w-1/2 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes',
    preview: (
      <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-600 flex">
        <div className="w-8 bg-slate-900 flex-shrink-0" />
        <div className="flex-1 bg-slate-800 flex flex-col">
          <div className="h-4 bg-slate-700 border-b border-slate-600" />
          <div className="flex-1 p-1.5 space-y-1">
            <div className="h-1.5 w-3/4 bg-slate-600 rounded" />
            <div className="h-1.5 w-1/2 bg-slate-600 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'system',
    label: 'System',
    description: 'Follows your OS setting',
    preview: (
      <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-200 flex">
        <div className="w-8 bg-slate-800 flex-shrink-0" />
        <div className="flex-1 flex flex-col">
          <div className="h-4 border-b" style={{ background: 'linear-gradient(to right, #f1f5f9 50%, #334155 50%)', borderColor: '#cbd5e1' }} />
          <div className="flex-1 flex">
            <div className="flex-1 bg-white p-1.5 space-y-1">
              <div className="h-1.5 w-3/4 bg-slate-200 rounded" />
              <div className="h-1.5 w-1/2 bg-slate-200 rounded" />
            </div>
            <div className="flex-1 bg-slate-800 p-1.5 space-y-1">
              <div className="h-1.5 w-3/4 bg-slate-600 rounded" />
              <div className="h-1.5 w-1/2 bg-slate-600 rounded" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

function ColorsTab() {
  const { state, dispatch } = useApp();
  const uiColors = state.uiColors ?? defaultUiColors;

  // Local UI color state — only dispatched on "Save Changes"
  const [localUiColors, setLocalUiColors] = useState(() => ({ ...uiColors }));
  const [uiColorsSaved, setUiColorsSaved] = useState(false);
  const [confirmResetUi, setConfirmResetUi] = useState(false);

  function updateLocalUiColor(key, value) {
    setLocalUiColors(prev => ({ ...prev, [key]: value }));
    setUiColorsSaved(false);
  }

  function saveUiColors() {
    dispatch({ type: 'UPDATE_UI_COLORS', payload: localUiColors });
    setUiColorsSaved(true);
    setTimeout(() => setUiColorsSaved(false), 2000);
  }

  function resetUiColors() {
    const defaults = state.themeMode === 'dark' ? defaultDarkUiColors : defaultUiColors;
    setLocalUiColors({ ...defaults });
    dispatch({ type: 'UPDATE_UI_COLORS', payload: defaults });
    setUiColorsSaved(false);
  }

  // Completion color config
  const [localConfig, setLocalConfig] = useState(() => ({
    ranges: state.colorConfig.ranges.map(r => ({ ...r })),
  }));
  const [saved, setSaved] = useState(false);
  const [confirmResetColors, setConfirmResetColors] = useState(false);

  function updateRange(index, field, value) {
    setLocalConfig(prev => ({
      ranges: prev.ranges.map((r, i) => i === index ? { ...r, [field]: value } : r),
    }));
    setSaved(false);
  }

  function handleSave() {
    dispatch({ type: 'UPDATE_COLOR_CONFIG', payload: localConfig });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    const defaults = {
      ranges: [
        { min: 0,   max: 33,  color: '#ef4444', label: 'Not Started' },
        { min: 34,  max: 66,  color: '#f59e0b', label: 'In Progress' },
        { min: 67,  max: 99,  color: '#3b82f6', label: 'Nearly Done' },
        { min: 100, max: 100, color: '#22c55e', label: 'Complete' },
      ],
    };
    setLocalConfig(defaults);
    dispatch({ type: 'UPDATE_COLOR_CONFIG', payload: defaults });
    setSaved(false);
  }

  const previewPercentages = [0, 15, 33, 50, 66, 80, 99, 100];

  return (
    <div className="space-y-6">

      {/* Theme Mode */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Theme Mode</h2>
        <p className="text-sm text-slate-500 mb-5">Choose how the interface appears. System mode follows your OS preference.</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(opt => {
            const active = (state.themeMode || 'light') === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => dispatch({ type: 'SET_THEME_MODE', payload: opt.id })}
                className={`flex flex-col gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                  active
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {opt.preview}
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${active ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                    active ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                  }`}>
                    {active && (
                      <svg className="w-full h-full text-white" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* UI Theme Colors */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">UI Theme Colors</h2>
            <p className="text-sm text-slate-500 mt-0.5">Customize the sidebar and header bar colors.</p>
          </div>
          <button
            onClick={() => setConfirmResetUi(true)}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Reset to defaults
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {UI_COLOR_FIELDS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl">
              <div className="relative flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-xl border-2 border-slate-200 overflow-hidden cursor-pointer"
                  style={{ backgroundColor: localUiColors[key] }}
                >
                  <input
                    type="color"
                    value={localUiColors[key]}
                    onChange={e => updateLocalUiColor(key, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <span className="block text-center text-xs text-slate-400 font-mono mt-1">{localUiColors[key]}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live mini-preview using localUiColors */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Preview</p>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 72 }}>
            <div className="flex flex-col justify-between px-2 py-2 w-32 flex-shrink-0" style={{ backgroundColor: localUiColors.sidebarBg }}>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-indigo-500 flex-shrink-0" />
                <span className="text-white text-xs font-bold truncate" style={{ fontSize: 9 }}>ProjectHub</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="rounded px-1.5 py-0.5 text-white text-xs" style={{ backgroundColor: localUiColors.sidebarAccent, fontSize: 9 }}>Dashboard</div>
                <div className="rounded px-1.5 py-0.5 text-slate-400" style={{ fontSize: 9 }}>Projects</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="px-3 flex items-center justify-between border-b flex-shrink-0" style={{ backgroundColor: localUiColors.headerBg, borderColor: localUiColors.headerBorder, height: 28 }}>
                <span className="text-xs font-semibold" style={{ fontSize: 9, color: localUiColors.headerBg === '#ffffff' || parseInt(localUiColors.headerBg.replace('#','').substring(0,2),16) > 128 ? '#1e293b' : '#ffffff' }}>Dashboard</span>
                <div className="w-10 h-3 rounded-full bg-slate-200" />
              </div>
              <div className="flex-1 px-3 py-1.5" style={{ backgroundColor: localUiColors.contentBg || '#f8fafc' }}>
                <div className="h-2 w-3/4 bg-slate-200 rounded mb-1" />
                <div className="h-2 w-1/2 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={saveUiColors}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save Changes
          </button>
          {uiColorsSaved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </div>
          )}
        </div>
      </div>

      {/* Completion Color Ranges */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Completion Color Ranges</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure how task completion percentages map to colors across the app.
            </p>
          </div>
          <button onClick={() => setConfirmResetColors(true)} className="text-sm text-slate-500 hover:text-slate-700 underline">
            Reset to defaults
          </button>
        </div>

        <div className="space-y-4">
          {localConfig.ranges.map((range, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-xl border-2 border-slate-200 overflow-hidden cursor-pointer relative"
                    style={{ backgroundColor: range.color }}
                  >
                    <input
                      type="color"
                      value={range.color}
                      onChange={e => updateRange(i, 'color', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Pick color"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{range.color}</span>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={range.label}
                    onChange={e => updateRange(i, 'label', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Range</label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-mono bg-slate-100 px-2 py-1.5 rounded text-slate-700">{range.min}%</div>
                    <span className="text-slate-400">—</span>
                    <div className="text-sm font-mono bg-slate-100 px-2 py-1.5 rounded text-slate-700">{range.max}%</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Preview</label>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: range.color }}
                  >
                    {range.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save Changes
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Preview</h2>
        <p className="text-sm text-slate-500 mb-5">
          How tasks look at various completion percentages with the current configuration.
        </p>
        <div className="space-y-3">
          {previewPercentages.map(pct => {
            const color = getCompletionColor(pct, localConfig);
            const range = localConfig.ranges.find(r => pct >= r.min && pct <= r.max);
            return (
              <div key={pct} className="flex items-center gap-4">
                <div className="w-12 text-right text-sm font-mono text-slate-600">{pct}%</div>
                <div className="flex-1">
                  <div className="h-5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded text-white w-28 text-center"
                  style={{ backgroundColor: color }}
                >
                  {range?.label || ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm modals */}
      <ConfirmModal
        isOpen={confirmResetUi}
        onClose={() => setConfirmResetUi(false)}
        onConfirm={resetUiColors}
        title="Reset UI Theme Colors"
        message="This will restore the sidebar and header colors to their original defaults."
        confirmLabel="Reset to Defaults"
        variant="warning"
      />
      <ConfirmModal
        isOpen={confirmResetColors}
        onClose={() => setConfirmResetColors(false)}
        onConfirm={handleReset}
        title="Reset Completion Colors"
        message="This will restore all completion color ranges to their original defaults."
        confirmLabel="Reset to Defaults"
        variant="warning"
      />
    </div>
  );
}

// ── Main Settings component ───────────────────────────────────────────────────
export default function Settings() {
  const { state } = useApp();
  const isSuperAdmin = state.currentUser?.isSuperAdmin;
  const tabs = isSuperAdmin ? [...SUPER_ADMIN_TABS, ...BASE_TABS] : BASE_TABS;
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'companies' : 'company');

  if (!isAdmin(state.currentUser)) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm">Only administrators can access Settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'companies'       && <CompaniesTab />}
      {activeTab === 'company'         && <CompanyTab />}
      {activeTab === 'project-members' && <ProjectMembersTab />}
      {activeTab === 'departments'     && <DepartmentsTab />}
      {activeTab === 'colors'          && <ColorsTab />}
    </div>
  );
}
