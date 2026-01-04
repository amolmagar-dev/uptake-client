import React from "react";
import { Navigate, Outlet, NavLink } from "react-router-dom";
import { TopBar } from "./TopBar";
import { ToastContainer } from "../ui/Toast";
import { CommandPalette } from "../ui/CommandPalette";
import { useAuthStore } from "../../../store/authStore";
import {
  LayoutDashboard,
  Database,
  FileCode,
  BarChart3,
  Layers,
  Code2,
  Settings,
  Zap,
  Sparkles,
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboards" },
  { path: "/connections", icon: Database, label: "Connections" },
  { path: "/datasets", icon: Layers, label: "Datasets" },
  { path: "/sql-editor", icon: FileCode, label: "SQL Editor" },
  { path: "/charts", icon: BarChart3, label: "Charts" },
  { path: "/components", icon: Code2, label: "Components" },
  { path: "/ai-workspace", icon: Sparkles, label: "AI Workspace", badge: "Alpha" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export const Layout: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const closeDrawer = () => {
    const drawerCheckbox = document.getElementById("main-drawer") as HTMLInputElement;
    if (drawerCheckbox) drawerCheckbox.checked = false;
  };

  return (
    <div className="drawer">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col h-screen bg-base-100 text-base-content overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Outlet />
        </main>

        <ToastContainer />
        <CommandPalette />
      </div>

      <div className="drawer-side z-100">
        <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="min-h-full w-80 bg-base-100 p-4">
          <div className="flex items-center gap-3 mb-8 px-4 py-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap size={22} className="text-primary-content" />
            </div>
            <span className="text-xl font-bold">Uptake</span>
          </div>
          
          <ul className="menu menu-md gap-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={closeDrawer}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    ${isActive ? "menu-active bg-primary text-primary-content" : "text-base-content/70"}
                  `}
                >
                  <item.icon size={20} />
                  <span className="flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <span className="badge badge-primary badge-xs">{item.badge}</span>
                    )}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
