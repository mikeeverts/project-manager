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


function AppGate() {
  const { state, apiStatus, reinitialize } = useApp();
  const { currentUser, companies, impersonatedCompanyId } = state;

  // 0. Still loading from API
  if (apiStatus.loading) return <LoadingScreen />;

  // 1. No DB connection or not configured — show setup page
  if (apiStatus.error || !apiStatus.dbConfigured) return <DatabaseSetup onComplete={reinitialize} />;

  // 2. Not logged in
  if (!currentUser) return <Login />;

  // 3. First-time setup: no companies and not super-admin
  if (companies.length === 0 && !currentUser?.isSuperAdmin) return <SetupWizard />;

  // 4. Super-admin must change default password (only after DB is ready)
  if (currentUser.isSuperAdmin && currentUser.mustChangePassword) return <ChangePassword />;

  // 5. Super-admin not impersonating → company management dashboard
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
