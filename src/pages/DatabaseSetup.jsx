import React, { useState } from 'react';
import { api } from '../api/client.js';

const STEPS = ['connect', 'setup', 'done'];

function Field({ label, name, value, onChange, type = 'text', placeholder, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function DatabaseSetup({ onComplete }) {
  const [config, setConfig] = useState({
    server: '',
    port: '1433',
    database: 'ProjectHub',
    user: '',
    password: '',
    encrypt: false,
    trustServerCertificate: true,
  });
  const [step, setStep] = useState('connect'); // connect | setup | done
  const [testStatus, setTestStatus] = useState(null);  // null | 'testing' | 'ok' | 'fail'
  const [testMsg, setTestMsg]       = useState('');
  const [setupStatus, setSetupStatus] = useState(null); // null | 'running' | 'ok' | 'fail'
  const [setupMsg, setSetupMsg]       = useState('');
  const [seedStatus, setSeedStatus]   = useState(null); // null | 'loading' | 'ok' | 'fail'
  const [seedMsg, setSeedMsg]         = useState('');

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setConfig(c => ({ ...c, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleTest() {
    setTestStatus('testing');
    setTestMsg('');
    try {
      await api.post('/db/test', config);
      setTestStatus('ok');
      setTestMsg('Connection successful — credentials are valid.');
    } catch (e) {
      setTestStatus('fail');
      setTestMsg(
        e.message === 'Failed to fetch'
          ? 'Cannot reach the ProjectHub server. Make sure it is running (npm run dev).'
          : e.message
      );
    }
  }

  async function handleSetup() {
    setSetupStatus('running');
    setSetupMsg('');
    try {
      const result = await api.post('/db/setup', config);
      setSetupStatus('ok');
      setSetupMsg(result.message || 'Database created and tables configured.');
      setStep('done');
    } catch (e) {
      setSetupStatus('fail');
      setSetupMsg(
        e.message === 'Failed to fetch'
          ? 'Cannot reach the ProjectHub server. Make sure it is running (npm run dev).'
          : e.message
      );
    }
  }

  async function handleSeed() {
    setSeedStatus('loading');
    setSeedMsg('');
    try {
      const result = await api.post('/db/seed', {});
      setSeedStatus('ok');
      setSeedMsg(result.message || 'Demo data loaded.');
    } catch (e) {
      setSeedStatus('fail');
      setSeedMsg(e.message);
    }
  }

  function StatusBadge({ status, msg }) {
    if (!status) return null;
    const map = {
      testing: { cls: 'bg-blue-50 border-blue-200 text-blue-700',   icon: '⏳' },
      running: { cls: 'bg-blue-50 border-blue-200 text-blue-700',   icon: '⏳' },
      loading: { cls: 'bg-blue-50 border-blue-200 text-blue-700',   icon: '⏳' },
      ok:      { cls: 'bg-green-50 border-green-200 text-green-700', icon: '✓'  },
      fail:    { cls: 'bg-red-50 border-red-200 text-red-700',       icon: '✗'  },
    };
    const { cls, icon } = map[status] || {};
    return (
      <div className={`mt-2 p-3 rounded-lg border text-sm flex items-start gap-2 ${cls}`}>
        <span className="font-bold flex-shrink-0">{icon}</span>
        <span>{msg}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M9 11h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Database Setup</h1>
          <p className="text-slate-500 text-sm mt-1">Connect ProjectHub to Microsoft SQL Server</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">

          {/* ── Step 1: Connection details ─────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              1 · SQL Server Connection
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Server" name="server" value={config.server} onChange={handleChange}
                    placeholder="myserver.database.windows.net"
                    hint="Hostname or IP address" />
                </div>
                <Field label="Port" name="port" value={config.port} onChange={handleChange}
                  placeholder="1433" />
              </div>
              <Field label="Database Name" name="database" value={config.database} onChange={handleChange}
                placeholder="ProjectHub"
                hint="Will be created if it doesn't exist" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Username" name="user" value={config.user} onChange={handleChange}
                  placeholder="sa" />
                <Field label="Password" name="password" value={config.password}
                  onChange={handleChange} type="password" placeholder="••••••••" />
              </div>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" name="encrypt" checked={config.encrypt}
                    onChange={handleChange} className="accent-indigo-600" />
                  Encrypt connection
                  <span className="text-xs text-slate-400">(enable for Azure SQL)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" name="trustServerCertificate"
                    checked={config.trustServerCertificate} onChange={handleChange}
                    className="accent-indigo-600" />
                  Trust server certificate
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleTest}
                disabled={testStatus === 'testing' || !config.server || !config.user}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                {testStatus === 'testing' ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                Test Connection
              </button>
              {testStatus === 'ok' && (
                <span className="text-xs text-green-600 font-medium">✓ Connected</span>
              )}
            </div>
            <StatusBadge status={testStatus === 'testing' ? null : testStatus} msg={testMsg} />
          </div>

          <hr className="border-slate-100" />

          {/* ── Step 2: Create database & tables ──────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
              2 · Create Database &amp; Tables
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Creates the database if it doesn't exist, then runs all table creation scripts.
              Safe to run multiple times — existing tables are never dropped.
            </p>
            <button
              onClick={handleSetup}
              disabled={setupStatus === 'running' || !config.server || !config.user || step === 'done'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {setupStatus === 'running' ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16" />
                </svg>
              )}
              {step === 'done' ? '✓ Database Ready' : 'Create Database & Tables'}
            </button>
            <StatusBadge status={setupStatus === 'running' ? 'running' : setupStatus} msg={setupMsg} />
          </div>

          {/* ── Step 3: Load demo data (optional) ─────────────────────────── */}
          {step === 'done' && (
            <>
              <hr className="border-slate-100" />
              <div>
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  3 · Load Demo Data <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Inserts sample companies, team members, projects, and tasks so you can explore the app right away.
                  Skip this if you're setting up for real use.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSeed}
                    disabled={seedStatus === 'loading' || seedStatus === 'ok'}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {seedStatus === 'loading' ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                    {seedStatus === 'ok' ? '✓ Demo Data Loaded' : 'Load Demo Data'}
                  </button>
                  <button
                    onClick={onComplete}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Open ProjectHub →
                  </button>
                </div>
                <StatusBadge status={seedStatus === 'loading' ? 'loading' : seedStatus} msg={seedMsg} />
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Connection settings are stored in <code className="font-mono">server/db-config.json</code> on the server.
        </p>
      </div>
    </div>
  );
}
