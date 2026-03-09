import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import { isAdmin, ROLE_LABELS } from '../utils/auth';
import { getCompletionColor } from '../utils/colors';
import Avatar from '../components/UI/Avatar';

const DEPT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

const TABS = [
  { id: 'company',         label: 'Company' },
  { id: 'project-members', label: 'Project Members' },
  { id: 'departments',     label: 'Departments' },
  { id: 'colors',          label: 'Colors' },
];

// ── Project Members tab ───────────────────────────────────────────────────────
function ProjectMembersTab() {
  const { state, dispatch } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState(
    state.projects[0]?.id ?? null
  );

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
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{selectedProject.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                Project Role determines what a member can do within this project.
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
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={assigned}
                      onChange={() => toggleMember(member.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer accent-indigo-600"
                    />

                    {/* Member info */}
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

                    {/* Global role badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      member.role === 'admin'           ? 'bg-indigo-100 text-indigo-700' :
                      member.role === 'project_manager' ? 'bg-amber-100 text-amber-700' :
                                                          'bg-slate-100 text-slate-600'
                    }`}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>

                    {/* Project role selector */}
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

  function handleSaveCompany() {
    dispatch({ type: 'UPDATE_COMPANY_NAME', payload: companyName.trim() || 'ProjectHub' });
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2000);
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
            onClick={() => {
              if (confirm('This will clear ALL data and reload with seed data. Are you sure?')) {
                localStorage.removeItem('project_manager_state');
                window.location.reload();
              }
            }}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Reset all data to defaults
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Departments tab ───────────────────────────────────────────────────────────
function DepartmentsTab() {
  const { state, dispatch } = useApp();
  const [newDept, setNewDept] = useState({ name: '', color: '#6366f1' });
  const [showAddDept, setShowAddDept] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  function handleAddDept() {
    if (!newDept.name.trim()) return;
    dispatch({ type: 'ADD_DEPARTMENT', payload: { id: uuidv4(), name: newDept.name.trim(), color: newDept.color, createdAt: new Date().toISOString() } });
    setNewDept({ name: '', color: '#6366f1' });
    setShowAddDept(false);
  }

  function handleSaveDept() {
    if (!editingDept.name.trim()) return;
    dispatch({ type: 'UPDATE_DEPARTMENT', payload: { ...editingDept, name: editingDept.name.trim() } });
    setEditingDept(null);
  }

  function handleDeleteDept(id) {
    if (confirm('Delete this department? Members and tasks assigned to it will become unassigned.')) {
      dispatch({ type: 'DELETE_DEPARTMENT', payload: id });
    }
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
                  onClick={() => handleDeleteDept(dept.id)}
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
    </div>
  );
}

// ── Colors tab ────────────────────────────────────────────────────────────────
function ColorsTab() {
  const { state, dispatch } = useApp();
  const [localConfig, setLocalConfig] = useState(() => ({
    ranges: state.colorConfig.ranges.map(r => ({ ...r })),
  }));
  const [saved, setSaved] = useState(false);

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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Completion Color Ranges</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure how task completion percentages map to colors across the app.
            </p>
          </div>
          <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700 underline">
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
    </div>
  );
}

// ── Main Settings component ───────────────────────────────────────────────────
export default function Settings() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('company');

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
        {TABS.map(tab => (
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

      {activeTab === 'company'         && <CompanyTab />}
      {activeTab === 'project-members' && <ProjectMembersTab />}
      {activeTab === 'departments'     && <DepartmentsTab />}
      {activeTab === 'colors'          && <ColorsTab />}
    </div>
  );
}
