import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { seedProjects, seedTeamMembers, seedTasks, seedDepartments, defaultColorConfig } from '../utils/seeds';

const STORAGE_KEY = 'project_manager_state';

const initialState = {
  projects: [],
  teamMembers: [],
  tasks: [],
  departments: [],
  colorConfig: defaultColorConfig,
  companyName: 'ProjectHub',
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

    // Company
    case 'UPDATE_COMPANY_NAME':
      return { ...state, companyName: action.payload };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const saved = loadState();

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    projects: seedProjects,
    teamMembers: seedTeamMembers,
    tasks: seedTasks,
    departments: seedDepartments,
    ...(saved || {}),
    departments: saved?.departments ?? seedDepartments,
    companyName: saved?.companyName ?? 'ProjectHub',
  });

  const [filterProject, setFilterProject] = useState('all');

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch, filterProject, setFilterProject }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
