import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, UserRound } from 'lucide-react';
import Layout from '../components/Layout';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { authApi, getErrorMessage } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, title: user.title || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authApi.updateMe(form);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
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

  return (
    <Layout title="Profile">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="card p-6">
          <div className="mb-5 flex items-center gap-4">
            <Avatar user={user} size="lg" />
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">{user.name}</h2>
              <p className="text-sm text-ink-500">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <UserRound size={15} /> Personal info
            </div>
            <div>
              <label className="label">Full name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="e.g. Product Designer"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={savingProfile}>
                {savingProfile ? <Spinner size={16} className="text-white" /> : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        <div className="card p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <KeyRound size={15} /> Change password
            </div>
            <div>
              <label className="label">Current password</label>
              <input
                type="password"
                required
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                required
                minLength={6}
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={savingPassword}>
                {savingPassword ? <Spinner size={16} className="text-white" /> : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
