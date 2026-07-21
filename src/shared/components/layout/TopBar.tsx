import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  PanelLeft,
  Search,
  Palette,
  Check,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useAppStore } from "../../../store/appStore";
import { useThemeStore, daisyThemes } from "../../../store/themeStore";

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useAppStore();
  const { currentThemeId, setTheme } = useThemeStore();

  const handleLogout = () => {
    (document.activeElement as HTMLElement)?.blur();
    logout();
    navigate("/login");
  };

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        code: "KeyK",
        ctrlKey: true,
        metaKey: true,
        bubbles: true,
      })
    );
  };

  // Generate breadcrumbs from location (keeping original logic verbatim)
  const pathnames = location.pathname.split("/").filter((x) => x);
  let pageTitle = "Dashboards";

  if (pathnames.length > 0) {
    const lastPath = pathnames[pathnames.length - 1];
    // Check if the last path is a UUID (common for dashboards/datasets)
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        lastPath
      );

    if (isUuid) {
      // If it's a UUID, use the parent category name
      pageTitle =
        pathnames[pathnames.length - 2]?.charAt(0).toUpperCase() +
          pathnames[pathnames.length - 2]?.slice(1) || "View";
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
    <header className="sticky top-0 z-40 h-16 bg-base-100 border-b border-base-300 px-4 flex items-center gap-3 w-full">
      {/* Left controls & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Desktop Rail Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="btn btn-ghost btn-sm btn-square hidden lg:inline-flex"
          aria-label="Toggle navigation"
        >
          <PanelLeft size={18} />
        </button>

        {/* Mobile Drawer Toggle */}
        <label
          htmlFor="main-drawer"
          className="btn btn-ghost btn-sm btn-square lg:hidden"
          aria-label="Open drawer"
        >
          <Menu size={18} />
        </label>

        {/* Page title / Breadcrumb */}
        <div className="flex items-center gap-2 text-sm min-w-0 truncate">
          <span className="text-base-content/50 hidden sm:inline">Pages</span>
          <ChevronRight
            size={14}
            className="text-base-content/40 hidden sm:inline shrink-0"
          />
          <span className="font-semibold text-base-content truncate">
            {pageTitle.replace(/-/g, " ")}
          </span>
        </div>
      </div>

      {/* Right Section: Global Search, Theme Switcher & User Menu */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {/* Global Search Button */}
        <button
          type="button"
          onClick={handleOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg border border-base-300 bg-base-200/50 hover:bg-base-200 text-sm text-base-content/60 transition-colors w-40 md:w-56 justify-between h-8 cursor-pointer"
          aria-label="Search"
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            <Search size={14} className="text-base-content/50 shrink-0" />
            <span className="text-xs truncate">Search...</span>
          </span>
          <kbd className="kbd kbd-sm text-[10px] px-1 py-0 bg-base-300 border-base-300 text-base-content/70 shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Theme Switcher */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Switch theme"
          >
            <Palette size={18} />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-50 menu p-2 shadow-2xl bg-base-200 border border-base-300 rounded-box w-52 max-h-80 overflow-y-auto mt-2"
          >
            <li className="menu-title text-xs opacity-50 px-2 py-1">
              Select Theme
            </li>
            {daisyThemes.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => handleThemeSelect(t.id)}
                  className={`flex items-center justify-between py-2 px-3 ${
                    currentThemeId === t.id ? "active font-semibold" : ""
                  }`}
                >
                  <span className="capitalize text-sm">{t.name}</span>
                  {currentThemeId === t.id && (
                    <Check size={16} className="text-primary" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* User Menu */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm gap-2 normal-case font-medium hover:bg-base-300 px-2"
          >
            <div className="avatar placeholder">
              <div className="w-7 h-7 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                <span className="text-xs font-bold leading-none">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <span className="text-sm hidden md:inline-block">
              {user?.name || "User"}
            </span>
            <ChevronDown size={14} className="opacity-60" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-50 menu p-2 shadow-2xl bg-base-200 border border-base-300 rounded-box w-52 mt-2"
          >
            <li className="menu-title px-4 py-2 text-xs opacity-50 border-b border-base-300 mb-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-base-content">{user?.name}</span>
                <span className="font-normal truncate">{user?.email}</span>
              </div>
            </li>
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 text-error hover:bg-error/10"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};
