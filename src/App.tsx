import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { LoginPage, RegisterPage } from "./pages/Login";
import { DashboardsPage, DashboardViewPage } from "./pages/Dashboards";
import { ConnectionsPage } from "./pages/Connections";
import { SQLEditorPage } from "./pages/SQLEditorPage";
import { ChartsPage } from "./pages/Charts";
import { SettingsPage } from "./pages/Settings";
import { useAuthStore } from "./store/authStore";

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardsPage />} />
        <Route path="/dashboard/:id" element={<DashboardViewPage />} />
        <Route path="/connections" element={<ConnectionsPage />} />
        <Route path="/sql-editor" element={<SQLEditorPage />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
