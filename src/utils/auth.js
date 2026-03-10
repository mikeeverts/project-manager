export const ROLES = {
  admin: 3,
  project_manager: 2,
  user: 1,
};

export function canDo(currentUser, requiredRole) {
  if (!currentUser) return false;
  if (currentUser.isSuperAdmin) return true; // site owner can do anything
  return (ROLES[currentUser.role] || 0) >= (ROLES[requiredRole] || 0);
}

// Convenience helpers
export const isAdmin = (u) => canDo(u, 'admin');
export const isProjectManager = (u) => canDo(u, 'project_manager');
export const isUser = (u) => canDo(u, 'user');

// Check if user has a given role on a specific project
// projectRole levels: admin > project_manager > user (same ROLES mapping)
export function canDoOnProject(currentUser, project, requiredProjectRole) {
  if (!currentUser || !project) return false;
  if (currentUser.isSuperAdmin) return true;
  // Company admins have full access to all company projects
  if (ROLES[currentUser.role] >= ROLES['admin']) return true;
  const membership = (project.members || []).find(m => m.memberId === currentUser.id);
  if (!membership) return false;
  return (ROLES[membership.projectRole] || 0) >= (ROLES[requiredProjectRole] || 0);
}

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
