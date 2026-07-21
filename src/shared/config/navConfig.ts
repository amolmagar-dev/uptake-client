import type { ComponentType, SVGProps } from "react";
import {
  LayoutDashboard,
  Database,
  Layers,
  FileCode,
  BarChart3,
  Code2,
  Sparkles,
  Settings,
} from "lucide-react";

/** Structural icon type — accepts lucide-react icon components without depending
 *  on the library's exported type name. */
export type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

export interface NavItem {
  path: string;
  icon: NavIcon;
  label: string;
  badge?: string;
}

export const navItems: NavItem[] = [
  { path: "/", icon: LayoutDashboard, label: "Dashboards" },
  { path: "/connections", icon: Database, label: "Connections" },
  { path: "/datasets", icon: Layers, label: "Datasets" },
  { path: "/sql-editor", icon: FileCode, label: "SQL Editor" },
  { path: "/charts", icon: BarChart3, label: "Charts" },
  { path: "/components", icon: Code2, label: "Components" },
  { path: "/ai-workspace", icon: Sparkles, label: "AI Workspace", badge: "Alpha" },
  { path: "/settings", icon: Settings, label: "Settings" },
];
