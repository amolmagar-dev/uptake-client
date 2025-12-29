import React, { useState } from "react";
import { User, Lock, Server, Palette, Moon, Sun } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";
import { authApi } from "../lib/api";

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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Settings</h1>
        <p className="text-[#a0a0b0] mt-1">Manage your account and preferences</p>
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
                        ? "bg-gradient-to-r from-[#00f5d4]/10 to-[#7b2cbf]/10 text-[#00f5d4]"
                        : "text-[#a0a0b0] hover:bg-[#1e1e2a] hover:text-[#f0f0f5]"
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
      <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">Profile Information</h2>
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
      <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">Change Password</h2>
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
      <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">API Configuration</h2>
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-[#a0a0b0] mb-1.5">Current API URL</label>
          <div className="px-4 py-2.5 bg-[#1a1a25] border border-[#2a2a3a] rounded-lg text-[#f0f0f5] font-mono text-sm">
            {currentApiUrl}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#1a1a25] border border-[#2a2a3a]">
          <h3 className="font-medium text-[#f0f0f5] mb-2">How to Change API URL</h3>
          <p className="text-sm text-[#a0a0b0] mb-3">
            To connect to a different backend server, set the{" "}
            <code className="px-1.5 py-0.5 rounded bg-[#2a2a3a] text-[#00f5d4]">VITE_API_URL</code> environment variable
            before building or running the frontend:
          </p>
          <pre className="p-3 rounded bg-[#0a0a0f] text-sm font-mono text-[#a0a0b0] overflow-x-auto">
            {`# Development
VITE_API_URL=https://your-api.com/api npm run dev

# Production build
VITE_API_URL=https://your-api.com/api npm run build`}
          </pre>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-[#00f5d4]/5 to-[#7b2cbf]/5 border border-[#00f5d4]/20">
          <h3 className="font-medium text-[#00f5d4] mb-2">🚀 Decoupled Architecture</h3>
          <p className="text-sm text-[#a0a0b0]">
            This frontend can connect to any Uptake backend server. Simply point it to your backend URL and you're good
            to go!
          </p>
        </div>
      </div>
    </Card>
  );
};

const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useAppStore();

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">Appearance</h2>
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-[#a0a0b0] mb-3">Theme</label>
          <div className="grid grid-cols-3 gap-4">
            {/* Dark Theme */}
            <button
              onClick={() => handleThemeChange("dark")}
              className={`
                relative p-4 rounded-lg border-2 transition-all group
                ${theme === "dark" ? "border-[#00f5d4] bg-[#00f5d4]/10" : "border-[#2a2a3a] hover:border-[#3a3a4a]"}
              `}
            >
              <div className="w-full h-20 rounded-lg bg-[#0a0a0f] mb-3 relative overflow-hidden border border-[#2a2a3a]">
                <div className="absolute inset-2 rounded bg-gradient-to-br from-[#7b2cbf]/20 to-[#00f5d4]/10" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Moon size={16} className={theme === "dark" ? "text-[#00f5d4]" : "text-[#a0a0b0]"} />
                <span className={`text-sm ${theme === "dark" ? "text-[#00f5d4]" : "text-[#f0f0f5]"}`}>Dark</span>
              </div>
              {theme === "dark" && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 rounded-full bg-[#00f5d4] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#0a0a0f]" />
                  </div>
                </div>
              )}
            </button>

            {/* Light Theme */}
            <button
              onClick={() => handleThemeChange("light")}
              className={`
                relative p-4 rounded-lg border-2 transition-all group
                ${theme === "light" ? "border-[#00f5d4] bg-[#00f5d4]/10" : "border-[#2a2a3a] hover:border-[#3a3a4a]"}
              `}
            >
              <div className="w-full h-20 rounded-lg bg-white mb-3 relative overflow-hidden border border-[#d2d2d7]">
                <div className="absolute inset-2 rounded bg-gradient-to-br from-[#7b2cbf]/15 to-[#00f5d4]/10" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Sun size={16} className={theme === "light" ? "text-[#00f5d4]" : "text-[#a0a0b0]"} />
                <span className={`text-sm ${theme === "light" ? "text-[#00f5d4]" : "text-[#f0f0f5]"}`}>Light</span>
              </div>
              {theme === "light" && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 rounded-full bg-[#00f5d4] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Theme Description */}
        <div className="p-4 rounded-lg bg-[#1a1a25] border border-[#2a2a3a]">
          <h3 className="font-medium text-[#f0f0f5] mb-2 flex items-center gap-2">
            <Palette size={18} className="text-[#00f5d4]" />
            Current Theme: {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </h3>
          <p className="text-sm text-[#a0a0b0]">
            {theme === "dark"
              ? "Dark mode uses a cyberpunk-inspired color palette with deep blacks and vibrant accents, perfect for late-night coding sessions."
              : "Light mode provides a clean, modern interface with high contrast and reduced eye strain during daytime use."}
          </p>
        </div>

        {/* Accent Colors Info */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-[#00f5d4]/5 to-[#7b2cbf]/5 border border-[#00f5d4]/20">
          <h3 className="font-medium text-[#00f5d4] mb-2">🎨 Color Palette</h3>
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#00f5d4]" title="Primary Accent" />
            <div className="w-10 h-10 rounded-lg bg-[#7b2cbf]" title="Secondary Accent" />
            <div className="w-10 h-10 rounded-lg bg-[#ff6b6b]" title="Tertiary Accent" />
            <div className="w-10 h-10 rounded-lg bg-[#ffd93d]" title="Warning Accent" />
            <div className="w-10 h-10 rounded-lg bg-[#4cc9f0]" title="Info Accent" />
          </div>
          <p className="text-sm text-[#a0a0b0]">
            Your theme preference is automatically saved and will persist across sessions.
          </p>
        </div>
      </div>
    </Card>
  );
};
