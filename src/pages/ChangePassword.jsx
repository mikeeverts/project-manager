import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { hashPassword } from '../utils/auth';

export default function ChangePassword() {
  const { state, dispatch } = useApp();
  const { currentUser } = state;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors]                   = useState({});
  const [saved, setSaved]                     = useState(false);

  const storedHash = currentUser?.isSuperAdmin
    ? state.siteOwner?.password
    : currentUser?.password;

  function validate() {
    const errs = {};
    if (!currentPassword) errs.current = 'Current password is required';
    else if (hashPassword(currentPassword) !== storedHash) errs.current = 'Current password is incorrect';
    if (!newPassword) errs.new = 'New password is required';
    else if (newPassword.length < 6) errs.new = 'Must be at least 6 characters';
    else if (newPassword === 'admin') errs.new = 'Choose a more secure password';
    if (newPassword && confirmPassword !== newPassword) errs.confirm = 'Passwords do not match';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const hashed = hashPassword(newPassword);

    if (currentUser.isSuperAdmin) {
      dispatch({ type: 'UPDATE_SITE_OWNER', payload: { password: hashed, mustChangePassword: false } });
    } else {
      const member = state.teamMembers.find(m => m.id === currentUser.id);
      if (member) {
        dispatch({ type: 'UPDATE_MEMBER', payload: { ...member, password: hashed, mustChangePassword: false } });
      }
    }
    dispatch({ type: 'UPDATE_CURRENT_USER', payload: { mustChangePassword: false } });
    setSaved(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Change Password</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            You must set a new password before continuing.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {saved ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-700 font-medium">Password updated!</p>
              <p className="text-slate-500 text-sm">You now have full access.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input type="password" value={currentPassword}
                  onChange={e => { setCurrentPassword(e.target.value); setErrors(p => ({ ...p, current: '' })); }}
                  placeholder="••••••••" autoFocus
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {errors.current && <p className="text-red-500 text-xs mt-1">{errors.current}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input type="password" value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setErrors(p => ({ ...p, new: '', confirm: '' })); }}
                  placeholder="Min. 6 characters"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {errors.new && <p className="text-red-500 text-xs mt-1">{errors.new}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
              </div>
              <button type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors mt-2">
                Set New Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
