import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import ChangePassword from './pages/ChangePassword';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import DatabaseSetup from './pages/DatabaseSetup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Team from './pages/Team';
import Calendar from './pages/Calendar';
import Board from './pages/Board';
import Gantt from './pages/Gantt';
import Settings from './pages/Settings';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500">Connecting to server…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-800 mb-2">Cannot reach server</h2>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <p className="text-xs text-slate-400">
          Make sure the ProjectHub server is running (<code className="font-mono">node server/index.js</code>)
          and try refreshing.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function AppGate() {
  const { state, apiStatus, reinitialize } = useApp();
  const { currentUser, companies, impersonatedCompanyId } = state;

  // 0. Still loading from API
  if (apiStatus.loading) return <LoadingScreen />;

  // 0a. Server unreachable
  if (apiStatus.error) return <ErrorScreen error={apiStatus.error} />;

  // 0b. DB not yet configured — show setup screen (no auth required)
  if (!apiStatus.dbConfigured) return <DatabaseSetup onComplete={reinitialize} />;

  // 1. First-time setup: no companies and not super-admin
  if (companies.length === 0 && !currentUser?.isSuperAdmin) return <SetupWizard />;

  // 2. Not logged in
  if (!currentUser) return <Login />;

  // 3. Super-admin must change default password
  if (currentUser.isSuperAdmin && currentUser.mustChangePassword) return <ChangePassword />;

  // 4. Super-admin not impersonating → company management dashboard
  if (currentUser.isSuperAdmin && !impersonatedCompanyId) return <SuperAdminDashboard />;

  // 5. Normal app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/team" element={<Team />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/board" element={<Board />} />
        <Route path="/gantt" element={<Gantt />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppGate />
      </BrowserRouter>
    </AppProvider>
  );
}
