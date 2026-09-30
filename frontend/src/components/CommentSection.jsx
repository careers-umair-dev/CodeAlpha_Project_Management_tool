import React, { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import Avatar from './Avatar';
import { timeAgo } from './Badges';

const CommentSection = ({ comments, currentUser, onAdd, onDelete, submitting }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col">
      <h4 className="mb-3 text-sm font-semibold text-ink-700">Comments ({comments.length})</h4>

      <div className="mb-4 max-h-72 space-y-3.5 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-sm text-ink-400">No comments yet. Start the conversation.</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="flex items-start gap-2.5 animate-fade-in">
              <Avatar user={c.author} size="sm" />
              <div className="min-w-0 flex-1 rounded-lg bg-ink-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-ink-700">{c.author?.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-[11px] text-ink-400">{timeAgo(c.createdAt)}</span>
                    {currentUser?._id === c.author?._id && (
                      <button
                        onClick={() => onDelete(c._id)}
                        className="text-ink-300 hover:text-clay-600"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-700">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-ink-100 pt-3">
        <Avatar user={currentUser} size="sm" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className="input flex-1"
          maxLength={1000}
        />
        <button type="submit" className="btn-primary !px-3" disabled={!text.trim() || submitting}>
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
