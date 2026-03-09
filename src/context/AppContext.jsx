import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { seedProjects, seedTeamMembers, seedTasks, seedDepartments, seedCompanies, defaultColorConfig } from '../utils/seeds';

const STORAGE_KEY = 'project_manager_state';

export const defaultUiColors = {
  sidebarBg:     '#1e293b',
  sidebarAccent: '#6366f1',
  headerBg:      '#ffffff',
  headerBorder:  '#e2e8f0',
};

const initialState = {
  companies: [],
  projects: [],
  teamMembers: [],
  tasks: [],
  departments: [],
  colorConfig: defaultColorConfig,
  uiColors: defaultUiColors,
  companyName: 'ProjectHub',
  companyLogo: null,
  darkMode: false,
  filterProject: 'all',
  sidebarCollapsed: false,
  currentUser: null,
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
    // Companies
    case 'ADD_COMPANY':
      return { ...state, companies: [...state.companies, action.payload] };
    case 'UPDATE_COMPANY':
      return {
        ...state,
        companies: state.companies.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c),
      };
    case 'DELETE_COMPANY':
      return { ...state, companies: state.companies.filter(c => c.id !== action.payload) };

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

    // Color Config
    case 'UPDATE_COLOR_CONFIG':
      return { ...state, colorConfig: action.payload };
    case 'UPDATE_UI_COLORS':
      return { ...state, uiColors: { ...state.uiColors, ...action.payload } };

    // Company branding (legacy single-company fields)
    case 'UPDATE_COMPANY_NAME':
      return { ...state, companyName: action.payload };
    case 'UPDATE_COMPANY_LOGO':
      return { ...state, companyLogo: action.payload };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'SET_FILTER_PROJECT':
      return { ...state, filterProject: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };

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

  if (!saved) {
    // Fresh install: start empty so setup wizard runs
    migratedCompanies = [];
    migratedMembers = [];
    migratedProjects = [];
  } else if (saved.companies && saved.companies.length > 0) {
    // Already has multi-company data
    migratedCompanies = saved.companies;
    migratedMembers = (saved.teamMembers || []).map(m => ({
      ...m,
      isDisabled: m.isDisabled ?? false,
    }));
    migratedProjects = saved.projects || [];
  } else {
    // Old single-company data: migrate by creating a default company
    const defaultCompanyId = uuidv4();
    const defaultCompany = {
      id: defaultCompanyId,
      name: saved.companyName || 'My Company',
      createdAt: new Date().toISOString(),
    };
    migratedCompanies = [defaultCompany];

    // Migrate members: add password from seeds if missing, add companyId
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
  }

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    companies: migratedCompanies,
    projects: migratedProjects,
    teamMembers: migratedMembers,
    tasks: saved?.tasks ?? [],
    departments: saved?.departments ?? [],
    uiColors: saved?.uiColors ? { ...defaultUiColors, ...saved.uiColors } : defaultUiColors,
    companyName: saved?.companyName ?? 'ProjectHub',
    companyLogo: saved?.companyLogo ?? null,
    darkMode: saved?.darkMode ?? false,
    filterProject: saved?.filterProject ?? 'all',
    sidebarCollapsed: saved?.sidebarCollapsed ?? false,
    currentUser: saved?.currentUser ?? null,
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Provide company-scoped views so all pages automatically see only their company's data
  const companyId = state.currentUser?.companyId;
  const companyProjects = companyId
    ? state.projects.filter(p => p.companyId === companyId)
    : state.projects;
  const companyMembers = companyId
    ? state.teamMembers.filter(m => m.companyId === companyId)
    : state.teamMembers;
  const companyProjectIds = new Set(companyProjects.map(p => p.id));
  const companyTasks = companyId
    ? state.tasks.filter(t => companyProjectIds.has(t.projectId))
    : state.tasks;

  const scopedState = {
    ...state,
    projects: companyProjects,
    teamMembers: companyMembers,
    tasks: companyTasks,
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
