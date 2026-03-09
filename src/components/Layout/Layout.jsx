import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ImpersonationBanner from '../ImpersonationBanner';
import { useApp } from '../../context/AppContext';

export default function Layout() {
  const { state } = useApp();
  const contentBg = state.uiColors?.contentBg || '#f8fafc';

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: contentBg }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <ImpersonationBanner />
        <Header />
        <main className="flex-1 overflow-auto" style={{ backgroundColor: contentBg }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
