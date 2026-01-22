import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./shared/components/layout/Layout";
import { LoginPage, RegisterPage } from "./pages/Login";
import { DashboardsPage, DashboardViewPage } from "./pages/Dashboards";
import { ConnectionsPage } from "./pages/Connections";
import { SQLEditorPage } from "./pages/SQLEditorPage";
import { ChartsPage } from "./pages/Charts";
import { ChartEditorPage } from "./pages/ChartEditorPage";
import { DatasetsPage } from "./pages/Datasets";
import { DatasetEditorPage } from "./pages/DatasetEditor";
import { DataPreviewPage } from "./pages/DataPreviewPage";
import { ComponentBuilderPage } from "./pages/ComponentBuilder";
import { ComponentEditorPage } from "./pages/ComponentEditor";
import { SettingsPage } from "./pages/Settings";
import { AIWorkspacePage } from "./pages/AIWorkspace";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";

function App() {
  const { checkAuth } = useAuthStore();
  const { currentThemeId, setTheme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Initialize theme
    setTheme(currentThemeId);
  }, [currentThemeId, setTheme]);

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
        <Route path="/datasets/new" element={<DatasetEditorPage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/datasets/new" element={<DatasetEditorPage />} />
        <Route path="/datasets/:id/edit" element={<DatasetEditorPage />} />
        <Route path="/datasets/:id/preview" element={<DataPreviewPage />} />
        <Route path="/sql-editor" element={<SQLEditorPage />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/charts/new" element={<ChartEditorPage />} />
        <Route path="/charts/:id/edit" element={<ChartEditorPage />} />
        <Route path="/components" element={<ComponentBuilderPage />} />
        <Route path="/components/new" element={<ComponentEditorPage />} />
        <Route path="/components/:id/edit" element={<ComponentEditorPage />} />
        <Route path="/ai-workspace" element={<AIWorkspacePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
