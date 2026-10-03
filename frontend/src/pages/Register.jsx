import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import AuthLayout from '../components/AuthLayout';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const result = await register(form.name, form.email, form.password);
    setLoading(false);
    if (result.success) {
      toast.success('Account created! Welcome to Ridgeline.');
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Set up your workspace and get your team moving.">
        <form onSubmit={handleSubmit} className="card space-y-5 rounded-2xl border-white/80 p-5 shadow-[0_18px_50px_rgba(22,27,34,0.08)] sm:p-7">
          <div>
            <label htmlFor="register-name" className="label text-[13px] font-semibold text-ink-700">Full name</label>
            <input
              id="register-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input h-12 rounded-xl border-ink-200/90 px-4"
              placeholder="Jordan Rivera"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="label text-[13px] font-semibold text-ink-700">Email</label>
            <input
              id="register-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input h-12 rounded-xl border-ink-200/90 px-4"
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="label text-[13px] font-semibold text-ink-700">Password</label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input h-12 rounded-xl border-ink-200/90 px-4 pr-12"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition-colors hover:text-ink-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary group mt-1 h-12 w-full justify-between rounded-xl px-4" disabled={loading}>
            <span className="flex-1 text-center">{loading ? <Spinner size={16} className="mx-auto text-white" /> : 'Create account'}</span>
            {!loading && <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-moss-700 decoration-moss-500/40 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
    </AuthLayout>
  );
};

export default Register;
