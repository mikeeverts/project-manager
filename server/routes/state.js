import express from 'express';
import { getPool } from '../db.js';

const router = express.Router();

const defaultColorConfig = {
  ranges: [
    { min: 0,   max: 33,  color: '#ef4444', label: 'Not Started' },
    { min: 34,  max: 66,  color: '#f59e0b', label: 'In Progress' },
    { min: 67,  max: 99,  color: '#3b82f6', label: 'Nearly Done' },
    { min: 100, max: 100, color: '#22c55e', label: 'Complete'    },
  ],
};
const defaultUiColors = {
  sidebarBg: '#1e293b', sidebarAccent: '#6366f1',
  headerBg: '#ffffff', headerBorder: '#e2e8f0', contentBg: '#f8fafc',
};

function toIso(val) {
  if (!val) return null;
  return val instanceof Date ? val.toISOString() : val;
}

// GET /api/state — returns the full app state assembled from SQL tables
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    // ── Settings ──────────────────────────────────────────────────────────────
    const settingsRes = await pool.request().query('SELECT * FROM site_settings WHERE id = 1');
    const s = settingsRes.recordset[0] || {};

    // ── Companies ─────────────────────────────────────────────────────────────
    const companiesRes = await pool.request()
      .query('SELECT id, name, created_at FROM companies ORDER BY created_at');
    const companies = companiesRes.recordset.map(r => ({
      id: r.id, name: r.name, createdAt: toIso(r.created_at),
    }));

    // ── Departments ───────────────────────────────────────────────────────────
    const deptsRes = await pool.request()
      .query('SELECT id, company_id, name, color, created_at FROM departments ORDER BY created_at');
    const departments = deptsRes.recordset.map(r => ({
      id: r.id, companyId: r.company_id, name: r.name,
      color: r.color, createdAt: toIso(r.created_at),
    }));

    // ── Team members ──────────────────────────────────────────────────────────
    const membersRes = await pool.request().query(
      `SELECT id, company_id, name, email, avatar_color, role, password,
              department_id, is_disabled, must_change_password, created_at
       FROM team_members ORDER BY created_at`
    );
    const teamMembers = membersRes.recordset.map(r => ({
      id: r.id, companyId: r.company_id, name: r.name, email: r.email,
      avatarColor: r.avatar_color, role: r.role, password: r.password,
      departmentId: r.department_id, isDisabled: !!r.is_disabled,
      mustChangePassword: !!r.must_change_password,
      createdAt: toIso(r.created_at),
    }));

    // ── Projects with members ─────────────────────────────────────────────────
    const projectsRes = await pool.request().query(
      `SELECT p.id, p.company_id, p.name, p.description, p.color, p.status, p.created_at,
              pm.member_id, pm.project_role
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       ORDER BY p.created_at`
    );
    const projectMap = {};
    for (const r of projectsRes.recordset) {
      if (!projectMap[r.id]) {
        projectMap[r.id] = {
          id: r.id, companyId: r.company_id, name: r.name,
          description: r.description, color: r.color,
          status: r.status, createdAt: toIso(r.created_at), members: [],
        };
      }
      if (r.member_id) {
        projectMap[r.id].members.push({ memberId: r.member_id, projectRole: r.project_role });
      }
    }
    const projects = Object.values(projectMap);

    // ── Tasks with dependencies ───────────────────────────────────────────────
    const tasksRes = await pool.request().query(
      `SELECT t.id, t.project_id, t.title, t.description, t.assignee_id, t.department_id,
              t.assign_to_all, t.start_date, t.due_date, t.completion_percentage,
              t.status, t.priority, t.created_at, td.depends_on_id
       FROM tasks t
       LEFT JOIN task_dependencies td ON t.id = td.task_id
       ORDER BY t.created_at`
    );
    const taskMap = {};
    for (const r of tasksRes.recordset) {
      if (!taskMap[r.id]) {
        taskMap[r.id] = {
          id: r.id, projectId: r.project_id, title: r.title,
          description: r.description, assigneeId: r.assignee_id,
          departmentId: r.department_id, assignToAll: !!r.assign_to_all,
          startDate: toIso(r.start_date), dueDate: toIso(r.due_date),
          completionPercentage: r.completion_percentage,
          status: r.status, priority: r.priority,
          createdAt: toIso(r.created_at), dependencies: [],
        };
      }
      if (r.depends_on_id) taskMap[r.id].dependencies.push(r.depends_on_id);
    }
    const tasks = Object.values(taskMap);

    // ── Assemble response ─────────────────────────────────────────────────────
    res.json({
      siteOwner: {
        username:           s.site_owner_username || 'admin',
        password:           s.site_owner_password || '',
        mustChangePassword: s.must_change_password !== undefined ? !!s.must_change_password : true,
      },
      companies,
      departments,
      teamMembers,
      projects,
      tasks,
      colorConfig:      s.color_config ? JSON.parse(s.color_config) : defaultColorConfig,
      uiColors:         s.ui_colors    ? JSON.parse(s.ui_colors)    : defaultUiColors,
      companyName:      s.company_name      || 'ProjectHub',
      companyLogo:      s.company_logo      || null,
      themeMode:        s.theme_mode        || 'light',
      sidebarCollapsed: s.sidebar_collapsed !== undefined ? !!s.sidebar_collapsed : false,
    });
  } catch (e) {
    console.error('GET /api/state:', e.message);
    res.status(500).json({ message: e.message });
  }
});

export default router;
