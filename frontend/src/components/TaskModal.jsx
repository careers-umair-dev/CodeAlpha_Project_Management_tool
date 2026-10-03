import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, CheckSquare, Plus, GitBranch, CircleAlert } from 'lucide-react';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import Spinner from './Spinner';
import { format } from 'date-fns';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['To Do', 'In Progress', 'Review', 'Completed'];

const emptyForm = { title: '', description: '', assignee: '', priority: 'Medium', status: 'To Do', dueDate: '', checklist: [], blockedBy: [] };

const TaskModal = ({
  open,
  task,
  projectTasks = [],
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
  const [newChecklistItem, setNewChecklistItem] = useState('');
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
        blockedBy: (task.blockedBy || []).map((dependency) =>
          typeof dependency === 'string' ? dependency : dependency._id
        ),
        checklist: (task.checklist || []).map((item) => ({
          _id: item._id,
          text: item.text,
          completed: item.completed,
        })),
      });
    } else {
      setForm(emptyForm);
    }
    setConfirmingDelete(false);
    setNewChecklistItem('');
  }, [task, open]);

  if (!open) return null;

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const addChecklistItem = (event) => {
    event.preventDefault();
    const text = newChecklistItem.trim();
    if (!text || form.checklist.length >= 50) return;
    setForm((current) => ({ ...current, checklist: [...current.checklist, { text, completed: false }] }));
    setNewChecklistItem('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, assignee: form.assignee || null, dueDate: form.dueDate || null });
  };
  const availableDependencies = projectTasks.filter((item) => item._id !== task?._id);
  const unresolvedDependencies = availableDependencies.filter(
    (item) => form.blockedBy.includes(item._id) && item.status !== 'Completed'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/45 p-2 py-3 backdrop-blur-sm animate-fade-in sm:p-4 sm:py-6 md:items-start">
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

          <section className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                <CheckSquare size={15} /> Checklist
                <span className="text-xs font-normal text-ink-400">
                  {form.checklist.filter((item) => item.completed).length}/{form.checklist.length}
                </span>
              </h3>
              {form.checklist.length > 0 && (
                <span className="text-xs text-ink-400">{Math.round((form.checklist.filter((item) => item.completed).length / form.checklist.length) * 100)}%</span>
              )}
            </div>
            {form.checklist.length > 0 && (
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-moss-500 transition-all"
                  style={{ width: `${(form.checklist.filter((item) => item.completed).length / form.checklist.length) * 100}%` }}
                />
              </div>
            )}
            <div className="max-h-36 space-y-1 overflow-y-auto">
              {form.checklist.map((item, index) => (
                <div key={item._id || `new-${index}`} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-ink-50">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        checklist: current.checklist.map((entry, itemIndex) =>
                          itemIndex === index ? { ...entry, completed: event.target.checked } : entry
                        ),
                      }))
                    }
                    aria-label={`Mark ${item.text} ${item.completed ? 'incomplete' : 'complete'}`}
                    className="h-4 w-4 accent-moss-600"
                  />
                  <span className={`min-w-0 flex-1 text-sm ${item.completed ? 'text-ink-400 line-through' : 'text-ink-700'}`}>
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        checklist: current.checklist.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    className="rounded p-1 text-ink-300 opacity-0 hover:bg-clay-100 hover:text-clay-600 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove ${item.text}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={newChecklistItem}
                onChange={(event) => setNewChecklistItem(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addChecklistItem(event);
                }}
                placeholder="Add a checklist item"
                maxLength={180}
                className="input !py-2"
                aria-label="New checklist item"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="btn-ghost !min-h-9 !px-2.5"
                disabled={!newChecklistItem.trim() || form.checklist.length >= 50}
                aria-label="Add checklist item"
              >
                <Plus size={16} />
              </button>
            </div>
            {form.checklist.length >= 50 && (
              <p className="mt-1 text-xs text-ink-400">Checklist limit reached (50 items).</p>
            )}
          </section>

          <section className="mt-5 rounded-xl border border-ink-100 bg-ink-50/60 p-3.5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                  <GitBranch size={15} /> Blocked by
                </h3>
                <p className="mt-1 text-xs text-ink-400">Choose tasks that need to finish first.</p>
              </div>
              {form.blockedBy.length > 0 && (
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-500">
                  {form.blockedBy.length}
                </span>
              )}
            </div>
            {availableDependencies.length === 0 ? (
              <p className="rounded-lg bg-white px-3 py-2.5 text-xs text-ink-400">
                Create another task in this project to add a dependency.
              </p>
            ) : (
              <div className="max-h-36 space-y-1 overflow-y-auto">
                {availableDependencies.map((dependency) => {
                  const selected = form.blockedBy.includes(dependency._id);
                  const disabled = form.status === 'Completed' && dependency.status !== 'Completed' && !selected;
                  return (
                    <label
                      key={dependency._id}
                      className={`flex items-center gap-2.5 rounded-lg bg-white px-2.5 py-2 transition-colors ${
                        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={disabled}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            blockedBy: event.target.checked
                              ? [...current.blockedBy, dependency._id]
                              : current.blockedBy.filter((dependencyId) => dependencyId !== dependency._id),
                          }))
                        }
                        className="h-4 w-4 shrink-0 accent-moss-600"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-700">{dependency.title}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        dependency.status === 'Completed' ? 'bg-moss-100 text-moss-700' : 'bg-ink-100 text-ink-500'
                      }`}>
                        {dependency.status}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {unresolvedDependencies.length > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                <CircleAlert size={13} />
                Finish the selected tasks before completing this one.
              </p>
            )}
          </section>

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
                  <option
                    key={s}
                    value={s}
                    disabled={s === 'Completed' && unresolvedDependencies.length > 0}
                  >
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
              {task.createdBy?.name || 'a former member'}
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
