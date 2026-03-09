import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
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

  // First-time setup: no companies configured yet
  if (state.companies.length === 0) return <SetupWizard />;

  // Not logged in: show login
  if (!state.currentUser) return <Login />;

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
