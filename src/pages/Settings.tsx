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
    <div className="h-full flex flex-col">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 bg-bg-primary z-10 pb-4 -mx-6 px-6">
        <div className="py-4">
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64">
          <Card padding="sm">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors text-left
                    ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 text-accent-primary"
                        : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                    }
                  `}
                >
                  <tab.icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "api" && <APISettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
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
    <Card>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Profile Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Input label="Email" value={user?.email || ""} disabled helperText="Email cannot be changed" />
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Role" value={user?.role || ""} disabled />
        <Button type="submit" isLoading={isLoading}>
          Save Changes
        </Button>
      </form>
    </Card>
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
    <Card>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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
        <Button type="submit" isLoading={isLoading}>
          Update Password
        </Button>
      </form>
    </Card>
  );
};

const APISettings: React.FC = () => {
  const currentApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  return (
    <Card>
      <h2 className="text-lg font-semibold text-text-primary mb-4">API Configuration</h2>
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Current API URL</label>
          <div className="px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg text-text-primary font-mono text-sm">
            {currentApiUrl}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
          <h3 className="font-medium text-text-primary mb-2">How to Change API URL</h3>
          <p className="text-sm text-text-secondary mb-3">
            To connect to a different backend server, set the{" "}
            <code className="px-1.5 py-0.5 rounded bg-border text-accent-primary">VITE_API_URL</code> environment variable
            before building or running the frontend:
          </p>
          <pre className="p-3 rounded bg-bg-primary text-sm font-mono text-text-secondary overflow-x-auto">
            {`# Development
VITE_API_URL=https://your-api.com/api npm run dev

# Production build
VITE_API_URL=https://your-api.com/api npm run build`}
          </pre>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 border border-accent-primary/20">
          <h3 className="font-medium text-accent-primary mb-2">🚀 Decoupled Architecture</h3>
          <p className="text-sm text-text-secondary">
            This frontend can connect to any Uptake backend server. Simply point it to your backend URL and you're good
            to go!
          </p>
        </div>
      </div>
    </Card>
  );
};

const AppearanceSettings: React.FC = () => {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Appearance</h2>
      <ThemeSettings />
    </Card>
  );
};
