import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  FileCode,
  BarChart3,
  Layers,
  Code2,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  Search,
  Zap,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

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

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Generate breadcrumbs from location
  const pathnames = location.pathname.split("/").filter((x) => x);
  let pageTitle = "Dashboards";

  if (pathnames.length > 0) {
    const lastPath = pathnames[pathnames.length - 1];
    // Check if the last path is a UUID (common for dashboards/datasets)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastPath);

    if (isUuid) {
      // If it's a UUID, use the parent category name
      pageTitle =
        pathnames[pathnames.length - 2]?.charAt(0).toUpperCase() + pathnames[pathnames.length - 2]?.slice(1) || "View";
    } else {
      // Handle special cases like ai-workspace
      if (lastPath === "ai-workspace") {
        pageTitle = "AI Workspace";
      } else {
        pageTitle = lastPath.charAt(0).toUpperCase() + lastPath.slice(1);
      }
    }
  }

  return (
    <header className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-40 w-full px-4 lg:px-6 h-16">
      {/* Start Section (Left) */}
      <div className="navbar-start gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap size={22} className="text-primary-content" />
          </div>
          <span className="text-xl font-bold hidden sm:inline-block">Uptake</span>
        </div>

        {/* Breadcrumbs */}
        <div className="breadcrumbs text-sm ml-4 border-l border-base-300 pl-6 h-8 hidden xl:block">
          <ul>
            <li className="text-base-content/40">Pages</li>
            <li className="font-semibold text-base-content">{pageTitle.replace(/-/g, " ")}</li>
          </ul>
        </div>
      </div>

      {/* Center Section (Navigation) */}
      <div className="navbar-center hidden lg:flex">
        <div role="tablist" className="tabs tabs-box bg-base-200/50 p-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              role="tab"
              className={({ isActive }) => `
                tab gap-2 transition-all
                ${
                  isActive
                    ? "tab-active bg-primary! text-primary-content! shadow-sm"
                    : "text-base-content/70 hover:text-base-content"
                }
              `}
            >
              <item.icon size={16} />
              <span className="flex items-center gap-1.5">
                {item.label}
                {item.badge && <span className="badge badge-primary badge-xs">{item.badge}</span>}
              </span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Right Section: Search, User & Drawer Toggle */}
      <div className="navbar-end gap-2">
        {/* Search */}
        <label className="input input-sm input-bordered hidden sm:flex items-center gap-2 bg-base-100/50 focus-within:bg-base-100 w-32 focus-within:w-48 transition-all group">
          <Search size={16} className="text-base-content/30 group-focus-within:text-primary transition-colors" />
          <input type="text" placeholder="Search..." />
        </label>

        {/* User Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost gap-2 normal-case font-medium hover:bg-base-300 px-2"
          >
            <div className="avatar placeholder">
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                <span className="text-xs font-bold leading-none">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
              </div>
            </div>
            <span className="text-sm hidden sm:inline-block">{user?.name || "User"}</span>
            <ChevronDown size={14} className="opacity-60" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-100 menu p-2 shadow-2xl bg-base-200 border border-base-300 rounded-box w-52 mt-4"
          >
            <li className="menu-title px-4 py-2 text-xs opacity-50 border-b border-base-300 mb-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-base-content">{user?.name}</span>
                <span className="font-normal">{user?.email}</span>
              </div>
            </li>
            <li>
              <button onClick={handleLogout} className="flex items-center gap-3 text-error hover:bg-error/10">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Mobile Menu Toggle (Triggers main-drawer) */}
        <label htmlFor="main-drawer" className="btn btn-ghost btn-square lg:hidden">
          <Menu size={24} />
        </label>
      </div>
    </header>
  );
};
