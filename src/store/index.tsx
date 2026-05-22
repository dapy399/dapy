import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { storage } from '@/utils/storage';
import type { User, MenuItem, TabItem } from '@/types/index';

interface AppState {
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  collapsed: boolean;
  menuList: MenuItem[];
  permissionList: string[];
  tabs: TabItem[];
  activeTabKey: string;
}

type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_COLLAPSED'; payload: boolean }
  | { type: 'SET_MENU_LIST'; payload: MenuItem[] }
  | { type: 'SET_PERMISSION_LIST'; payload: string[] }
  | { type: 'ADD_TAB'; payload: TabItem }
  | { type: 'REMOVE_TAB'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'CLEAR_TABS' }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: storage.get<User>('user'),
  token: storage.get<string>('token'),
  theme: storage.get<'light' | 'dark'>('theme') || 'light',
  collapsed: false,
  menuList: storage.get<MenuItem[]>('menuList') || [],
  permissionList: storage.get<string[]>('permissionList') || [],
  tabs: [{ key: '/dashboard', label: '工作台', path: '/dashboard', closable: false }],
  activeTabKey: '/dashboard',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      if (action.payload) storage.set('user', action.payload);
      else storage.remove('user');
      return { ...state, user: action.payload };
    case 'SET_TOKEN':
      if (action.payload) storage.set('token', action.payload);
      else storage.remove('token');
      return { ...state, token: action.payload };
    case 'SET_THEME':
      storage.set('theme', action.payload);
      return { ...state, theme: action.payload };
    case 'SET_COLLAPSED':
      return { ...state, collapsed: action.payload };
    case 'SET_MENU_LIST':
      if (action.payload && action.payload.length > 0) {
        storage.set('menuList', action.payload);
      }
      return { ...state, menuList: action.payload };
    case 'SET_PERMISSION_LIST':
      if (action.payload && action.payload.length > 0) {
        storage.set('permissionList', action.payload);
      }
      return { ...state, permissionList: action.payload };
    case 'ADD_TAB': {
      const exists = state.tabs.find((tab) => tab.key === action.payload.key);
      if (exists) {
        return { ...state, activeTabKey: action.payload.key };
      }
      const newTabs = [...state.tabs, action.payload];
      return { ...state, tabs: newTabs, activeTabKey: action.payload.key };
    }
    case 'REMOVE_TAB': {
      const newTabs = state.tabs.filter((tab) => tab.key !== action.payload);
      let activeKey = state.activeTabKey;
      if (activeKey === action.payload && newTabs.length > 0) {
        activeKey = newTabs[newTabs.length - 1].key;
      }
      return { ...state, tabs: newTabs, activeTabKey: activeKey };
    }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabKey: action.payload };
    case 'CLEAR_TABS':
      return { ...state, tabs: [initialState.tabs[0]], activeTabKey: '/dashboard' };
    case 'LOGOUT':
      storage.remove('token');
      storage.remove('user');
      storage.remove('menuList');
      storage.remove('permissionList');
      return {
        ...initialState,
        user: null,
        token: null,
        menuList: [],
        permissionList: [],
        tabs: [initialState.tabs[0]],
        activeTabKey: '/dashboard',
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppProvider');
  }
  return context;
};

// 快捷hooks
export const useUser = () => {
  const { state } = useAppStore();
  return state.user;
};

export const useTheme = () => {
  const { state, dispatch } = useAppStore();
  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  }, [state.theme, dispatch]);
  return { theme: state.theme, toggleTheme };
};

export const usePermission = () => {
  const { state } = useAppStore();
  const hasPermission = useCallback(
    (permission: string) => {
      return state.permissionList.includes(permission) || state.permissionList.includes('*');
    },
    [state.permissionList]
  );
  return { hasPermission, permissions: state.permissionList };
};
