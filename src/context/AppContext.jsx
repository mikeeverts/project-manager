import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { defaultColorConfig } from '../utils/seeds';
import { syncAction } from '../api/sync.js';

export const defaultUiColors = {
  sidebarBg:     '#1e293b',
  sidebarAccent: '#6366f1',
  headerBg:      '#ffffff',
  headerBorder:  '#e2e8f0',
  contentBg:     '#f8fafc',
};

export const defaultDarkUiColors = {
  sidebarBg:     '#0f172a',
  sidebarAccent: '#6366f1',
  headerBg:      '#1e293b',
  headerBorder:  '#334155',
  contentBg:     '#0f172a',
};

const initialState = {
  siteOwner:            { username: 'admin', password: '', mustChangePassword: true },
  companies:            [],
  projects:             [],
  teamMembers:          [],
  tasks:                [],
  departments:          [],
  colorConfig:          defaultColorConfig,
  uiColors:             defaultUiColors,
  companyName:          'ProjectHub',
  companyLogo:          null,
  themeMode:            'light',
  filterProject:        'all',
  sidebarCollapsed:     false,
  currentUser:          null,
  impersonatedCompanyId: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_STATE':
      // Load server state while preserving session-only fields
      return {
        ...initialState,
        ...action.payload,
        currentUser:           state.currentUser,
        impersonatedCompanyId: state.impersonatedCompanyId,
        filterProject:         state.filterProject,
      };

    case 'UPDATE_SITE_OWNER':
      return { ...state, siteOwner: { ...state.siteOwner, ...action.payload } };
    case 'UPDATE_CURRENT_USER':
      return { ...state, currentUser: state.currentUser ? { ...state.currentUser, ...action.payload } : state.currentUser };

    case 'ADD_COMPANY':
      return { ...state, companies: [...state.companies, action.payload] };
    case 'UPDATE_COMPANY':
      return { ...state, companies: state.companies.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c) };
    case 'DELETE_COMPANY':
      return {
        ...state,
        companies:   state.companies.filter(c => c.id !== action.payload),
        teamMembers: state.teamMembers.filter(m => m.companyId !== action.payload),
        projects:    state.projects.filter(p => p.companyId !== action.payload),
        departments: state.departments.filter(d => d.companyId !== action.payload),
      };

    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        tasks:    state.tasks.filter(t => t.projectId !== action.payload),
      };

    case 'ADD_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, action.payload] };
    case 'UPDATE_MEMBER':
      return { ...state, teamMembers: state.teamMembers.map(m => m.id === action.payload.id ? { ...m, ...action.payload } : m) };
    case 'DELETE_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.filter(m => m.id !== action.payload),
        tasks:       state.tasks.map(t => t.assigneeId === action.payload ? { ...t, assigneeId: null } : t),
      };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks
          .filter(t => t.id !== action.payload)
          .map(t => ({ ...t, dependencies: (t.dependencies || []).filter(id => id !== action.payload) })),
      };
    case 'UPDATE_TASK_STATUS':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, status: action.payload.status } : t) };

    case 'ADD_DEPARTMENT':
      return { ...state, departments: [...state.departments, action.payload] };
    case 'UPDATE_DEPARTMENT':
      return { ...state, departments: state.departments.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d) };
    case 'DELETE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.filter(d => d.id !== action.payload),
        teamMembers: state.teamMembers.map(m => m.departmentId === action.payload ? { ...m, departmentId: null } : m),
        tasks:       state.tasks.map(t => t.departmentId === action.payload ? { ...t, departmentId: null } : t),
      };

    case 'UPDATE_COLOR_CONFIG':
      return { ...state, colorConfig: action.payload };
    case 'UPDATE_UI_COLORS':
      return { ...state, uiColors: { ...state.uiColors, ...action.payload } };
    case 'UPDATE_COMPANY_NAME':
      return { ...state, companyName: action.payload };
    case 'UPDATE_COMPANY_LOGO':
      return { ...state, companyLogo: action.payload };
    case 'SET_THEME_MODE': {
      const newMode = action.payload;
      const isCurrentlyDark = state.themeMode === 'dark';
      const isGoingDark = newMode === 'dark';
      const colorsAreDefault =
        JSON.stringify(state.uiColors) === JSON.stringify(defaultUiColors) ||
        JSON.stringify(state.uiColors) === JSON.stringify(defaultDarkUiColors);
      const newColors = colorsAreDefault
        ? (isGoingDark ? defaultDarkUiColors : defaultUiColors)
        : state.uiColors;
      return { ...state, themeMode: newMode, uiColors: newColors };
    }
    case 'TOGGLE_DARK_MODE': {
      const next = { light: 'dark', dark: 'system', system: 'light' };
      const newMode = next[state.themeMode] || 'dark';
      const colorsAreDefault =
        JSON.stringify(state.uiColors) === JSON.stringify(defaultUiColors) ||
        JSON.stringify(state.uiColors) === JSON.stringify(defaultDarkUiColors);
      const newColors = colorsAreDefault
        ? (newMode === 'dark' ? defaultDarkUiColors : defaultUiColors)
        : state.uiColors;
      return { ...state, themeMode: newMode, uiColors: newColors };
    }
    case 'SET_FILTER_PROJECT':
      return { ...state, filterProject: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'LOGIN':
      return { ...state, currentUser: action.payload, impersonatedCompanyId: null };
    case 'LOGOUT':
      return { ...state, currentUser: null, impersonatedCompanyId: null };
    case 'SET_IMPERSONATION':
      return { ...state, impersonatedCompanyId: action.payload, filterProject: 'all' };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const [apiStatus, setApiStatus] = useState({ loading: true, dbConfigured: null, error: null });

  // ── Initialize: check health, load state from API ────────────────────────
  const initializeApp = useCallback(async () => {
    setApiStatus({ loading: true, dbConfigured: null, error: null });
    try {
      const healthRes = await fetch('/api/health');
      const health    = await healthRes.json();

      if (!health.dbConfigured) {
        setApiStatus({ loading: false, dbConfigured: false, error: null });
        return;
      }

      const stateRes   = await fetch('/api/state');
      const serverState = await stateRes.json();
      rawDispatch({ type: 'INIT_STATE', payload: serverState });
      setApiStatus({ loading: false, dbConfigured: true, error: null });
    } catch (e) {
      setApiStatus({ loading: false, dbConfigured: null, error: `Cannot reach server: ${e.message}` });
    }
  }, []);

  useEffect(() => { initializeApp(); }, [initializeApp]);

  // ── Dispatch wrapper: optimistic update + async API sync ─────────────────
  const dispatch = useCallback((action) => {
    // Enrich toggle actions with the computed new value so syncAction can persist it
    const colorsAreDefault =
      JSON.stringify(state.uiColors) === JSON.stringify(defaultUiColors) ||
      JSON.stringify(state.uiColors) === JSON.stringify(defaultDarkUiColors);
    let enriched = action;
    if (action.type === 'TOGGLE_DARK_MODE') {
      const next = { light: 'dark', dark: 'system', system: 'light' };
      const newMode = next[state.themeMode] || 'dark';
      const newColors = colorsAreDefault
        ? (newMode === 'dark' ? defaultDarkUiColors : defaultUiColors)
        : state.uiColors;
      enriched = { ...action, _themeMode: newMode, _uiColors: newColors };
    }
    if (action.type === 'SET_THEME_MODE') {
      const newColors = colorsAreDefault
        ? (action.payload === 'dark' ? defaultDarkUiColors : defaultUiColors)
        : state.uiColors;
      enriched = { ...action, _uiColors: newColors };
    }
    if (action.type === 'TOGGLE_SIDEBAR') {
      enriched = { ...action, _collapsed: !state.sidebarCollapsed };
    }
    rawDispatch(enriched);
    syncAction(enriched); // fire-and-forget
  }, [state.themeMode, state.sidebarCollapsed, state.uiColors]);

  // ── Scoped state: filter to active company ───────────────────────────────
  const activeCompanyId = state.impersonatedCompanyId ?? state.currentUser?.companyId ?? null;
  const scopedProjects    = activeCompanyId ? state.projects.filter(p => p.companyId === activeCompanyId)    : state.projects;
  const scopedMembers     = activeCompanyId ? state.teamMembers.filter(m => m.companyId === activeCompanyId) : state.teamMembers;
  const scopedProjectIds  = new Set(scopedProjects.map(p => p.id));
  const scopedTasks       = activeCompanyId ? state.tasks.filter(t => scopedProjectIds.has(t.projectId))     : state.tasks;
  const scopedDepartments = activeCompanyId ? state.departments.filter(d => d.companyId === activeCompanyId) : state.departments;

  const scopedState = {
    ...state,
    projects:    scopedProjects,
    teamMembers: scopedMembers,
    tasks:       scopedTasks,
    departments: scopedDepartments,
  };

  return (
    <AppContext.Provider value={{ state: scopedState, dispatch, rawState: state, apiStatus, reinitialize: initializeApp }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
