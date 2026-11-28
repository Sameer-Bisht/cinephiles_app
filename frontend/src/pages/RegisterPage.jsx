import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { CinephilesLogo } from '../components/CinephilesLogo';

export function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
  });
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
      navigate('/', { replace: true });
    },
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      displayName: form.displayName.trim() || undefined,
    });
  };

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 shadow-2xl">
      <div className="mb-5">
        <CinephilesLogo size="lg" />
      </div>
      <h1 className="text-2xl font-bold text-white">Join Cinephiles</h1>
      <p className="mt-1 text-sm text-slate-400">Create your cinephile profile in seconds.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Username</label>
          <input
            name="username"
            type="text"
            required
            value={form.username}
            onChange={handleChange}
            placeholder="cinema_lover"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Display Name <span className="text-zinc-500">(optional)</span>
          </label>
          <input
            name="displayName"
            type="text"
            value={form.displayName}
            onChange={handleChange}
            placeholder="Alex Rivera"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {mutation.isError && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {mutation.error?.response?.data?.message || 'Registration failed'}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-50"
        >
          {mutation.isPending ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-teal-400 hover:text-teal-300">
          Log in
        </Link>
      </p>
    </div>
  );
}
