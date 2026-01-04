import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  FileCode,
  BarChart3,
  Layers,
  Code2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useAppStore } from "../../../store/appStore";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboards" },
  { path: "/connections", icon: Database, label: "Connections" },
  { path: "/datasets", icon: Layers, label: "Datasets" },
  { path: "/sql-editor", icon: FileCode, label: "SQL Editor" },
  { path: "/charts", icon: BarChart3, label: "Charts" },
  { path: "/components", icon: Code2, label: "Components" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen
        flex flex-col
        transition-all duration-300 ease-in-out
        z-40
        bg-base-200 border-r border-base-300
        ${sidebarOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"}
      `}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-base-300 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap size={22} className="text-primary-content" />
          </div>
          {sidebarOpen && <span className="text-xl font-bold text-gradient">Uptake</span>}
        </div>
        <button onClick={toggleSidebar} className="btn btn-ghost btn-xs btn-square hidden md:flex">
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="menu p-0 gap-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-base-content/70 hover:text-base-content hover:bg-base-300"
                  }
                `}
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User & Footer Section */}
      <div className="p-3 border-t border-base-300 bg-base-200/50">
        <div
          className={`
            flex items-center gap-3 p-3 rounded-lg mb-2 bg-base-300/50
            ${sidebarOpen ? "" : "justify-center"}
          `}
        >
          <div className="avatar placeholder">
            <div className="w-9 h-9 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
              <span className="text-sm font-bold leading-none">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
            </div>
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-base-content">{user?.name || "User"}</p>
              <p className="text-xs truncate opacity-60 text-base-content">{user?.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={`
            btn btn-ghost btn-sm w-full gap-3 justify-start px-3
            text-error hover:bg-error/10
            ${sidebarOpen ? "" : "justify-center"}
          `}
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
