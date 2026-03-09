import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import ChangePassword from './pages/ChangePassword';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Team from './pages/Team';
import Calendar from './pages/Calendar';
import Board from './pages/Board';
import Gantt from './pages/Gantt';
import Settings from './pages/Settings';

function AppGate() {
  const { state } = useApp();
  const { currentUser, companies, impersonatedCompanyId } = state;

  // 1. First-time setup: no companies at all and not the super-admin
  if (companies.length === 0 && !currentUser?.isSuperAdmin) return <SetupWizard />;

  // 2. Not logged in
  if (!currentUser) return <Login />;

  // 3. Super-admin must change default password before doing anything
  if (currentUser.isSuperAdmin && currentUser.mustChangePassword) return <ChangePassword />;

  // 4. Super-admin not impersonating → company management dashboard
  if (currentUser.isSuperAdmin && !impersonatedCompanyId) return <SuperAdminDashboard />;

  // 5. Normal app (logged-in company user, or super-admin impersonating a company)
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
