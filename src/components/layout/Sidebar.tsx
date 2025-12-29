import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  FileCode,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboards' },
  { path: '/connections', icon: Database, label: 'Connections' },
  { path: '/sql-editor', icon: FileCode, label: 'SQL Editor' },
  { path: '/charts', icon: BarChart3, label: 'Charts' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen
        flex flex-col
        transition-all duration-300 ease-in-out
        z-40
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f5d4] to-[#7b2cbf] flex items-center justify-center">
            <Zap size={22} className="text-[#0a0a0f]" />
          </div>
          {sidebarOpen && (
            <span className="text-xl font-bold text-gradient">Uptake</span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg transition-colors"
          style={{
            color: 'var(--color-text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-[#00f5d4]/10 to-[#7b2cbf]/10 text-[#00f5d4] border border-[#00f5d4]/20'
                    : 'text-[#a0a0b0] hover:text-[#f0f0f5]'
                  }
                `}
                style={isActive => !isActive ? {
                  color: 'var(--color-text-secondary)',
                } : undefined}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div
          className={`
            flex items-center gap-3 p-3 rounded-lg mb-2
            ${sidebarOpen ? '' : 'justify-center'}
          `}
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7b2cbf] to-[#ff6b6b] flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {user?.name || 'User'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`
            flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
            transition-colors duration-200
            ${sidebarOpen ? '' : 'justify-center'}
          `}
          style={{
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 71, 87, 0.1)';
            e.currentTarget.style.color = '#ff4757';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

