import React from 'react';
import { ArrowUpRight, Mountain } from 'lucide-react';

const AuthLayout = ({ title, subtitle, children }) => (
  <main className="auth-layout min-h-screen bg-ink-50">
    <section className="relative flex min-h-[220px] flex-col overflow-hidden bg-gradient-to-br from-[#1c2924] via-ink-900 to-[#11161c] px-6 py-5 text-white sm:px-10 sm:py-8 min-[700px]:min-h-screen min-[700px]:px-8 min-[700px]:py-9 min-[1100px]:px-14 min-[1100px]:py-12">
      <div aria-hidden="true" className="auth-grid pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-ink-900 shadow-lg shadow-black/20">
          <Mountain size={18} />
        </div>
        <span className="font-display text-xl font-semibold tracking-tight">Ridgeline</span>
      </div>

      <div className="auth-hero-copy relative my-auto max-w-lg py-4 min-[700px]:py-0">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(226,167,62,0.8)]" />
          A clearer way to work together
        </p>
        <h1 className="font-display text-3xl font-medium leading-[1.08] tracking-tight sm:text-5xl min-[1100px]:text-[3.5rem]">
          Make progress
          <br />
          <span className="text-amber-400">feel visible.</span>
        </h1>
        <p className="auth-hero-description mt-5 hidden max-w-md text-sm leading-6 text-white/65 min-[700px]:block sm:text-base sm:leading-7">
          Bring projects, tasks, and team conversations into one focused workspace.
        </p>
        <div className="auth-feature-list mt-7 hidden flex-wrap gap-2 min-[700px]:flex">
          {['Projects', 'Kanban boards', 'Team updates'].map((feature) => (
            <span key={feature} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65">
              {feature}
            </span>
          ))}
        </div>
      </div>

      <p className="relative hidden items-center gap-1.5 text-xs text-white/40 min-[700px]:flex">
        A steady view of what matters next <ArrowUpRight size={13} />
      </p>
    </section>

    <section className="app-canvas flex items-center justify-center px-5 py-8 sm:px-8 sm:py-10 min-[700px]:min-h-screen min-[700px]:px-7 min-[1100px]:px-12">
      <div className="w-full max-w-[430px] animate-fade-in">
        <div className="mb-6 sm:mb-7">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-moss-600">Ridgeline workspace</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-[2.15rem]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  </main>
);

export default AuthLayout;
