import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

export const Layout: React.FC = () => {
  const { user } = useAuthStore();
  const { sidebarOpen } = useAppStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Sidebar />
      <main
        className={`
          min-h-screen transition-all duration-300
          ${sidebarOpen ? 'ml-64' : 'ml-20'}
        `}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

