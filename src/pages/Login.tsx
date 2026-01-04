import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '../shared/components/ui/Button';
import { Input } from '../shared/components/ui/Input';
import { useAuthStore } from '../store/authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#7b2cbf] via-[#0a0a0f] to-[#00f5d4] opacity-50" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#00f5d4] to-[#7b2cbf] flex items-center justify-center shadow-2xl">
              <Zap size={36} className="text-[#0a0a0f]" />
            </div>
            <h1 className="text-4xl font-bold">Uptake</h1>
          </div>
          <h2 className="text-3xl font-light mb-4">
            Data Exploration<br />
            <span className="text-gradient font-semibold">Reimagined</span>
          </h2>
          <p className="text-lg text-white/70 max-w-md">
            Connect to any database, write SQL queries, create stunning visualizations, 
            and build interactive dashboards — all in one place.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
              <div className="text-3xl font-bold text-[#00f5d4]">10+</div>
              <div className="text-sm text-white/60">Database Types</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
              <div className="text-3xl font-bold text-[#7b2cbf]">∞</div>
              <div className="text-sm text-white/60">Dashboards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-bg-primary">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <Zap size={26} className="text-bg-primary" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-accent-primary to-accent-secondary">Uptake</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h2>
            <p className="text-text-secondary">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} />}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-primary hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-8 p-4 rounded-lg bg-bg-secondary border border-border">
            <p className="text-xs text-text-tertiary text-center">
              Demo credentials:<br />
              <span className="text-text-secondary">admin@uptake.local / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, user, isLoading, error, clearError } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    const success = await register(email, password, name);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-bg-primary">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <Zap size={26} className="text-bg-primary" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-accent-primary to-accent-secondary">Uptake</h1>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Create an account</h2>
          <p className="text-text-secondary">Get started with Uptake</p>
        </div>

        {(error || formError) && (
          <div className="mb-6 p-4 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm">
            {error || formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User size={18} />}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight size={18} />}
          >
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

