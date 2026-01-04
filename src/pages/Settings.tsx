import React, { useState } from "react";
import { User, Lock, Server, Palette, Moon, Sun } from "lucide-react";
import { Button } from "../shared/components/ui/Button";
import { Card } from "../shared/components/ui/Card";
import { Input } from "../shared/components/ui/Input";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";
import { authApi } from "../lib/api";
import { ThemeSettings } from "./Settings/ThemeSettings";

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "api", label: "API Settings", icon: Server },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Page Header */}
      <div className="shrink-0">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-base-content/60 mt-1 text-sm">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-2">
              <ul className="menu menu-md w-full gap-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl
                        ${
                          activeTab === tab.id
                            ? "active bg-primary text-primary-content"
                            : "hover:bg-base-200"
                        }
                      `}
                    >
                      <tab.icon size={18} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {activeTab === "profile" && <ProfileSettings />}
            {activeTab === "security" && <SecuritySettings />}
            {activeTab === "api" && <APISettings />}
            {activeTab === "appearance" && <AppearanceSettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileSettings: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const { addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.updateProfile({ name });
      await checkAuth();
      addToast("success", "Profile updated successfully");
    } catch (error) {
      addToast("error", "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-8">
        <h2 className="card-title text-xl mb-6">Profile Information</h2>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          <Input label="Email" value={user?.email || ""} disabled helperText="Email cannot be changed" />
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Role" value={user?.role || ""} disabled />
          <div className="pt-4">
            <button className={`btn btn-primary ${isLoading ? 'loading' : ''}`} type="submit" disabled={isLoading}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SecuritySettings: React.FC = () => {
  const { addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      addToast("error", "Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      addToast("error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.updateProfile({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      addToast("success", "Password updated successfully");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      addToast("error", error.response?.data?.error || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-8">
        <h2 className="card-title text-xl mb-6">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          <Input
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          <div className="pt-4">
            <button className={`btn btn-primary ${isLoading ? 'loading' : ''}`} type="submit" disabled={isLoading}>
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const APISettings: React.FC = () => {
  const currentApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-8">
        <h2 className="card-title text-xl mb-6">API Configuration</h2>
        <div className="space-y-6 max-w-lg">
          <div>
            <label className="block text-sm font-medium opacity-60 mb-2">Current API URL</label>
            <div className="mockup-code bg-base-300 text-base-content before:hidden">
              <pre><code>{currentApiUrl}</code></pre>
            </div>
          </div>

          <div className="alert alert-info shadow-sm">
            <Server size={20} />
            <div>
              <h3 className="font-bold">How to Change API URL</h3>
              <div className="text-xs">Set VITE_API_URL env var before building.</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
              <span>🚀</span> Decoupled Architecture
            </h3>
            <p className="text-sm opacity-70">
              This frontend can connect to any Uptake backend server. Simply point it to your backend URL and you're good
              to go!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppearanceSettings: React.FC = () => {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-8">
        <h2 className="card-title text-xl mb-6 flex items-center gap-2">
          <Palette size={24} className="text-primary" />
          Appearance
        </h2>
        <ThemeSettings />
      </div>
    </div>
  );
};
