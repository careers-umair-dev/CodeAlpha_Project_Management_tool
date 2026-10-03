import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Camera,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { authApi, getErrorMessage } from '../services/api';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [form, setForm] = useState({ name: user.name, title: user.title || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(
    () => () => {
      if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview]
  );

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authApi.updateMe({ name: form.name.trim(), title: form.title.trim() });
      updateUser(data.user);
      setForm({ name: data.user.name, title: data.user.title || '' });
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Choose a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile photo must be 2 MB or smaller');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setSavingPhoto(true);
    try {
      const { data } = await authApi.uploadAvatar(photoFile);
      updateUser(data.user);
      setPhotoFile(null);
      setPhotoPreview('');
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPhoto(false);
    }
  };

  const handlePhotoRemove = async () => {
    setSavingPhoto(true);
    try {
      const { data } = await authApi.deleteAvatar();
      updateUser(data.user);
      setPhotoFile(null);
      setPhotoPreview('');
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPhoto(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.currentPassword === pwForm.newPassword) {
      toast.error('Choose a new password different from your current one');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password updated');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAccountDelete = async (event) => {
    event.preventDefault();
    if (deleteAccountConfirmation !== 'DELETE') {
      toast.error('Type DELETE exactly to confirm account removal');
      return;
    }

    setDeletingAccount(true);
    try {
      await authApi.deleteAccount({
        currentPassword: deleteAccountPassword,
        confirmation: deleteAccountConfirmation,
      });
      logout();
      navigate('/login', { replace: true });
      toast.success('Your account has been deleted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingAccount(false);
    }
  };

  const displayedUser = {
    ...user,
    avatarUrl: photoPreview || user.avatarUrl,
  };

  return (
    <Layout title="Profile">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-moss-600">Account settings</p>
          <h2 className="font-display text-2xl font-semibold text-ink-900">Your profile</h2>
          <p className="mt-1 text-sm text-ink-500">Manage your public identity and account security.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <div className="space-y-5">
            <section className="card overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-ink-900 via-ink-800 to-moss-700" />
              <div className="px-5 pb-5 sm:px-7">
                <div className="-mt-12 mb-5 flex flex-wrap items-end justify-between gap-4">
                  <div className="relative">
                    <Avatar
                      user={displayedUser}
                      size="xl"
                      className="border-4 border-white shadow-raised"
                    />
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      disabled={savingPhoto}
                      className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-ink-900 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Choose a profile photo"
                      title="Choose a profile photo"
                    >
                      <Camera size={16} />
                    </button>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pb-1">
                    {photoFile ? (
                      <>
                        <button
                          type="button"
                          onClick={handlePhotoUpload}
                          disabled={savingPhoto}
                          className="btn-primary"
                        >
                          {savingPhoto ? <Spinner size={15} className="text-white" /> : <Check size={15} />}
                          Save photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview('');
                          }}
                          disabled={savingPhoto}
                          className="btn-ghost"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInput.current?.click()}
                          className="btn-ghost !min-h-9 !px-3 text-xs"
                        >
                          <ImagePlus size={14} /> Change photo
                        </button>
                        {user.avatarUrl && (
                          <button
                            type="button"
                            onClick={handlePhotoRemove}
                            disabled={savingPhoto}
                            className="btn-ghost !min-h-9 !px-3 text-xs text-clay-600 hover:bg-clay-50"
                          >
                            {savingPhoto ? <Spinner size={14} /> : <Trash2 size={14} />}
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <h3 className="font-display text-xl font-semibold text-ink-900">{user.name}</h3>
                <p className="mt-1 text-sm text-ink-500">{user.title || 'Add a role or professional title'}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
                  <Mail size={13} /> {user.email}
                </p>
                <p className="mt-1.5 text-xs text-ink-400">
                  JPEG, PNG, or WebP · Maximum file size 2 MB
                </p>
              </div>
            </section>

            <section className="card p-5 sm:p-7">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="mb-1 flex items-center gap-2 border-b border-ink-100 pb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-moss-100 text-moss-700">
                    <UserRound size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-800">Personal information</h3>
                    <p className="text-xs text-ink-400">This information is visible to your teammates.</p>
                  </div>
                </div>
                <div>
                  <label htmlFor="profile-name" className="label">Full name</label>
                  <input
                    id="profile-name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="input"
                    required
                    minLength={1}
                    maxLength={60}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className="label">Email address</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={user.email}
                    className="input cursor-not-allowed bg-ink-50 text-ink-500"
                    readOnly
                    aria-describedby="email-note"
                  />
                  <p id="email-note" className="mt-1.5 text-xs text-ink-400">Email is used to sign in and cannot be changed here.</p>
                </div>
                <div>
                  <label htmlFor="profile-title" className="label">Professional title</label>
                  <input
                    id="profile-title"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    className="input"
                    placeholder="e.g. Product Designer"
                    maxLength={80}
                    autoComplete="organization-title"
                  />
                </div>
                <div className="flex justify-end border-t border-ink-100 pt-4">
                  <button type="submit" className="btn-primary" disabled={savingProfile || !form.name.trim()}>
                    {savingProfile ? <Spinner size={16} className="text-white" /> : 'Save changes'}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="space-y-5">
            <section className="card p-5 sm:p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="mb-1 flex items-center gap-2 border-b border-ink-100 pb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <KeyRound size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-800">Change password</h3>
                    <p className="text-xs text-ink-400">Keep your account protected.</p>
                  </div>
                </div>
                {[
                  { id: 'current-password', label: 'Current password', field: 'currentPassword', autoComplete: 'current-password' },
                  { id: 'new-password', label: 'New password', field: 'newPassword', autoComplete: 'new-password' },
                  { id: 'confirm-password', label: 'Confirm new password', field: 'confirmPassword', autoComplete: 'new-password' },
                ].map(({ id, label, field, autoComplete }) => (
                  <div key={field}>
                    <label htmlFor={id} className="label">{label}</label>
                    <div className="relative">
                      <input
                        id={id}
                        type={showPasswords ? 'text' : 'password'}
                        required
                        minLength={field === 'currentPassword' ? undefined : 6}
                        value={pwForm[field]}
                        onChange={(event) => setPwForm({ ...pwForm, [field]: event.target.value })}
                        className="input pr-11"
                        autoComplete={autoComplete}
                      />
                      {field === 'newPassword' && (
                        <button
                          type="button"
                          onClick={() => setShowPasswords((visible) => !visible)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-700"
                          aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                          title={showPasswords ? 'Hide passwords' : 'Show passwords'}
                        >
                          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-ink-400">Use at least 6 characters. Your new password must differ from your current one.</p>
                <button type="submit" className="btn-primary w-full" disabled={savingPassword}>
                  {savingPassword ? <Spinner size={16} className="text-white" /> : <><ShieldCheck size={16} /> Update password</>}
                </button>
              </form>
            </section>

            <section className="card p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-800">Account details</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    Your profile is part of your team identity. Your email stays private to your account and project collaboration.
                  </p>
                  {user.createdAt && (
                    <p className="mt-3 text-xs text-ink-400">
                      Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl2 border border-clay-100 bg-white shadow-card">
              <div className="border-b border-clay-100 bg-clay-100/30 px-5 py-4 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-clay-600">Danger zone</p>
                <h3 className="mt-1 text-sm font-semibold text-ink-900">Delete account</h3>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs leading-relaxed text-ink-500">
                  Permanently remove your account, profile details, avatar, and notifications. Shared tasks and comments
                  stay with their project and are attributed to “Former member”; your assignments and memberships are
                  removed.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink-500">
                  To protect your team’s work, first transfer ownership of every project you own.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteAccountOpen(true)}
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-clay-200 bg-white px-3.5 py-2 text-sm font-semibold text-clay-600 transition-colors hover:bg-clay-100/60 focus-visible:outline-clay-600"
                >
                  <Trash2 size={15} /> Delete my account
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {deleteAccountOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink-900/55 p-3 py-5 backdrop-blur-sm animate-fade-in sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingAccount) setDeleteAccountOpen(false);
          }}
        >
          <form
            onSubmit={handleAccountDelete}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-modal"
          >
            <div className="border-b border-clay-100 bg-gradient-to-br from-clay-100/60 to-white p-5 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay-100 text-clay-600">
                <Trash2 size={19} />
              </div>
              <h2 id="delete-account-title" className="mt-4 font-display text-xl font-semibold text-ink-900">
                Delete your account?
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-ink-500">
                This permanently removes your sign-in and personal profile. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-xl border border-ink-100 bg-ink-50/70 p-3.5">
                <p className="text-xs font-semibold text-ink-700">What happens to your team data</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-ink-500">
                  <li>Your shared tasks and comments remain, with authorship changed to “Former member”.</li>
                  <li>Your task assignments, project memberships, avatar, and notifications are removed.</li>
                  <li>Account deletion is blocked while you still own a project.</li>
                </ul>
              </div>
              <div>
                <label htmlFor="delete-account-password" className="label">Current password</label>
                <input
                  id="delete-account-password"
                  type="password"
                  value={deleteAccountPassword}
                  onChange={(event) => setDeleteAccountPassword(event.target.value)}
                  className="input h-11 rounded-xl px-3.5"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div>
                <label htmlFor="delete-account-confirmation" className="label">
                  Type <span className="font-bold tracking-wide text-clay-600">DELETE</span> to confirm
                </label>
                <input
                  id="delete-account-confirmation"
                  value={deleteAccountConfirmation}
                  onChange={(event) => setDeleteAccountConfirmation(event.target.value)}
                  className="input h-11 rounded-xl px-3.5"
                  autoComplete="off"
                  spellCheck="false"
                  required
                />
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteAccountOpen(false)}
                  className="btn-ghost w-full rounded-xl sm:w-auto"
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-clay-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-clay-600/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:rounded-xl"
                  disabled={deletingAccount || deleteAccountConfirmation !== 'DELETE' || !deleteAccountPassword}
                >
                  {deletingAccount ? <Spinner size={16} className="text-white" /> : <Trash2 size={15} />}
                  Permanently delete
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};

export default Profile;
