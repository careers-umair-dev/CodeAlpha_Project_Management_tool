import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CalendarClock,
  ArrowUpRight,
} from 'lucide-react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import MiniBarChart from '../components/MiniBarChart';
import { PriorityBadge, StatusBadge, DueDateLabel } from '../components/Badges';
import { projectApi, getErrorMessage } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  'To Do': '#8695A7',
  'In Progress': '#3B82F6',
  Review: '#E2A73E',
  Completed: '#3F8C69',
};

const PRIORITY_COLORS = {
  Low: '#3F8C69',
  Medium: '#E2A73E',
  High: '#CE6641',
};

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="card group flex min-h-[104px] min-w-0 items-center gap-3 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised sm:min-h-[112px] sm:gap-4 sm:p-5">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${accent}`}>
      <Icon size={19} strokeWidth={1.8} />
    </div>
    <div className="min-w-0">
      <p className="font-display text-2xl font-semibold leading-none text-ink-900">{value}</p>
      <p className="mt-2 text-xs font-medium text-ink-500">{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await projectApi.dashboardStats();
        setData(data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex h-64 items-center justify-center">
          <Spinner size={26} />
        </div>
      </Layout>
    );
  }

  const {
    stats,
    recentProjects,
    recentTasks,
    overdueTasks,
    upcomingTasks = [],
    statusBreakdown = [],
    priorityBreakdown = [],
  } = data;

  return (
    <Layout title="Dashboard">
      <div className="dashboard-reveal relative mb-6 flex flex-col justify-between gap-5 overflow-hidden rounded-lg bg-ink-900 px-5 py-6 text-white shadow-raised sm:flex-row sm:items-center sm:px-7 sm:py-7">
        <div className="relative z-10">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400">Workspace overview</p>
          <h2 className="font-display text-2xl font-medium leading-tight sm:text-3xl">Your work, in clear view.</h2>
          <p className="mt-2 max-w-xl text-sm text-white/65">Track progress, spot what needs attention, and keep your team moving.</p>
        </div>
        <button onClick={() => navigate('/projects')} className="btn-accent relative z-10 shrink-0 self-start sm:self-auto">
          Explore projects <ArrowUpRight size={16} />
        </button>
        <div aria-hidden="true" className="pointer-events-none absolute right-48 top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full border border-white/10 lg:block" />
      </div>

      <div className="dashboard-reveal grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6" style={{ animationDelay: '60ms' }}>
        <StatCard icon={FolderKanban} label="Projects" value={stats.totalProjects} accent="bg-blue-50 text-blue-600" />
        <StatCard icon={ListTodo} label="Total tasks" value={stats.totalTasks} accent="bg-ink-100 text-ink-600" />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completedTasks}
          accent="bg-moss-100 text-moss-700"
        />
        <StatCard icon={Clock} label="In progress" value={stats.inProgressTasks} accent="bg-amber-100 text-amber-600" />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={stats.overdueCount}
          accent="bg-clay-100 text-clay-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Completion rate"
          value={`${stats.completionRate ?? 0}%`}
          accent="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="dashboard-reveal mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2" style={{ animationDelay: '120ms' }}>
        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Tasks by status</h2>
          {stats.totalTasks === 0 ? (
            <p className="text-sm text-ink-400">No tasks yet.</p>
          ) : (
            <MiniBarChart
              data={statusBreakdown.map((s) => ({ label: s.status, count: s.count }))}
              colors={STATUS_COLORS}
              total={stats.totalTasks}
            />
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Tasks by priority</h2>
          {stats.totalTasks === 0 ? (
            <p className="text-sm text-ink-400">No tasks yet.</p>
          ) : (
            <MiniBarChart
              data={priorityBreakdown.map((p) => ({ label: p.priority, count: p.count }))}
              colors={PRIORITY_COLORS}
              total={stats.totalTasks}
            />
          )}
        </div>
      </div>

      <div className="dashboard-reveal mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3" style={{ animationDelay: '180ms' }}>
        {/* Recent projects */}
        <div className="card p-5 lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink-900">Recent projects</h2>
            <button onClick={() => navigate('/projects')} className="text-xs font-medium text-ink-500 hover:text-ink-900">
              View all
            </button>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project to get moving."
            />
          ) : (
            <div className="space-y-1">
              {recentProjects.map((p) => (
                <button
                  key={p._id}
                  onClick={() => navigate(`/projects/${p._id}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-ink-50"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    <span className="text-xs font-semibold">{p.title.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="flex-1 truncate text-sm text-ink-700">{p.title}</span>
                  <ArrowRight size={14} className="text-ink-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-base font-semibold text-ink-900">Recent tasks</h2>
          {recentTasks.length === 0 ? (
            <EmptyState icon={ListTodo} title="No tasks yet" description="Tasks you create will show up here." />
          ) : (
            <div className="space-y-2">
              {recentTasks.map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/projects/${t.project?._id}`)}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-ink-100 p-3 hover:bg-ink-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{t.title}</p>
                    <p className="truncate text-xs text-ink-400">{t.project?.title}</p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                  <Avatar user={t.assignee} size="xs" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-reveal mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2" style={{ animationDelay: '240ms' }}>
        {overdueTasks.length > 0 && (
          <div className="card border-clay-100 p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-clay-600">
              <AlertTriangle size={17} /> Overdue tasks
            </h2>
            <div className="space-y-2">
              {overdueTasks.map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/projects/${t.project?._id}`)}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-clay-100 bg-clay-100/30 p-3 hover:bg-clay-100/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{t.title}</p>
                    <p className="truncate text-xs text-ink-400">{t.project?.title}</p>
                  </div>
                  <DueDateLabel date={t.dueDate} status={t.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingTasks.length > 0 && (
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-amber-600">
              <CalendarClock size={17} /> Upcoming deadlines
            </h2>
            <div className="space-y-2">
              {upcomingTasks.map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/projects/${t.project?._id}`)}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-100/30 p-3 hover:bg-amber-100/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{t.title}</p>
                    <p className="truncate text-xs text-ink-400">{t.project?.title}</p>
                  </div>
                  <DueDateLabel date={t.dueDate} status={t.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
