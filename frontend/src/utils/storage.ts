const STORAGE_KEYS = {
  REMEMBER_ME: 'lms_remember_me',
  USER_EMAIL: 'lms_user_email'
};

export const saveLoginPreferences = (email: string, rememberMe: boolean): void => {
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
  } else {
    clearLoginPreferences();
  }
};

export const getSavedLoginPreferences = (): { email: string; rememberMe: boolean } => {
  const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '';
  
  return { email, rememberMe };
};

export const clearLoginPreferences = (): void => {
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
};