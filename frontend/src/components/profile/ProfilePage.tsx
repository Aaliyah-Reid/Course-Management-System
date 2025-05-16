import React, { useState, useEffect } from 'react';
import { User, UserType } from '../../types/user';
import ProfileForm from './ProfileForm';
import { CameraIcon, PencilIcon, CheckIcon, XIcon } from 'lucide-react';

interface ProfilePageProps {
    user: User | null;
    userId: string | null;
    userType: UserType | null;
}

// Fallback user state for when userProp is null or loading
const createFallbackUserState = (userId: string | null, userType: UserType | null): User => {
  return {
    id: userId || 'fallback-id',
    userType: userType || UserType.Student, // Default to Student if null
    firstName: 'User', // Default placeholder
    lastName: '',   // Default placeholder
    email: 'user@example.com', // Default placeholder
    avatar: null,
    bio: 'Bio is not available.',
    phoneNumber: '',
    timezone: 'Not set',
    language: 'Not set',
    notifications: { // Ensure notifications has a default structure
      email: false,
      push: false,
      sms: false
    }
  };
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user: userProp, userId, userType }) => {
  const [userDisplay, setUserDisplay] = useState<User>(() => userProp || createFallbackUserState(userId, userType));
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(() => (userProp?.bio || createFallbackUserState(userId, userType).bio) || '');

  useEffect(() => {
    if (userProp) {
      setUserDisplay(userProp);
      setTempBio(userProp.bio || '');
    } else {
      // If userProp becomes null (e.g., on logout or if fetch fails), reset to a fallback state
      const fallback = createFallbackUserState(userId, userType);
      setUserDisplay(fallback);
      setTempBio(fallback.bio || '');
    }
  }, [userProp, userId, userType]);

  const handleSave = (updatedUserFields: Partial<User>) => {
    setUserDisplay(prevUser => ({ ...prevUser, ...updatedUserFields }));
    setIsEditing(false);
    // Actual save to backend would involve an API call and potentially updating App.tsx state
  };

  const handleBioSave = () => {
    setUserDisplay(prevUser => ({ ...prevUser, bio: tempBio }));
    setIsEditingBio(false);
    // Actual save to backend for bio
  };

  const handleBioCancel = () => {
    setTempBio(userDisplay.bio || '');
    setIsEditingBio(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      <div className="max-w-3xl mx-auto">
        <div className="bg-theme-background rounded-lg shadow border border-theme-primary/20">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-theme-primary/10 flex items-center justify-center overflow-hidden">
                  {userDisplay.avatar ? (
                    <img
                      src={userDisplay.avatar}
                      alt={`${userDisplay.firstName || ''} ${userDisplay.lastName || ''}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-medium text-theme-primary">
                      {(userDisplay.firstName?.[0] || 'U').toUpperCase()}
                      {(userDisplay.lastName?.[0] || '').toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 rounded-full bg-theme-secondary p-2 text-white shadow-sm hover:bg-theme-secondary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-secondary transition-colors"
                >
                  <CameraIcon className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-theme-text">
                  {userDisplay.firstName || 'User'} {userDisplay.lastName || ''}
                </h2>
                <p className="text-sm text-theme-text/70">{userDisplay.email || 'No email'}</p>
              </div>
            </div>

            {isEditing ? (
              <ProfileForm
                user={userDisplay}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-theme-text">Profile Information</h3>
                  <dl className="mt-4 space-y-4">
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-theme-text/70">Bio</dt>
                      <dd className="mt-1 text-sm text-theme-text sm:col-span-2 sm:mt-0">
                        {isEditingBio ? (
                          <div className="space-y-2">
                            <textarea
                              value={tempBio}
                              onChange={(e) => setTempBio(e.target.value)}
                              className="w-full rounded-md border-theme-primary/20 bg-theme-background text-theme-text shadow-sm focus:border-theme-secondary focus:ring-theme-secondary sm:text-sm"
                              rows={3}
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={handleBioCancel}
                                className="inline-flex items-center rounded-md bg-theme-background px-2.5 py-1.5 text-sm font-semibold text-theme-text shadow-sm ring-1 ring-inset ring-theme-primary/20 hover:bg-theme-primary/5 transition-colors"
                              >
                                <XIcon className="h-4 w-4 mr-1" />
                                Cancel
                              </button>
                              <button
                                onClick={handleBioSave}
                                className="inline-flex items-center rounded-md bg-theme-secondary px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-theme-secondary/90 transition-colors"
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group relative">
                            <p className="pr-8">{userDisplay.bio || 'No bio available.'}</p>
                            <button
                              onClick={() => {
                                setIsEditingBio(true);
                                setTempBio(userDisplay.bio || '');
                              }}
                              className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <PencilIcon className="h-4 w-4 text-theme-text/50 hover:text-theme-text transition-colors" />
                            </button>
                          </div>
                        )}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-theme-text/70">Phone Number</dt>
                      <dd className="mt-1 text-sm text-theme-text sm:col-span-2 sm:mt-0">
                        {userDisplay.phoneNumber || '-'}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-theme-text/70">Time Zone</dt>
                      <dd className="mt-1 text-sm text-theme-text sm:col-span-2 sm:mt-0">
                        {userDisplay.timezone || 'Not set'}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-theme-text/70">Language</dt>
                      <dd className="mt-1 text-sm text-theme-text sm:col-span-2 sm:mt-0">
                        {userDisplay.language === 'en' ? 'English' : (userDisplay.language || 'Not set')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-theme-text">Notifications</h3>
                  <dl className="mt-4 space-y-4">
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-theme-text/70">Email Notifications</dt>
                      <dd className="mt-1 text-sm text-theme-text sm:col-span-2 sm:mt-0">
                        {userDisplay.notifications?.email ? 'Enabled' : 'Disabled'}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-theme-text/70">Push Notifications</dt>
                      <dd className="mt-1 text-sm text-theme-text sm:col-span-2 sm:mt-0">
                        {userDisplay.notifications?.push ? 'Enabled' : 'Disabled'}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-theme-text/70">SMS Notifications</dt>
                      <dd className="mt-1 text-sm text-theme-text sm:col-span-2 sm:mt-0">
                        {userDisplay.notifications?.sms ? 'Enabled' : 'Disabled'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-md bg-theme-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-theme-secondary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-secondary transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;