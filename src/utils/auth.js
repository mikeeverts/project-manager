export const ROLES = {
  admin: 3,
  project_manager: 2,
  user: 1,
};

export function canDo(currentUser, requiredRole) {
  if (!currentUser) return false;
  return (ROLES[currentUser.role] || 0) >= (ROLES[requiredRole] || 0);
}

// Convenience helpers
export const isAdmin = (u) => canDo(u, 'admin');
export const isProjectManager = (u) => canDo(u, 'project_manager');
export const isUser = (u) => canDo(u, 'user');

export function hashPassword(password) {
  // Simple deterministic hash for client-side demo (not production-safe)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export const ROLE_LABELS = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  user: 'User',
};
