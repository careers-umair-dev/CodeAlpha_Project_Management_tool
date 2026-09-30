import React, { useEffect, useMemo, useState } from 'react';
import { Plus, FolderKanban, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import { projectApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreateProjectModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', description: '', deadline: '', members: '' });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const memberEmails = form.members
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const { data } = await projectApi.create({
        title: form.title,
        description: form.description,
        deadline: form.deadline || null,
        memberEmails,
      });
      toast.success('Project created');
      onCreated(data.project);
      setForm({ title: '', description: '', deadline: '', members: '' });
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl2 bg-white p-6 shadow-modal">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">New project</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              required
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="Website redesign"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input resize-none"
              rows={3}
              placeholder="What is this project about?"
            />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Invite members</label>
            <input
              value={form.members}
              onChange={(e) => setForm({ ...form, members: e.target.value })}
              className="input"
              placeholder="comma-separated emails"
            />
            <p className="mt-1 text-xs text-ink-400">Only registered users can be added. You can invite more later.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving || !form.title.trim()}>
            {saving ? <Spinner size={16} className="text-white" /> : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated');

  const loadProjects = async () => {
    try {
      const { data } = await projectApi.list();
      setProjects(data.projects);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await projectApi.remove(projectToDelete._id);
      setProjects((prev) => prev.filter((p) => p._id !== projectToDelete._id));
      toast.success('Project deleted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
      setProjectToDelete(null);
    }
  };

  const visibleProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = projects;
    if (q) {
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'deadline') {
      sorted.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    } else if (sortBy === 'progress') {
      sorted.sort((a, b) => (b.taskStats?.progress ?? 0) - (a.taskStats?.progress ?? 0));
    } else {
      sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return sorted;
  }, [projects, search, sortBy]);

  return (
    <Layout title="Projects">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-moss-600">Your workspace</p>
          <h2 className="font-display text-2xl font-semibold text-ink-900">Projects</h2>
          <p className="mt-1 text-sm text-ink-500">{projects.length} project{projects.length !== 1 ? 's' : ''} across your team</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-accent">
          <Plus size={16} /> New project
        </button>
      </div>

      {!loading && projects.length > 0 && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="input pl-9"
            />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input sm:w-48">
            <option value="updated">Recently updated</option>
            <option value="name">Name (A–Z)</option>
            <option value="deadline">Deadline</option>
            <option value="progress">Progress</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={26} />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to start organizing tasks with your team."
          action={
            <button onClick={() => setCreateOpen(true)} className="btn-accent">
              <Plus size={16} /> Create your first project
            </button>
          }
        />
      ) : visibleProjects.length === 0 ? (
        <EmptyState icon={Search} title="No matching projects" description="Try a different search term." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              isOwner={p.owner._id === user._id}
              onDelete={setProjectToDelete}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(project) => setProjects((prev) => [{ ...project, taskStats: { total: 0, completed: 0, progress: 0 } }, ...prev])}
      />

      <ConfirmDialog
        open={Boolean(projectToDelete)}
        title={`Delete "${projectToDelete?.title}"?`}
        description="This will permanently remove the project along with all of its tasks and comments."
        confirmLabel="Delete project"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </Layout>
  );
};

export default Projects;
