const prefix = 'react_admin_';

export const storage = {
  get: <T>(key: string): T | null => {
    const value = localStorage.getItem(prefix + key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    }
    return null;
  },
  set: (key: string, value: unknown) => {
    localStorage.setItem(prefix + key, JSON.stringify(value));
  },
  remove: (key: string) => {
    localStorage.removeItem(prefix + key);
  },
  clear: () => {
    localStorage.clear();
  },
};

export const sessionStorageUtil = {
  get: <T>(key: string): T | null => {
    const value = sessionStorage.getItem(prefix + key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    }
    return null;
  },
  set: (key: string, value: unknown) => {
    sessionStorage.setItem(prefix + key, JSON.stringify(value));
  },
  remove: (key: string) => {
    sessionStorage.removeItem(prefix + key);
  },
};
