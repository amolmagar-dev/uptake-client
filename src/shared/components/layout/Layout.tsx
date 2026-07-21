import React from "react";
import { Navigate, Outlet, NavLink, useNavigate } from "react-router-dom";
import { TopBar } from "./TopBar";
import { AppRail } from "./AppRail";
import { ToastContainer } from "../ui/Toast";
import { CommandPalette } from "../ui/CommandPalette";
import { useAuthStore } from "../../../store/authStore";
import { navItems } from "../../config/navConfig";
import { Zap, LogOut } from "lucide-react";

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const closeDrawer = () => {
    const drawerCheckbox = document.getElementById(
      "main-drawer"
    ) as HTMLInputElement;
    if (drawerCheckbox) drawerCheckbox.checked = false;
  };

  const handleMobileLogout = () => {
    closeDrawer();
    logout();
    navigate("/login");
  };

  return (
    <div className="drawer">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main shell layout container */}
      <div className="drawer-content flex h-dvh overflow-hidden bg-base-100 text-base-content">
        <AppRail />
        <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <Outlet />
          </main>
        </div>

        <ToastContainer />
        <CommandPalette />
      </div>

      {/* Mobile Drawer Overlay & Panel */}
      <div className="drawer-side z-50 lg:hidden">
        <label
          htmlFor="main-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <div className="min-h-full w-72 bg-base-200 p-4 border-r border-base-300 flex flex-col justify-between text-base-content">
          <div>
            <div className="flex items-center gap-3 mb-6 px-2 py-1">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap size={22} className="text-primary-content" />
              </div>
              <span className="text-xl font-bold">Uptake</span>
            </div>

            <ul className="menu menu-md p-0 gap-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={closeDrawer}
                    end={item.path === "/"}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      ${
                        isActive
                          ? "bg-primary text-primary-content font-semibold"
                          : "text-base-content/70 hover:bg-base-300 hover:text-base-content"
                      }
                    `}
                  >
                    <item.icon size={20} />
                    <span className="flex items-center justify-between flex-1">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="badge badge-primary badge-xs">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-base-300">
            <button
              type="button"
              onClick={handleMobileLogout}
              className="btn btn-ghost btn-sm w-full gap-3 justify-start text-error hover:bg-error/10"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
