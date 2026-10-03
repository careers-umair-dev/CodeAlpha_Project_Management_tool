import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, X, Calendar, MoreVertical, Trash2, Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import Avatar from '../components/Avatar';
import { projectApi, taskApi, commentApi, getErrorMessage } from '../services/api';
import { getSocket, joinProjectRoom, leaveProjectRoom } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const MembersPanel = ({ project, isOwner, onClose, onAdd, onRemove }) => {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    const ok = await onAdd(email.trim());
    setAdding(false);
    if (ok) setEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-3 py-4 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
      <div className="my-auto w-full max-w-sm rounded-xl2 bg-white p-5 shadow-modal sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Members</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          <div className="flex items-center justify-between rounded-lg px-1 py-1.5">
            <div className="flex items-center gap-2.5">
              <Avatar user={project.owner} size="sm" />
              <div>
                <p className="text-sm font-medium text-ink-800">{project.owner.name}</p>
                <p className="text-xs text-ink-400">Owner</p>
              </div>
            </div>
          </div>
          {project.members.map((m) => (
            <div key={m._id} className="flex items-center justify-between rounded-lg px-1 py-1.5">
              <div className="flex items-center gap-2.5">
                <Avatar user={m} size="sm" />
                <p className="text-sm font-medium text-ink-800">{m.name}</p>
              </div>
              {isOwner && (
                <button onClick={() => onRemove(m._id)} className="text-ink-300 hover:text-clay-600">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {isOwner && (
          <form onSubmit={handleAdd} className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="input"
            />
            <button type="submit" className="btn-primary !px-3" disabled={adding || !email.trim()}>
              {adding ? <Spinner size={15} className="text-white" /> : <UserPlus size={15} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersOpen, setMembersOpen] = useState(false);
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  // Task modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('To Do');
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCounts, setCommentCounts] = useState({});

  // Board toolbar: search + filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  const activeTaskId = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([projectApi.get(id), taskApi.listForProject(id)]);
      setProject(projectRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    joinProjectRoom(id);

    const onTaskCreated = (task) => {
      if (task.project?.toString?.() !== id && task.project !== id) {
        // task payload's project field may not be populated; still safe to append since room scoping guarantees relevance
      }
      setTasks((prev) => (prev.some((t) => t._id === task._id) ? prev : [...prev, task]));
    };
    const onTaskUpdated = (task) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      setActiveTask((prev) => (prev && prev._id === task._id ? task : prev));
    };
    const onTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };
    const onCommentCreated = ({ taskId, comment }) => {
      setCommentCounts((prev) => ({ ...prev, [taskId]: (prev[taskId] || 0) + 1 }));
      if (activeTaskId.current === taskId) {
        setComments((prev) => (prev.some((c) => c._id === comment._id) ? prev : [...prev, comment]));
      }
    };
    const onCommentDeleted = ({ taskId, commentId }) => {
      setCommentCounts((prev) => ({ ...prev, [taskId]: Math.max(0, (prev[taskId] || 1) - 1) }));
      if (activeTaskId.current === taskId) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    };

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('comment:created', onCommentCreated);
    socket.on('comment:deleted', onCommentDeleted);

    return () => {
      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('comment:created', onCommentCreated);
      socket.off('comment:deleted', onCommentDeleted);
      leaveProjectRoom(id);
    };
  }, [id]);

  const openCreateModal = (status) => {
    setActiveTask(null);
    activeTaskId.current = null;
    setDefaultStatus(status || 'To Do');
    setComments([]);
    setModalOpen(true);
  };

  const openTaskModal = async (task) => {
    setActiveTask(task);
    activeTaskId.current = task._id;
    setModalOpen(true);
    setCommentsLoading(true);
    try {
      const { data } = await commentApi.listForTask(task._id);
      setComments(data.comments);
      setCommentCounts((prev) => ({ ...prev, [task._id]: data.comments.length }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveTask(null);
    activeTaskId.current = null;
    setComments([]);
  };

  const handleSaveTask = async (form) => {
    setSaving(true);
    try {
      if (activeTask?._id) {
        const { data } = await taskApi.update(activeTask._id, form);
        setTasks((prev) => prev.map((t) => (t._id === data.task._id ? data.task : t)));
        toast.success('Task updated');
      } else {
        const { data } = await taskApi.create({ ...form, projectId: id, status: form.status || defaultStatus });
        setTasks((prev) => [...prev, data.task]);
        toast.success('Task created');
      }
      closeModal();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd = async (status, title) => {
    try {
      const { data } = await taskApi.create({ title, projectId: id, status });
      setTasks((prev) => [...prev, data.task]);
      toast.success('Task added');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskApi.remove(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
      closeModal();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleStatusChange = async (taskId, status) => {
    const prevTasks = tasks;
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
    try {
      await taskApi.update(taskId, { status });
    } catch (error) {
      setTasks(prevTasks);
      toast.error(getErrorMessage(error));
    }
  };

  const handleAddComment = async (text) => {
    try {
      const { data } = await commentApi.create({ taskId: activeTask._id, text });
      setComments((prev) => (prev.some((c) => c._id === data.comment._id) ? prev : [...prev, data.comment]));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentApi.remove(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAddMember = async (email) => {
    try {
      const { data } = await projectApi.addMember(id, email);
      setProject(data.project);
      toast.success('Member added');
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const { data } = await projectApi.removeMember(id, userId);
      setProject(data.project);
      toast.success('Member removed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectApi.remove(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading || !project) {
    return (
      <Layout title="Project">
        <div className="flex h-64 items-center justify-center">
          <Spinner size={26} />
        </div>
      </Layout>
    );
  }

  const isOwner = project.owner._id === user._id;
  const allMembers = [project.owner, ...project.members];
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const filtersActive = search.trim() || priorityFilter !== 'All' || assigneeFilter !== 'All';
  const visibleTasks = tasks.filter((t) => {
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    if (assigneeFilter === 'Unassigned' && t.assignee) return false;
    if (assigneeFilter !== 'All' && assigneeFilter !== 'Unassigned' && t.assignee?._id !== assigneeFilter) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <Layout title={project.title}>
      <button
        onClick={() => navigate('/projects')}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft size={15} /> Back to projects
      </button>

      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: project.color }}
            >
              <span className="font-display text-lg">{project.title.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-ink-900">{project.title}</h1>
              <p className="mt-0.5 max-w-xl text-sm text-ink-500">{project.description || 'No description yet.'}</p>
              {project.deadline && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-400">
                  <Calendar size={12} /> Due {format(new Date(project.deadline), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMembersOpen(true)}
              className="btn-ghost border border-ink-200 !text-ink-700"
            >
              <div className="flex -space-x-1.5">
                {allMembers.slice(0, 3).map((m) => (
                  <Avatar key={m._id} user={m} size="xs" ring />
                ))}
              </div>
              <Users size={14} className="ml-1" /> {allMembers.length}
            </button>

            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setHeaderMenuOpen((v) => !v)}
                  className="rounded-lg border border-ink-200 p-2 text-ink-500 hover:bg-ink-100"
                >
                  <MoreVertical size={16} />
                </button>
                {headerMenuOpen && (
                  <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-ink-100 bg-white py-1 shadow-raised">
                    <button
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        setDeleteProjectConfirm(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-clay-600 hover:bg-ink-100"
                    >
                      <Trash2 size={14} /> Delete project
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-ink-500">
            <span>
              {completed} of {tasks.length} tasks completed
            </span>
            <span className="font-medium text-ink-700">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: project.color }}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="input pl-9"
          />
        </div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 sm:flex">
          <SlidersHorizontal size={14} className="shrink-0 text-ink-400" />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input min-w-0">
            <option value="All">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="input min-w-0">
            <option value="All">Everyone</option>
            <option value="Unassigned">Unassigned</option>
            {allMembers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch('');
                setPriorityFilter('All');
                setAssigneeFilter('All');
              }}
              className="text-xs font-medium text-ink-500 hover:text-ink-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {filtersActive && visibleTasks.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-ink-200 bg-white/60 px-6 py-10 text-center text-sm text-ink-500">
          No tasks match your filters.
        </div>
      ) : (
        <KanbanBoard
          tasks={visibleTasks}
          onTaskClick={openTaskModal}
          onAddTask={openCreateModal}
          onQuickAdd={handleQuickAdd}
          onStatusChange={handleStatusChange}
          commentCounts={commentCounts}
        />
      )}

      <TaskModal
        open={modalOpen}
        task={activeTask}
        projectTasks={tasks}
        projectMembers={allMembers}
        currentUser={user}
        comments={comments}
        commentsLoading={commentsLoading}
        saving={saving}
        onClose={closeModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      {membersOpen && (
        <MembersPanel
          project={project}
          isOwner={isOwner}
          onClose={() => setMembersOpen(false)}
          onAdd={handleAddMember}
          onRemove={handleRemoveMember}
        />
      )}

      <ConfirmDialog
        open={deleteProjectConfirm}
        title={`Delete "${project.title}"?`}
        description="This will permanently remove the project, its tasks, and all comments."
        confirmLabel="Delete project"
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteProjectConfirm(false)}
      />
    </Layout>
  );
};

export default ProjectDetails;
