const STORAGE_KEYS = {
  REMEMBER_ME: 'lms_remember_me',
  USER_ID: 'lms_user_id'
};

export const saveLoginPreferences = (userId: string, rememberMe: boolean): void => {
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  } else {
    clearLoginPreferences();
  }
};

export const getSavedLoginPreferences = (): { userId: string; rememberMe: boolean } => {
  const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || '';
  
  return { userId, rememberMe };
};

export const clearLoginPreferences = (): void => {
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
};