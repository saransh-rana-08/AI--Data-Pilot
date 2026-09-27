import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ConnectionModal from '../modals/ConnectionModal';
import CommandPalette from './CommandPalette';
import ToastContainer from './ToastContainer';
import { useDatabase } from '../../context/DatabaseContext';
import DashboardPage from '../../pages/DashboardPage';
import QueryPage from '../../pages/QueryPage';
import DatabasePage from '../../pages/DatabasePage';
import HistoryPage from '../../pages/HistoryPage';
import SettingsPage from '../../pages/SettingsPage';

export default function Layout() {
  const { currentView } = useDatabase();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderActivePage = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'query':
        return <QueryPage />;
      case 'database':
        return <DatabasePage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-dark-950 text-dark-100 overflow-hidden select-text">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <ConnectionModal />
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}
