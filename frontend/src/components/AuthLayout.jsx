import React from 'react';
import { Mountain } from 'lucide-react';

const AuthLayout = ({ title, subtitle, children }) => (
  <main className="min-h-screen bg-ink-50 lg:grid lg:grid-cols-[1fr_0.92fr]">
    <section className="relative flex min-h-[310px] flex-col overflow-hidden bg-ink-900 px-6 py-7 text-white sm:px-10 sm:py-9 lg:min-h-screen lg:px-14 lg:py-12">
      <div aria-hidden="true" className="auth-grid pointer-events-none absolute inset-0" />
      <div className="relative flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-ink-900">
          <Mountain size={18} />
        </div>
        <span className="font-display text-lg font-semibold">Ridgeline</span>
      </div>

      <div className="relative my-auto max-w-lg py-12 lg:py-0">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400">A clearer way to work together</p>
        <h1 className="font-display text-4xl font-medium leading-[1.1] sm:text-5xl">
          Make progress
          <br />
          <span className="text-amber-400">feel visible.</span>
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-white/65 sm:text-base">
          Bring projects, tasks, and team conversations into one focused workspace.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-white/55">
          <span>Projects</span>
          <span className="h-1 w-1 rounded-full bg-amber-400" />
          <span>Kanban boards</span>
          <span className="h-1 w-1 rounded-full bg-amber-400" />
          <span>Team updates</span>
        </div>
      </div>

      <p className="relative hidden text-xs text-white/40 lg:block">A steady view of what matters next.</p>
    </section>

    <section className="app-canvas flex items-center justify-center px-5 py-10 sm:px-8 lg:min-h-screen">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-7">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-moss-600">Ridgeline workspace</p>
          <h2 className="font-display text-3xl font-semibold text-ink-900">{title}</h2>
          <p className="mt-2 text-sm text-ink-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  </main>
);

export default AuthLayout;