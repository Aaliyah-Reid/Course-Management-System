import React, { useState } from 'react';
import { User } from '../../types/user';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';

interface ProfileFormProps {
  user: User;
  onSave: (user: Partial<User>) => void;
  onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    phoneNumber: user.phoneNumber || '',
    timezone: user.timezone || 'UTC',
    language: user.language || 'en',
    notifications: {
      email: user.notifications?.email ?? true,
      push: user.notifications?.push ?? true,
      sms: user.notifications?.sms ?? false,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-theme-text">Profile Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-theme-text">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-theme-primary/20 bg-theme-background text-theme-text shadow-sm focus:border-theme-secondary focus:ring-theme-secondary sm:text-sm placeholder:text-theme-text/50"
            />
          </div>

          <Input
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />

          <Select
            label="Time Zone"
            value={formData.timezone}
            options={timezones}
            onChange={(value) => setFormData({ ...formData, timezone: value })}
          />

          <Select
            label="Language"
            value={formData.language}
            options={languages}
            onChange={(value) => setFormData({ ...formData, language: value })}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-theme-text">Notifications</h3>
        <div className="mt-4 space-y-4">
          <Checkbox
            label="Email Notifications"
            checked={formData.notifications.email}
            onChange={(e) => setFormData({
              ...formData,
              notifications: {
                ...formData.notifications,
                email: e.target.checked,
              },
            })}
          />

          <Checkbox
            label="Push Notifications"
            checked={formData.notifications.push}
            onChange={(e) => setFormData({
              ...formData,
              notifications: {
                ...formData.notifications,
                push: e.target.checked,
              },
            })}
          />

          <Checkbox
            label="SMS Notifications"
            checked={formData.notifications.sms}
            onChange={(e) => setFormData({
              ...formData,
              notifications: {
                ...formData.notifications,
                sms: e.target.checked,
              },
            })}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-theme-background px-4 py-2 text-sm font-semibold text-theme-text shadow-sm ring-1 ring-inset ring-theme-primary/20 hover:bg-theme-primary/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-theme-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-theme-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;