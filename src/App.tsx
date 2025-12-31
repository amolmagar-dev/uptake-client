import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { LoginPage, RegisterPage } from "./pages/Login";
import { DashboardsPage, DashboardViewPage } from "./pages/Dashboards";
import { ConnectionsPage } from "./pages/Connections";
import { SQLEditorPage } from "./pages/SQLEditorPage";
import { ChartsPage } from "./pages/Charts";
import { DatasetsPage } from "./pages/Datasets";
import { ComponentBuilderPage } from "./pages/ComponentBuilder";
import { ComponentEditorPage } from "./pages/ComponentEditor";
import { SettingsPage } from "./pages/Settings";
import { useAuthStore } from "./store/authStore";
import { useAppStore, applyTheme } from "./store/appStore";

function App() {
  const { checkAuth } = useAuthStore();
  const { theme } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Apply theme on mount and whenever it changes
    applyTheme(theme);
  }, [theme]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardsPage />} />
        <Route path="/dashboard/:id" element={<DashboardViewPage />} />
        <Route path="/dashboard/:id/edit" element={<DashboardViewPage />} />
        <Route path="/connections" element={<ConnectionsPage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/sql-editor" element={<SQLEditorPage />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/components" element={<ComponentBuilderPage />} />
        <Route path="/components/new" element={<ComponentEditorPage />} />
        <Route path="/components/:id/edit" element={<ComponentEditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
