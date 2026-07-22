import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { navItems } from "../../config/navConfig";
import { useAppStore } from "../../../store/appStore";

export const AppRail: React.FC = () => {
  const { sidebarOpen } = useAppStore();

  return (
    <aside
      className={`
        hidden lg:flex flex-col h-dvh bg-base-200 border-r border-base-300
        transition-all duration-200 ease-in-out shrink-0 select-none
        ${sidebarOpen ? "w-60" : "w-16"}
      `}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-3 border-b border-base-300 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-3 overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full"
          aria-label="Uptake Home"
        >
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
            <Zap size={22} className="text-primary-content" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold text-base-content whitespace-nowrap">
              Uptake
            </span>
          )}
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav
        className={`flex-1 py-4 px-2 space-y-1 ${
          !sidebarOpen ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"
        }`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;

          const content = (
            <NavLink
              to={item.path}
              end={item.path === "/"}
              aria-label={!sidebarOpen ? item.label : undefined}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 active:scale-[0.98] group w-full
                ${
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none"
                    : "text-base-content/70 hover:bg-base-300 hover:text-base-content"
                }
              `}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <Icon size={20} />
                {!sidebarOpen && item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
                )}
              </div>

              {sidebarOpen && (
                <div className="flex flex-1 items-center justify-between min-w-0 overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="badge badge-primary badge-xs shrink-0 ml-2">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );

          if (!sidebarOpen) {
            return (
              <div
                key={item.path}
                className="tooltip tooltip-right w-full"
                data-tip={item.label}
              >
                {content}
              </div>
            );
          }

          return <div key={item.path}>{content}</div>;
        })}
      </nav>
    </aside>
  );
};
