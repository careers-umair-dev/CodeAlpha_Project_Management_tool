import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="my-auto w-full max-w-sm rounded-xl2 bg-white p-5 shadow-modal sm:p-6">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              danger ? 'bg-clay-100 text-clay-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle size={18} />
          </div>
          <button onClick={onCancel} className="rounded-md p-1 text-ink-400 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>
        <h3 className="mt-3 font-display text-lg text-ink-800">{title}</h3>
        {description && <p className="mt-1.5 text-sm text-ink-500">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost" disabled={loading}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'} disabled={loading}>
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
