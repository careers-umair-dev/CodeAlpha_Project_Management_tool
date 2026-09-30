import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MoreVertical, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import Avatar from './Avatar';

const ProjectCard = ({ project, onDelete, isOwner }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const progress = project.taskStats?.progress ?? 0;

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      className="card group relative cursor-pointer p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-raised"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white" style={{ backgroundColor: project.color }}>
          <span className="font-display text-base">{project.title.charAt(0).toUpperCase()}</span>
        </div>

        {isOwner && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-1 text-ink-400 opacity-0 transition-opacity hover:bg-ink-100 focus:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-ink-100 bg-white py-1 shadow-raised">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(project);
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

      <h3 className="mt-3.5 truncate font-display text-base font-semibold text-ink-900">{project.title}</h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-ink-500">
        {project.description || 'No description yet.'}
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-500">
          <span>Progress</span>
          <span className="font-medium text-ink-700">{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: project.color }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3.5">
        <div className="flex items-center -space-x-2">
          <Avatar user={project.owner} size="xs" ring />
          {project.members?.slice(0, 3).map((m) => (
            <Avatar key={m._id} user={m} size="xs" ring />
          ))}
          {project.members?.length > 3 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-200 text-[10px] font-medium text-ink-600 ring-2 ring-white">
              +{project.members.length - 3}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <Users size={12} /> {(project.members?.length || 0) + 1}
          </span>
          {project.deadline && (
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {format(new Date(project.deadline), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
