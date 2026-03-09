import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import { hashPassword } from '../utils/auth';
import { seedCompanies, seedTeamMembers, seedProjects, seedTasks, seedDepartments } from '../utils/seeds';

const AVATAR_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

export default function SetupWizard() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(1);

  // Step 1: Company
  const [companyName, setCompanyName] = useState('');
  const [companyError, setCompanyError] = useState('');

  // Step 2: Admin user
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [avatarColor, setAvatarColor] = useState('#6366f1');
  const [adminErrors, setAdminErrors] = useState({});

  // Step 3: Load demo data option
  const [loadDemo, setLoadDemo] = useState(false);

  function handleStep1(e) {
    e.preventDefault();
    if (!companyName.trim()) { setCompanyError('Company name is required'); return; }
    setCompanyError('');
    setStep(2);
  }

  function handleStep2(e) {
    e.preventDefault();
    const errs = {};
    if (!adminName.trim()) errs.name = 'Name is required';
    if (!adminEmail.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(adminEmail)) errs.email = 'Invalid email';
    if (!adminPassword.trim()) errs.password = 'Password is required';
    if (Object.keys(errs).length > 0) { setAdminErrors(errs); return; }
    setAdminErrors({});
    setStep(3);
  }

  function handleFinish() {
    const companyId = uuidv4();

    dispatch({
      type: 'ADD_COMPANY',
      payload: { id: companyId, name: companyName.trim(), createdAt: new Date().toISOString() },
    });

    dispatch({
      type: 'ADD_MEMBER',
      payload: {
        id: uuidv4(),
        companyId,
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: hashPassword(adminPassword.trim()),
        role: 'admin',
        avatarColor,
        departmentId: null,
        isDisabled: false,
        createdAt: new Date().toISOString(),
      },
    });

    if (loadDemo) {
      // Load demo data re-keyed to this company
      seedCompanies; // already dispatched above
      seedTeamMembers.forEach(m => {
        dispatch({ type: 'ADD_MEMBER', payload: { ...m, companyId, id: uuidv4(), email: m.email.replace('@example.com', `@${companyId.slice(0,6)}.demo`) } });
      });
      seedProjects.forEach(p => {
        dispatch({ type: 'ADD_PROJECT', payload: { ...p, companyId, id: 'demo-' + p.id } });
      });
      seedTasks.forEach(t => {
        dispatch({ type: 'ADD_TASK', payload: { ...t, id: 'demo-' + t.id } });
      });
      seedDepartments.forEach(d => {
        dispatch({ type: 'ADD_DEPARTMENT', payload: d });
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to ProjectHub</h1>
          <p className="text-slate-500 text-sm mt-1">Let's get your workspace set up</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s < step ? 'bg-indigo-600 text-white' :
                s === step ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' :
                'bg-slate-200 text-slate-500'
              }`}>
                {s < step ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-10 ${s < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {/* Step 1: Company */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Company Details</h2>
                <p className="text-sm text-slate-500">What's the name of your organization?</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => { setCompanyName(e.target.value); setCompanyError(''); }}
                  placeholder="Acme Corp"
                  autoFocus
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {companyError && <p className="text-red-500 text-xs mt-1">{companyError}</p>}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Admin account */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Admin Account</h2>
                <p className="text-sm text-slate-500">Create the administrator account for <strong>{companyName}</strong>.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => { setAdminName(e.target.value); setAdminErrors(p => ({ ...p, name: '' })); }}
                  placeholder="Jane Smith"
                  autoFocus
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {adminErrors.name && <p className="text-red-500 text-xs mt-1">{adminErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => { setAdminEmail(e.target.value); setAdminErrors(p => ({ ...p, email: '' })); }}
                  placeholder="admin@yourcompany.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {adminErrors.email && <p className="text-red-500 text-xs mt-1">{adminErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => { setAdminPassword(e.target.value); setAdminErrors(p => ({ ...p, password: '' })); }}
                  placeholder="Set a strong password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">Default is "admin" — change it now or after first login.</p>
                {adminErrors.password && <p className="text-red-500 text-xs mt-1">{adminErrors.password}</p>}
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
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Finish */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Ready to Launch</h2>
                <p className="text-sm text-slate-500">Review your setup before finishing.</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Company</span>
                  <span className="font-medium text-slate-800">{companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin</span>
                  <span className="font-medium text-slate-800">{adminName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-800">{adminEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Password</span>
                  <span className="font-medium text-slate-800">{'•'.repeat(adminPassword.length)}</span>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={loadDemo}
                  onChange={e => setLoadDemo(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">Load demo data</p>
                  <p className="text-xs text-slate-400">Populate with sample projects, tasks, and team members to explore the app.</p>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
