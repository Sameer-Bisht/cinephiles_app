import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, User as UserIcon } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [statusMessage, setStatusMessage] = useState('');

  const profileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setStatusMessage('Profile updated.');
    },
  });

  const avatarMutation = useMutation({
    mutationFn: authApi.uploadAvatar,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setStatusMessage('Avatar updated.');
    },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMessage('');
    avatarMutation.mutate(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage('');
    profileMutation.mutate({ displayName, bio });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-sm text-zinc-400">Manage your public profile and avatar.</p>
      </div>

      <div className="flex items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <UserIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800">
            <Camera className="h-4 w-4" />
            <span>{avatarMutation.isPending ? 'Uploading...' : 'Upload new avatar'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              disabled={avatarMutation.isPending}
              className="hidden"
            />
          </label>
          <p className="text-xs text-zinc-500">JPEG, PNG, or WebP up to 2MB.</p>
          {avatarMutation.isError && (
            <p className="text-xs text-red-400">
              {avatarMutation.error?.response?.data?.message || 'Avatar upload failed'}
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Display Name</label>
          <input
            type="text"
            required
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Bio</label>
          <textarea
            rows={3}
            maxLength={200}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other cinephiles what you love..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-zinc-500">{bio.length}/200</p>
        </div>

        {statusMessage && <p className="text-sm text-emerald-400">{statusMessage}</p>}
        {profileMutation.isError && (
          <p className="text-sm text-red-400">
            {profileMutation.error?.response?.data?.message || 'Update failed'}
          </p>
        )}

        <button
          type="submit"
          disabled={profileMutation.isPending}
          className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {profileMutation.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
