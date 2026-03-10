import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import { canDo, isAdmin, hashPassword, ROLE_LABELS } from '../utils/auth';
import Modal from '../components/UI/Modal';
import Avatar from '../components/UI/Avatar';
import Pagination from '../components/UI/Pagination';
import ConfirmModal from '../components/UI/ConfirmModal';
import { formatDate } from '../utils/dates';

const AVATAR_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

function MemberForm({ member, departments, onSave, onClose }) {
  const [name, setName] = useState(member?.name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [role, setRole] = useState(member?.role || 'user');
  const [departmentId, setDepartmentId] = useState(member?.departmentId || '');
  const [avatarColor, setAvatarColor] = useState(member?.avatarColor || '#6366f1');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email';
    if (!member && !password.trim()) errs.password = 'Password is required for new members';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const updates = { name: name.trim(), email: email.trim(), role, departmentId: departmentId || null, avatarColor };
    if (password.trim()) updates.password = hashPassword(password.trim());
    onSave(updates);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4 mb-2">
        <Avatar name={name || '?'} color={avatarColor} size="xl" />
        <div>
          <p className="text-sm font-medium text-slate-700">Avatar Preview</p>
          <p className="text-xs text-slate-400">Based on name initials</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
          placeholder="John Doe"
          autoFocus
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
          placeholder="john@example.com"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Password {member ? <span className="text-slate-400 font-normal">(leave blank to keep current)</span> : <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
          placeholder={member ? '••••••••' : 'Set a password'}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="user">User</option>
            <option value="project_manager">Project Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
          <select
            value={departmentId}
            onChange={e => setDepartmentId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">No department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Avatar Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {AVATAR_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setAvatarColor(c)}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${avatarColor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={avatarColor}
            onChange={e => setAvatarColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-slate-300"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
          {member ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </form>
  );
}

export default function Team() {
  const { state, dispatch } = useApp();
  const canManage = canDo(state.currentUser, 'project_manager');
  const userIsAdmin = isAdmin(state.currentUser);
  const [createMember, setCreateMember] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [deleteMember, setDeleteMember] = useState(null);
  const [toggleDisableMember, setToggleDisableMember] = useState(null);
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(10);

  // AppContext already scopes teamMembers to the active company
  const companyMembers = state.teamMembers;

  function handleCreateMember(data) {
    dispatch({
      type: 'ADD_MEMBER',
      payload: {
        ...data,
        id: uuidv4(),
        companyId: state.impersonatedCompanyId ?? state.currentUser?.companyId,
        isDisabled: false,
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      },
    });
    setCreateMember(false);
  }

  function handleEditMember(data) {
    dispatch({ type: 'UPDATE_MEMBER', payload: { ...editMember, ...data } });
    setEditMember(null);
  }

  function handleDeleteMember(id) {
    dispatch({ type: 'DELETE_MEMBER', payload: id });
    setDeleteMember(null);
  }

  function handleToggleDisable(member) {
    dispatch({ type: 'UPDATE_MEMBER', payload: { ...member, isDisabled: !member.isDisabled } });
    setToggleDisableMember(null);
  }

  const paginatedMembers = companyMembers.slice(
    (memberPage - 1) * memberPageSize,
    memberPage * memberPageSize
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Members</h2>
          <p className="text-sm text-slate-500">{companyMembers.length} member{companyMembers.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setCreateMember(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedMembers.map(member => {
          const taskCount = state.tasks.filter(t => t.assigneeId === member.id).length;
          const activeTasks = state.tasks.filter(t => t.assigneeId === member.id && t.status !== 'done').length;
          const isSelf = member.id === state.currentUser?.id;

          return (
            <div
              key={member.id}
              className={`bg-white rounded-xl border shadow-sm p-5 transition-opacity ${
                member.isDisabled ? 'opacity-60 border-slate-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={member.name} color={member.avatarColor} size="lg" />
                    {member.isDisabled && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{member.name}</h3>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => setEditMember(member)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {/* Disable/Enable — admins only, can't disable yourself */}
                    {userIsAdmin && !isSelf && (
                      <button
                        onClick={() => setToggleDisableMember(member)}
                        className={`p-1.5 rounded-lg ${
                          member.isDisabled
                            ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                            : 'text-amber-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        title={member.isDisabled ? 'Enable account' : 'Disable account'}
                      >
                        {member.isDisabled ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        )}
                      </button>
                    )}
                    <button onClick={() => setDeleteMember(member)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  member.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                  member.role === 'project_manager' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {ROLE_LABELS[member.role] || member.role}
                </span>
                {member.isDisabled && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                    Disabled
                  </span>
                )}
                <span className="text-xs text-slate-400">Since {formatDate(member.createdAt)}</span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{taskCount}</p>
                  <p className="text-xs text-slate-500">Total tasks</p>
                </div>
                <div>
                  <p className="font-semibold text-amber-500">{activeTasks}</p>
                  <p className="text-xs text-slate-500">Active</p>
                </div>
                <div>
                  <p className="font-semibold text-green-500">{taskCount - activeTasks}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </div>
            </div>
          );
        })}
        {companyMembers.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400 text-sm">
            No team members yet. Add your first member.
          </div>
        )}
      </div>

      {companyMembers.length > 0 && (
        <Pagination
          total={companyMembers.length}
          page={memberPage}
          pageSize={memberPageSize}
          onPage={setMemberPage}
          onPageSize={p => { setMemberPageSize(p); setMemberPage(1); }}
        />
      )}

      <Modal isOpen={createMember} onClose={() => setCreateMember(false)} title="Add Team Member">
        <MemberForm departments={state.departments} onSave={handleCreateMember} onClose={() => setCreateMember(false)} />
      </Modal>
      <Modal isOpen={!!editMember} onClose={() => setEditMember(null)} title="Edit Team Member">
        {editMember && <MemberForm member={editMember} departments={state.departments} onSave={handleEditMember} onClose={() => setEditMember(null)} />}
      </Modal>
      <ConfirmModal
        isOpen={!!deleteMember}
        onClose={() => setDeleteMember(null)}
        onConfirm={() => handleDeleteMember(deleteMember?.id)}
        title="Remove Member"
        message={deleteMember ? `Remove ${deleteMember.name} from the team? Their tasks will be unassigned.` : ''}
        confirmLabel="Remove Member"
        variant="danger"
      />
      <ConfirmModal
        isOpen={!!toggleDisableMember}
        onClose={() => setToggleDisableMember(null)}
        onConfirm={() => handleToggleDisable(toggleDisableMember)}
        title={toggleDisableMember?.isDisabled ? 'Enable Account' : 'Disable Account'}
        message={toggleDisableMember
          ? toggleDisableMember.isDisabled
            ? `Re-enable ${toggleDisableMember.name}'s account? They will be able to log in again.`
            : `Disable ${toggleDisableMember.name}'s account? They will no longer be able to log in.`
          : ''}
        confirmLabel={toggleDisableMember?.isDisabled ? 'Enable Account' : 'Disable Account'}
        variant={toggleDisableMember?.isDisabled ? 'warning' : 'danger'}
      />
    </div>
  );
}
