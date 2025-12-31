import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { ToastContainer } from '../ui/Toast';
import { ChatWidget } from '../chat/ChatWidget';
import { useAuthStore } from '../../store/authStore';

export const Layout: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <TopBar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
      <ChatWidget />
    </div>
  );
};


