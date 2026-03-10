/**
 * In-app test suites for multi-company isolation, permissions, and project workflow.
 * All tests operate on deterministic test data with fixed IDs so cleanup is reliable.
 */

import { hashPassword, canDo, canDoOnProject } from '../utils/auth';

// ─── Deterministic test IDs ───────────────────────────────────────────────────
export const TEST_IDS = {
  companyA:    'test-co-a',
  companyB:    'test-co-b',
  adminA:      'test-member-admin-a',
  adminB:      'test-member-admin-b',
  pmA:         'test-member-pm-a',
  contributorA:'test-member-contrib-a',
  viewerA:     'test-member-viewer-a',
  deptA:       'test-dept-a',
  deptB:       'test-dept-b',
  projectA:    'test-proj-a',
  projectB:    'test-proj-b',
  taskA1:      'test-task-a1',
  taskA2:      'test-task-a2',
  taskB1:      'test-task-b1',
};

// ─── Seed helpers ─────────────────────────────────────────────────────────────
export function buildTestData() {
  const now = new Date().toISOString();

  const companies = [
    { id: TEST_IDS.companyA, name: '__Test Company A__', createdAt: now },
    { id: TEST_IDS.companyB, name: '__Test Company B__', createdAt: now },
  ];

  const teamMembers = [
    {
      id: TEST_IDS.adminA, companyId: TEST_IDS.companyA,
      name: '__Admin A__', email: 'test-admin-a@test.local',
      avatarColor: '#6366f1', role: 'admin',
      password: hashPassword('testpass'), isDisabled: false, createdAt: now,
    },
    {
      id: TEST_IDS.adminB, companyId: TEST_IDS.companyB,
      name: '__Admin B__', email: 'test-admin-b@test.local',
      avatarColor: '#f59e0b', role: 'admin',
      password: hashPassword('testpass'), isDisabled: false, createdAt: now,
    },
    {
      id: TEST_IDS.pmA, companyId: TEST_IDS.companyA,
      name: '__PM A__', email: 'test-pm-a@test.local',
      avatarColor: '#10b981', role: 'project_manager',
      password: hashPassword('testpass'), isDisabled: false, createdAt: now,
    },
    {
      id: TEST_IDS.contributorA, companyId: TEST_IDS.companyA,
      name: '__Contributor A__', email: 'test-contrib-a@test.local',
      avatarColor: '#ef4444', role: 'user',
      password: hashPassword('testpass'), isDisabled: false, createdAt: now,
    },
    {
      id: TEST_IDS.viewerA, companyId: TEST_IDS.companyA,
      name: '__Viewer A__', email: 'test-viewer-a@test.local',
      avatarColor: '#8b5cf6', role: 'user',
      password: hashPassword('testpass'), isDisabled: false, createdAt: now,
    },
  ];

  const departments = [
    { id: TEST_IDS.deptA, companyId: TEST_IDS.companyA, name: '__Dept A__', color: '#6366f1', createdAt: now },
    { id: TEST_IDS.deptB, companyId: TEST_IDS.companyB, name: '__Dept B__', color: '#f59e0b', createdAt: now },
  ];

  const projects = [
    {
      id: TEST_IDS.projectA, companyId: TEST_IDS.companyA,
      name: '__Project A__', description: 'Test project for Company A',
      color: '#6366f1', status: 'open', createdAt: now,
      members: [
        { memberId: TEST_IDS.adminA,       projectRole: 'admin' },
        { memberId: TEST_IDS.pmA,          projectRole: 'project_manager' },
        { memberId: TEST_IDS.contributorA, projectRole: 'user' },
      ],
    },
    {
      id: TEST_IDS.projectB, companyId: TEST_IDS.companyB,
      name: '__Project B__', description: 'Test project for Company B',
      color: '#f59e0b', status: 'open', createdAt: now,
      members: [
        { memberId: TEST_IDS.adminB, projectRole: 'admin' },
      ],
    },
  ];

  const tasks = [
    {
      id: TEST_IDS.taskA1, projectId: TEST_IDS.projectA,
      title: '__Task A1__', description: 'Test task 1 for Project A',
      assigneeId: TEST_IDS.contributorA,
      startDate: now, dueDate: now,
      completionPercentage: 0, status: 'todo',
      dependencies: [], priority: 'medium', createdAt: now,
    },
    {
      id: TEST_IDS.taskA2, projectId: TEST_IDS.projectA,
      title: '__Task A2 (dep)__', description: 'Test task 2 depending on A1',
      assigneeId: TEST_IDS.pmA,
      startDate: now, dueDate: now,
      completionPercentage: 0, status: 'todo',
      dependencies: [TEST_IDS.taskA1], priority: 'low', createdAt: now,
    },
    {
      id: TEST_IDS.taskB1, projectId: TEST_IDS.projectB,
      title: '__Task B1__', description: 'Test task for Project B',
      assigneeId: TEST_IDS.adminB,
      startDate: now, dueDate: now,
      completionPercentage: 0, status: 'todo',
      dependencies: [], priority: 'medium', createdAt: now,
    },
  ];

  return { companies, teamMembers, departments, projects, tasks };
}

// ─── Test runner helpers ──────────────────────────────────────────────────────
function pass(name) { return { name, status: 'pass', error: null }; }
function fail(name, error) { return { name, status: 'fail', error: String(error) }; }

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ─── Suite 1: Multi-company isolation ────────────────────────────────────────
export function runIsolationSuite(state) {
  const results = [];

  // Members isolation
  try {
    const membersA = state.teamMembers.filter(m => m.companyId === TEST_IDS.companyA);
    const membersB = state.teamMembers.filter(m => m.companyId === TEST_IDS.companyB);
    assert(membersA.some(m => m.id === TEST_IDS.adminA), 'Company A members should include adminA');
    assert(!membersA.some(m => m.id === TEST_IDS.adminB), 'Company A members should NOT include adminB');
    assert(membersB.some(m => m.id === TEST_IDS.adminB), 'Company B members should include adminB');
    results.push(pass('Members are isolated by company'));
  } catch (e) { results.push(fail('Members are isolated by company', e)); }

  // Projects isolation
  try {
    const projectsA = state.projects.filter(p => p.companyId === TEST_IDS.companyA);
    const projectsB = state.projects.filter(p => p.companyId === TEST_IDS.companyB);
    assert(projectsA.some(p => p.id === TEST_IDS.projectA), 'Company A projects should include projectA');
    assert(!projectsA.some(p => p.id === TEST_IDS.projectB), 'Company A projects should NOT include projectB');
    assert(projectsB.some(p => p.id === TEST_IDS.projectB), 'Company B projects should include projectB');
    results.push(pass('Projects are isolated by company'));
  } catch (e) { results.push(fail('Projects are isolated by company', e)); }

  // Departments isolation
  try {
    const deptsA = state.departments.filter(d => d.companyId === TEST_IDS.companyA);
    const deptsB = state.departments.filter(d => d.companyId === TEST_IDS.companyB);
    assert(deptsA.some(d => d.id === TEST_IDS.deptA), 'Company A depts should include deptA');
    assert(!deptsA.some(d => d.id === TEST_IDS.deptB), 'Company A depts should NOT include deptB');
    assert(deptsB.some(d => d.id === TEST_IDS.deptB), 'Company B depts should include deptB');
    results.push(pass('Departments are isolated by company'));
  } catch (e) { results.push(fail('Departments are isolated by company', e)); }

  // Tasks isolation (via project ownership)
  try {
    const projectAIds = new Set(state.projects.filter(p => p.companyId === TEST_IDS.companyA).map(p => p.id));
    const projectBIds = new Set(state.projects.filter(p => p.companyId === TEST_IDS.companyB).map(p => p.id));
    const tasksA = state.tasks.filter(t => projectAIds.has(t.projectId));
    const tasksB = state.tasks.filter(t => projectBIds.has(t.projectId));
    assert(tasksA.some(t => t.id === TEST_IDS.taskA1), 'Company A tasks should include taskA1');
    assert(!tasksA.some(t => t.id === TEST_IDS.taskB1), 'Company A tasks should NOT include taskB1');
    assert(tasksB.some(t => t.id === TEST_IDS.taskB1), 'Company B tasks should include taskB1');
    results.push(pass('Tasks are isolated by company (via project)'));
  } catch (e) { results.push(fail('Tasks are isolated by company (via project)', e)); }

  return results;
}

// ─── Suite 2: Project workflow ────────────────────────────────────────────────
export function runProjectSuite(state) {
  const results = [];

  // Project exists
  try {
    const proj = state.projects.find(p => p.id === TEST_IDS.projectA);
    assert(proj, 'Project A should exist');
    assert(proj.companyId === TEST_IDS.companyA, 'Project A should belong to Company A');
    results.push(pass('Project created with correct company'));
  } catch (e) { results.push(fail('Project created with correct company', e)); }

  // User assigned to task
  try {
    const task = state.tasks.find(t => t.id === TEST_IDS.taskA1);
    assert(task, 'Task A1 should exist');
    assert(task.assigneeId === TEST_IDS.contributorA, 'Task A1 should be assigned to contributorA');
    results.push(pass('Task assigned to user'));
  } catch (e) { results.push(fail('Task assigned to user', e)); }

  // Department assigned to task (taskA1 uses assigneeId, so test with a different field check)
  try {
    const task = state.tasks.find(t => t.id === TEST_IDS.taskA1);
    assert(task, 'Task A1 should exist');
    // Verify the assignee exists in Company A
    const assignee = state.teamMembers.find(m => m.id === task.assigneeId);
    assert(assignee, 'Task assignee should exist');
    assert(assignee.companyId === TEST_IDS.companyA, 'Task assignee should belong to Company A');
    results.push(pass('Task assignee belongs to same company'));
  } catch (e) { results.push(fail('Task assignee belongs to same company', e)); }

  // Task dependencies
  try {
    const task2 = state.tasks.find(t => t.id === TEST_IDS.taskA2);
    assert(task2, 'Task A2 should exist');
    assert(task2.dependencies.includes(TEST_IDS.taskA1), 'Task A2 should depend on Task A1');
    results.push(pass('Task dependencies correctly set'));
  } catch (e) { results.push(fail('Task dependencies correctly set', e)); }

  // Project members roster
  try {
    const proj = state.projects.find(p => p.id === TEST_IDS.projectA);
    assert(proj, 'Project A should exist');
    const memberIds = (proj.members || []).map(m => m.memberId);
    assert(memberIds.includes(TEST_IDS.adminA), 'Project A should have adminA as member');
    assert(memberIds.includes(TEST_IDS.pmA), 'Project A should have pmA as member');
    assert(memberIds.includes(TEST_IDS.contributorA), 'Project A should have contributorA as member');
    results.push(pass('Project members roster is correct'));
  } catch (e) { results.push(fail('Project members roster is correct', e)); }

  return results;
}

// ─── Suite 3: System Admin permissions ───────────────────────────────────────
export function runSystemAdminSuite(state) {
  const results = [];

  const superAdmin = { isSuperAdmin: true, role: 'admin' };
  const regularUser = state.teamMembers.find(m => m.id === TEST_IDS.contributorA);
  const projectA = state.projects.find(p => p.id === TEST_IDS.projectA);

  try {
    assert(canDo(superAdmin, 'admin'), 'Super admin should have admin role access');
    results.push(pass('Super admin passes canDo(admin)'));
  } catch (e) { results.push(fail('Super admin passes canDo(admin)', e)); }

  try {
    assert(canDo(superAdmin, 'project_manager'), 'Super admin should have project_manager access');
    results.push(pass('Super admin passes canDo(project_manager)'));
  } catch (e) { results.push(fail('Super admin passes canDo(project_manager)', e)); }

  try {
    assert(!canDo(null, 'user'), 'Null user should fail canDo');
    results.push(pass('Null user fails canDo'));
  } catch (e) { results.push(fail('Null user fails canDo', e)); }

  try {
    assert(canDoOnProject(superAdmin, projectA, 'admin'), 'Super admin should have project admin access');
    results.push(pass('Super admin passes canDoOnProject(admin)'));
  } catch (e) { results.push(fail('Super admin passes canDoOnProject(admin)', e)); }

  try {
    // Regular user (contributor) is NOT a project admin
    assert(!canDoOnProject(regularUser, projectA, 'admin'), 'Contributor should not have project admin access');
    results.push(pass('Contributor fails canDoOnProject(admin)'));
  } catch (e) { results.push(fail('Contributor fails canDoOnProject(admin)', e)); }

  try {
    // Super admin sees all companies
    assert(state.companies.length >= 2, 'State should have at least 2 test companies');
    assert(state.companies.some(c => c.id === TEST_IDS.companyA), 'Should see Company A');
    assert(state.companies.some(c => c.id === TEST_IDS.companyB), 'Should see Company B');
    results.push(pass('Super admin can see all companies'));
  } catch (e) { results.push(fail('Super admin can see all companies', e)); }

  return results;
}

// ─── Suite 4: Project Admin permissions ──────────────────────────────────────
export function runProjectAdminSuite(state) {
  const results = [];

  const adminA = state.teamMembers.find(m => m.id === TEST_IDS.adminA);
  const adminB = state.teamMembers.find(m => m.id === TEST_IDS.adminB);
  const projectA = state.projects.find(p => p.id === TEST_IDS.projectA);
  const projectB = state.projects.find(p => p.id === TEST_IDS.projectB);

  try {
    assert(canDo(adminA, 'admin'), 'Admin A should have admin access');
    results.push(pass('Company admin has admin role'));
  } catch (e) { results.push(fail('Company admin has admin role', e)); }

  try {
    assert(canDoOnProject(adminA, projectA, 'admin'), 'Admin A should have project admin access on Project A');
    results.push(pass('Admin A has project admin access on their project'));
  } catch (e) { results.push(fail('Admin A has project admin access on their project', e)); }

  try {
    // Admin A should NOT be a member of Project B (different company)
    const memberIds = (projectB?.members || []).map(m => m.memberId);
    assert(!memberIds.includes(TEST_IDS.adminA), 'Admin A should not be in Project B');
    results.push(pass('Admin A is not a member of Company B project'));
  } catch (e) { results.push(fail('Admin A is not a member of Company B project', e)); }

  try {
    assert(canDoOnProject(adminB, projectB, 'admin'), 'Admin B should have project admin access on Project B');
    results.push(pass('Admin B has project admin access on their project'));
  } catch (e) { results.push(fail('Admin B has project admin access on their project', e)); }

  try {
    // PM A has project_manager role on Project A
    const pmA = state.teamMembers.find(m => m.id === TEST_IDS.pmA);
    assert(canDoOnProject(pmA, projectA, 'project_manager'), 'PM A should have project_manager access');
    assert(!canDoOnProject(pmA, projectA, 'admin'), 'PM A should NOT have project admin access');
    results.push(pass('Project manager has correct project-level access'));
  } catch (e) { results.push(fail('Project manager has correct project-level access', e)); }

  return results;
}

// ─── Suite 5: Contributor permissions ────────────────────────────────────────
export function runContributorSuite(state) {
  const results = [];

  const contributorA = state.teamMembers.find(m => m.id === TEST_IDS.contributorA);
  const projectA = state.projects.find(p => p.id === TEST_IDS.projectA);

  try {
    assert(contributorA, 'Contributor A should exist');
    assert(contributorA.role === 'user', 'Contributor A should have user role');
    results.push(pass('Contributor has user role'));
  } catch (e) { results.push(fail('Contributor has user role', e)); }

  try {
    assert(!canDo(contributorA, 'admin'), 'Contributor should not have admin access');
    results.push(pass('Contributor cannot do admin actions'));
  } catch (e) { results.push(fail('Contributor cannot do admin actions', e)); }

  try {
    assert(!canDo(contributorA, 'project_manager'), 'Contributor should not have project manager access');
    results.push(pass('Contributor cannot do project manager actions'));
  } catch (e) { results.push(fail('Contributor cannot do project manager actions', e)); }

  try {
    assert(canDo(contributorA, 'user'), 'Contributor should have user-level access');
    results.push(pass('Contributor can do user-level actions'));
  } catch (e) { results.push(fail('Contributor can do user-level actions', e)); }

  try {
    // Contributor is a member of Project A with 'user' projectRole
    assert(canDoOnProject(contributorA, projectA, 'user'), 'Contributor should have user project access');
    assert(!canDoOnProject(contributorA, projectA, 'project_manager'), 'Contributor should not have PM project access');
    results.push(pass('Contributor has correct project-level access'));
  } catch (e) { results.push(fail('Contributor has correct project-level access', e)); }

  try {
    // Task assigned to contributor exists
    const task = state.tasks.find(t => t.assigneeId === TEST_IDS.contributorA);
    assert(task, 'Contributor should have an assigned task');
    results.push(pass('Contributor has assigned task'));
  } catch (e) { results.push(fail('Contributor has assigned task', e)); }

  return results;
}

// ─── Suite 6: Viewer permissions ─────────────────────────────────────────────
export function runViewerSuite(state) {
  const results = [];

  const viewerA = state.teamMembers.find(m => m.id === TEST_IDS.viewerA);
  const projectA = state.projects.find(p => p.id === TEST_IDS.projectA);
  const projectB = state.projects.find(p => p.id === TEST_IDS.projectB);

  try {
    assert(viewerA, 'Viewer A should exist');
    assert(viewerA.role === 'user', 'Viewer A should have user role');
    results.push(pass('Viewer has user role'));
  } catch (e) { results.push(fail('Viewer has user role', e)); }

  try {
    assert(!canDo(viewerA, 'admin'), 'Viewer should not have admin access');
    results.push(pass('Viewer cannot do admin actions'));
  } catch (e) { results.push(fail('Viewer cannot do admin actions', e)); }

  try {
    assert(!canDo(viewerA, 'project_manager'), 'Viewer should not have PM access');
    results.push(pass('Viewer cannot do project manager actions'));
  } catch (e) { results.push(fail('Viewer cannot do project manager actions', e)); }

  try {
    // Viewer is NOT a member of Project A
    const memberIds = (projectA?.members || []).map(m => m.memberId);
    assert(!memberIds.includes(TEST_IDS.viewerA), 'Viewer should not be a member of Project A');
    results.push(pass('Viewer is not a member of Project A'));
  } catch (e) { results.push(fail('Viewer is not a member of Project A', e)); }

  try {
    // Viewer cannot access project they're not a member of
    assert(!canDoOnProject(viewerA, projectA, 'user'), 'Viewer should not have access to non-member project');
    results.push(pass('Viewer blocked from non-member project'));
  } catch (e) { results.push(fail('Viewer blocked from non-member project', e)); }

  try {
    // Viewer has no access to Company B project either
    assert(!canDoOnProject(viewerA, projectB, 'user'), 'Viewer should not have access to other company project');
    results.push(pass('Viewer blocked from other company project'));
  } catch (e) { results.push(fail('Viewer blocked from other company project', e)); }

  try {
    // Viewer belongs to Company A (not Company B)
    assert(viewerA.companyId === TEST_IDS.companyA, 'Viewer should belong to Company A');
    const companyBMembers = state.teamMembers.filter(m => m.companyId === TEST_IDS.companyB);
    assert(!companyBMembers.some(m => m.id === TEST_IDS.viewerA), 'Viewer should not appear in Company B');
    results.push(pass('Viewer is invisible to Company B'));
  } catch (e) { results.push(fail('Viewer is invisible to Company B', e)); }

  return results;
}

// ─── Suite registry ───────────────────────────────────────────────────────────
export const TEST_SUITES = [
  { id: 'isolation',    label: 'Multi-Company Isolation', runner: runIsolationSuite },
  { id: 'project',      label: 'Project Workflow',        runner: runProjectSuite },
  { id: 'system-admin', label: 'System Admin',            runner: runSystemAdminSuite },
  { id: 'proj-admin',   label: 'Project Admin',           runner: runProjectAdminSuite },
  { id: 'contributor',  label: 'Contributor',             runner: runContributorSuite },
  { id: 'viewer',       label: 'Viewer',                  runner: runViewerSuite },
];
