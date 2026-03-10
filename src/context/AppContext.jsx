import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/auth';
import { seedProjects, seedTeamMembers, seedTasks, seedDepartments, defaultColorConfig } from '../utils/seeds';

const STORAGE_KEY = 'project_manager_state';

export const defaultUiColors = {
  sidebarBg:     '#1e293b',
  sidebarAccent: '#6366f1',
  headerBg:      '#ffffff',
  headerBorder:  '#e2e8f0',
  contentBg:     '#f8fafc',
};

const DEFAULT_SITE_OWNER = {
  username: 'admin',
  password: hashPassword('admin'),
  mustChangePassword: true,
};

const initialState = {
  siteOwner: DEFAULT_SITE_OWNER,
  companies: [],
  projects: [],
  teamMembers: [],
  tasks: [],
  departments: [],
  colorConfig: defaultColorConfig,
  uiColors: defaultUiColors,
  companyName: 'ProjectHub',
  companyLogo: null,
  themeMode: 'light', // 'light' | 'dark' | 'system'
  filterProject: 'all',
  sidebarCollapsed: false,
  currentUser: null,
  impersonatedCompanyId: null,
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function reducer(state, action) {
  switch (action.type) {
    // Site owner
    case 'UPDATE_SITE_OWNER':
      return { ...state, siteOwner: { ...state.siteOwner, ...action.payload } };
    case 'UPDATE_CURRENT_USER':
      return { ...state, currentUser: state.currentUser ? { ...state.currentUser, ...action.payload } : state.currentUser };

    // Companies
    case 'ADD_COMPANY':
      return { ...state, companies: [...state.companies, action.payload] };
    case 'UPDATE_COMPANY':
      return {
        ...state,
        companies: state.companies.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c),
      };
    case 'DELETE_COMPANY':
      return {
        ...state,
        companies: state.companies.filter(c => c.id !== action.payload),
        teamMembers: state.teamMembers.filter(m => m.companyId !== action.payload),
        projects: state.projects.filter(p => p.companyId !== action.payload),
      };

    // Projects
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        tasks: state.tasks.filter(t => t.projectId !== action.payload),
      };

    // Team Members
    case 'ADD_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, action.payload] };
    case 'UPDATE_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.map(m => m.id === action.payload.id ? { ...m, ...action.payload } : m),
      };
    case 'DELETE_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.filter(m => m.id !== action.payload),
        tasks: state.tasks.map(t => t.assigneeId === action.payload ? { ...t, assigneeId: null } : t),
      };

    // Tasks
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks
          .filter(t => t.id !== action.payload)
          .map(t => ({
            ...t,
            dependencies: (t.dependencies || []).filter(depId => depId !== action.payload),
          })),
      };
    case 'UPDATE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id ? { ...t, status: action.payload.status } : t
        ),
      };

    // Departments
    case 'ADD_DEPARTMENT':
      return { ...state, departments: [...state.departments, action.payload] };
    case 'UPDATE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d),
      };
    case 'DELETE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.filter(d => d.id !== action.payload),
        teamMembers: state.teamMembers.map(m => m.departmentId === action.payload ? { ...m, departmentId: null } : m),
        tasks: state.tasks.map(t => t.departmentId === action.payload ? { ...t, departmentId: null } : t),
      };

    // Colors / UI
    case 'UPDATE_COLOR_CONFIG':
      return { ...state, colorConfig: action.payload };
    case 'UPDATE_UI_COLORS':
      return { ...state, uiColors: { ...state.uiColors, ...action.payload } };
    case 'UPDATE_COMPANY_NAME':
      return { ...state, companyName: action.payload };
    case 'UPDATE_COMPANY_LOGO':
      return { ...state, companyLogo: action.payload };
    case 'SET_THEME_MODE':
      return { ...state, themeMode: action.payload };
    case 'TOGGLE_DARK_MODE': {
      // Cycles: light → dark → system → light
      const next = { light: 'dark', dark: 'system', system: 'light' };
      return { ...state, themeMode: next[state.themeMode] || 'dark' };
    }
    case 'SET_FILTER_PROJECT':
      return { ...state, filterProject: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    // Auth
    case 'LOGIN':
      return { ...state, currentUser: action.payload, impersonatedCompanyId: null };
    case 'LOGOUT':
      return { ...state, currentUser: null, impersonatedCompanyId: null };

    // Impersonation (super-admin viewing a company as admin)
    case 'SET_IMPERSONATION':
      return { ...state, impersonatedCompanyId: action.payload, filterProject: 'all' };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const saved = loadState();

  // --- Migration: handle upgrades from previous versions ---
  let migratedCompanies;
  let migratedMembers;
  let migratedProjects;
  let migratedDepartments;

  if (!saved) {
    // Fresh install: empty data so setup wizard runs
    migratedCompanies = [];
    migratedMembers = [];
    migratedProjects = [];
    migratedDepartments = [];
  } else if (saved.companies && saved.companies.length > 0) {
    migratedCompanies = saved.companies;
    migratedMembers = (saved.teamMembers || []).map(m => ({
      ...m,
      isDisabled: m.isDisabled ?? false,
    }));
    migratedProjects = saved.projects || [];
    // Migrate departments: if companyId missing, assign to first company
    const firstCompanyId = saved.companies[0]?.id;
    migratedDepartments = (saved.departments || []).map(d => ({
      ...d,
      companyId: d.companyId || firstCompanyId,
    }));
  } else {
    // Old single-company data: create default company from saved companyName
    const defaultCompanyId = uuidv4();
    migratedCompanies = [{
      id: defaultCompanyId,
      name: saved.companyName || 'My Company',
      createdAt: new Date().toISOString(),
    }];
    migratedMembers = (saved.teamMembers || []).map(m => {
      const seed = seedTeamMembers.find(s => s.id === m.id);
      return {
        ...m,
        password: m.password || seed?.password,
        role: m.role || seed?.role,
        companyId: m.companyId || defaultCompanyId,
        isDisabled: m.isDisabled ?? false,
      };
    });
    migratedProjects = (saved.projects || []).map(p => ({
      ...p,
      companyId: p.companyId || defaultCompanyId,
    }));
    migratedDepartments = (saved.departments || []).map(d => ({
      ...d,
      companyId: d.companyId || defaultCompanyId,
    }));
  }

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    siteOwner: saved?.siteOwner ?? DEFAULT_SITE_OWNER,
    companies: migratedCompanies,
    projects: migratedProjects,
    teamMembers: migratedMembers,
    tasks: saved?.tasks ?? [],
    departments: migratedDepartments,
    uiColors: saved?.uiColors ? { ...defaultUiColors, ...saved.uiColors } : defaultUiColors,
    companyName: saved?.companyName ?? 'ProjectHub',
    companyLogo: saved?.companyLogo ?? null,
    themeMode: saved?.themeMode ?? (saved?.darkMode ? 'dark' : 'light'),
    filterProject: saved?.filterProject ?? 'all',
    sidebarCollapsed: saved?.sidebarCollapsed ?? false,
    currentUser: saved?.currentUser ?? null,
    impersonatedCompanyId: saved?.impersonatedCompanyId ?? null,
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Scoped state: filter data to the active company
  // Super-admin sees company data when impersonating, all data otherwise
  const activeCompanyId = state.impersonatedCompanyId ?? state.currentUser?.companyId ?? null;
  const scopedProjects = activeCompanyId
    ? state.projects.filter(p => p.companyId === activeCompanyId)
    : state.projects;
  const scopedMembers = activeCompanyId
    ? state.teamMembers.filter(m => m.companyId === activeCompanyId)
    : state.teamMembers;
  const scopedProjectIds = new Set(scopedProjects.map(p => p.id));
  const scopedTasks = activeCompanyId
    ? state.tasks.filter(t => scopedProjectIds.has(t.projectId))
    : state.tasks;
  const scopedDepartments = activeCompanyId
    ? state.departments.filter(d => d.companyId === activeCompanyId)
    : state.departments;

  const scopedState = {
    ...state,
    projects: scopedProjects,
    teamMembers: scopedMembers,
    tasks: scopedTasks,
    departments: scopedDepartments,
  };

  return (
    <AppContext.Provider value={{ state: scopedState, dispatch, rawState: state }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
