/**
 * Maps each reducer action type to the corresponding API call.
 * Called after rawDispatch so the UI updates optimistically.
 * action._computed carries values pre-computed by the dispatch wrapper
 * for toggle actions where the reducer computes the new value.
 */
import { api } from './client.js';

export async function syncAction(action) {
  try {
    switch (action.type) {
      // ── Settings ────────────────────────────────────────────────────────────
      case 'UPDATE_SITE_OWNER':
        return api.put('/settings/site-owner', {
          password:           action.payload.password,
          mustChangePassword: action.payload.mustChangePassword ?? false,
        });
      case 'UPDATE_CURRENT_USER':
        // Session-only, no persistence needed
        break;
      case 'UPDATE_COLOR_CONFIG':
        return api.put('/settings', { colorConfig: action.payload });
      case 'UPDATE_UI_COLORS':
        return api.put('/settings', { uiColors: action.payload });
      case 'UPDATE_COMPANY_NAME':
        return api.put('/settings', { companyName: action.payload });
      case 'UPDATE_COMPANY_LOGO':
        return api.put('/settings', { companyLogo: action.payload });
      case 'SET_THEME_MODE':
        return api.put('/settings', { themeMode: action.payload });
      case 'TOGGLE_DARK_MODE':
        return api.put('/settings', { themeMode: action._themeMode });
      case 'TOGGLE_SIDEBAR':
        return api.put('/settings', { sidebarCollapsed: action._collapsed });
      case 'SET_FILTER_PROJECT':
        // UI-only state — skip DB write for performance
        break;

      // ── Companies ────────────────────────────────────────────────────────────
      case 'ADD_COMPANY':
        return api.post('/companies', action.payload);
      case 'UPDATE_COMPANY':
        return api.put(`/companies/${action.payload.id}`, action.payload);
      case 'DELETE_COMPANY':
        return api.del(`/companies/${action.payload}`);

      // ── Team members ─────────────────────────────────────────────────────────
      case 'ADD_MEMBER':
        return api.post('/members', action.payload);
      case 'UPDATE_MEMBER':
        return api.put(`/members/${action.payload.id}`, action.payload);
      case 'DELETE_MEMBER':
        return api.del(`/members/${action.payload}`);

      // ── Departments ──────────────────────────────────────────────────────────
      case 'ADD_DEPARTMENT':
        return api.post('/departments', action.payload);
      case 'UPDATE_DEPARTMENT':
        return api.put(`/departments/${action.payload.id}`, action.payload);
      case 'DELETE_DEPARTMENT':
        return api.del(`/departments/${action.payload}`);

      // ── Projects ─────────────────────────────────────────────────────────────
      case 'ADD_PROJECT':
        return api.post('/projects', action.payload);
      case 'UPDATE_PROJECT':
        return api.put(`/projects/${action.payload.id}`, action.payload);
      case 'DELETE_PROJECT':
        return api.del(`/projects/${action.payload}`);

      // ── Tasks ────────────────────────────────────────────────────────────────
      case 'ADD_TASK':
        return api.post('/tasks', action.payload);
      case 'UPDATE_TASK':
        return api.put(`/tasks/${action.payload.id}`, action.payload);
      case 'DELETE_TASK':
        return api.del(`/tasks/${action.payload}`);
      case 'UPDATE_TASK_STATUS':
        return api.patch(`/tasks/${action.payload.id}/status`, { status: action.payload.status });

      // ── Auth / session (local-only) ───────────────────────────────────────────
      case 'LOGIN':
      case 'LOGOUT':
      case 'SET_IMPERSONATION':
      case 'INIT_STATE':
        break;

      default:
        break;
    }
  } catch (e) {
    console.error(`[sync] ${action.type} failed:`, e.message);
  }
}
