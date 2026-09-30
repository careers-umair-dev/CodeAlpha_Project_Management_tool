import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar } from 'lucide-react';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import Spinner from './Spinner';
import { format } from 'date-fns';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['To Do', 'In Progress', 'Review', 'Completed'];

const emptyForm = { title: '', description: '', assignee: '', priority: 'Medium', status: 'To Do', dueDate: '' };

const TaskModal = ({
  open,
  task,
  projectMembers,
  currentUser,
  comments,
  commentsLoading,
  saving,
  onClose,
  onSave,
  onDelete,
  onAddComment,
  onDeleteComment,
}) => {
  const [form, setForm] = useState(emptyForm);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isEdit = Boolean(task?._id);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        assignee: task.assignee?._id || '',
        priority: task.priority || 'Medium',
        status: task.status || 'To Do',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      });
    } else {
      setForm(emptyForm);
    }
    setConfirmingDelete(false);
  }, [task, open]);

  if (!open) return null;

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, assignee: form.assignee || null, dueDate: form.dueDate || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 py-8 backdrop-blur-sm animate-fade-in sm:items-center">
      <div className="grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-xl2 bg-white shadow-modal md:grid-cols-5">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="col-span-3 flex flex-col p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <input
              value={form.title}
              onChange={handleChange('title')}
              placeholder="Task title"
              required
              maxLength={150}
              className="w-full border-none bg-transparent font-display text-xl font-semibold text-ink-900 outline-none placeholder-ink-300"
            />
            <button type="button" onClick={onClose} className="shrink-0 rounded-md p-1.5 text-ink-400 hover:bg-ink-100">
              <X size={18} />
            </button>
          </div>

          <textarea
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Add a description…"
            rows={4}
            maxLength={3000}
            className="input resize-none"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assignee</label>
              <select value={form.assignee} onChange={handleChange('assignee')} className="input">
                <option value="">Unassigned</option>
                {projectMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={handleChange('priority')} className="input">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={handleChange('status')} className="input">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" value={form.dueDate} onChange={handleChange('dueDate')} className="input" />
            </div>
          </div>

          {task?.createdAt && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
              <Calendar size={12} /> Created {format(new Date(task.createdAt), 'MMM d, yyyy')} by{' '}
              {task.createdBy?.name || 'a teammate'}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
            {isEdit ? (
              confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-500">Delete this task?</span>
                  <button type="button" onClick={() => onDelete(task._id)} className="btn-danger !px-3 !py-1.5 text-xs">
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:text-clay-600/80"
                >
                  <Trash2 size={14} /> Delete task
                </button>
              )
            ) : (
              <span />
            )}
            <button type="submit" className="btn-primary" disabled={saving || !form.title.trim()}>
              {saving ? <Spinner size={16} className="text-white" /> : isEdit ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>

        {/* Comments sidebar */}
        <div className="col-span-2 flex flex-col border-t border-ink-100 bg-ink-50/60 p-5 sm:p-6 md:border-l md:border-t-0">
          {isEdit ? (
            commentsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Spinner size={20} />
              </div>
            ) : (
              <CommentSection
                comments={comments}
                currentUser={currentUser}
                onAdd={onAddComment}
                onDelete={onDeleteComment}
              />
            )
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-ink-400">
              <Avatar user={null} size="md" />
              <p className="mt-3">Save the task to start commenting with your team.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
