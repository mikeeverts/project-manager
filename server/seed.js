import { sql } from './db.js';
import { seedCompanies, seedDepartments, seedTeamMembers, seedProjects, seedTasks } from '../src/utils/seeds.js';
import { defaultColorConfig } from '../src/utils/seeds.js';

// Default UI colors (mirrors AppContext.jsx defaultUiColors)
const defaultUiColors = {
  sidebarBg:     '#1e293b',
  sidebarAccent: '#6366f1',
  headerBg:      '#ffffff',
  headerBorder:  '#e2e8f0',
  contentBg:     '#f8fafc',
};

export async function insertSeedData(pool) {
  // Companies
  for (const c of seedCompanies) {
    const exists = await pool.request()
      .input('id', sql.NVarChar, c.id)
      .query('SELECT 1 FROM companies WHERE id = @id');
    if (exists.recordset.length === 0) {
      await pool.request()
        .input('id',        sql.NVarChar,      c.id)
        .input('name',      sql.NVarChar,      c.name)
        .input('createdAt', sql.DateTimeOffset, new Date(c.createdAt))
        .query('INSERT INTO companies (id, name, created_at) VALUES (@id, @name, @createdAt)');
    }
  }

  // Departments
  for (const d of seedDepartments) {
    const exists = await pool.request()
      .input('id', sql.NVarChar, d.id)
      .query('SELECT 1 FROM departments WHERE id = @id');
    if (exists.recordset.length === 0) {
      await pool.request()
        .input('id',        sql.NVarChar,      d.id)
        .input('companyId', sql.NVarChar,      d.companyId)
        .input('name',      sql.NVarChar,      d.name)
        .input('color',     sql.NVarChar,      d.color)
        .input('createdAt', sql.DateTimeOffset, new Date(d.createdAt))
        .query('INSERT INTO departments (id, company_id, name, color, created_at) VALUES (@id, @companyId, @name, @color, @createdAt)');
    }
  }

  // Team members
  for (const m of seedTeamMembers) {
    const exists = await pool.request()
      .input('id', sql.NVarChar, m.id)
      .query('SELECT 1 FROM team_members WHERE id = @id');
    if (exists.recordset.length === 0) {
      await pool.request()
        .input('id',           sql.NVarChar,      m.id)
        .input('companyId',    sql.NVarChar,      m.companyId)
        .input('name',         sql.NVarChar,      m.name)
        .input('email',        sql.NVarChar,      m.email)
        .input('avatarColor',  sql.NVarChar,      m.avatarColor)
        .input('role',         sql.NVarChar,      m.role)
        .input('password',     sql.NVarChar,      m.password)
        .input('departmentId', sql.NVarChar,      m.departmentId || null)
        .input('isDisabled',   sql.Bit,           m.isDisabled ? 1 : 0)
        .input('createdAt',    sql.DateTimeOffset, new Date(m.createdAt))
        .query(`INSERT INTO team_members
          (id, company_id, name, email, avatar_color, role, password, department_id, is_disabled, created_at)
          VALUES (@id, @companyId, @name, @email, @avatarColor, @role, @password, @departmentId, @isDisabled, @createdAt)`);
    }
  }

  // Projects
  for (const p of seedProjects) {
    const exists = await pool.request()
      .input('id', sql.NVarChar, p.id)
      .query('SELECT 1 FROM projects WHERE id = @id');
    if (exists.recordset.length === 0) {
      await pool.request()
        .input('id',          sql.NVarChar,      p.id)
        .input('companyId',   sql.NVarChar,      p.companyId)
        .input('name',        sql.NVarChar,      p.name)
        .input('description', sql.NVarChar,      p.description || null)
        .input('color',       sql.NVarChar,      p.color)
        .input('status',      sql.NVarChar,      p.status || 'open')
        .input('createdAt',   sql.DateTimeOffset, new Date(p.createdAt))
        .query(`INSERT INTO projects (id, company_id, name, description, color, status, created_at)
                VALUES (@id, @companyId, @name, @description, @color, @status, @createdAt)`);

      // Project members
      for (const pm of (p.members || [])) {
        await pool.request()
          .input('projectId',  sql.NVarChar, p.id)
          .input('memberId',   sql.NVarChar, pm.memberId)
          .input('projectRole', sql.NVarChar, pm.projectRole)
          .query(`INSERT INTO project_members (project_id, member_id, project_role)
                  VALUES (@projectId, @memberId, @projectRole)`);
      }
    }
  }

  // Tasks
  for (const t of seedTasks) {
    const exists = await pool.request()
      .input('id', sql.NVarChar, t.id)
      .query('SELECT 1 FROM tasks WHERE id = @id');
    if (exists.recordset.length === 0) {
      await pool.request()
        .input('id',                   sql.NVarChar,      t.id)
        .input('projectId',            sql.NVarChar,      t.projectId)
        .input('title',                sql.NVarChar,      t.title)
        .input('description',          sql.NVarChar,      t.description || null)
        .input('assigneeId',           sql.NVarChar,      t.assigneeId || null)
        .input('departmentId',         sql.NVarChar,      t.departmentId || null)
        .input('assignToAll',          sql.Bit,           t.assignToAll ? 1 : 0)
        .input('startDate',            sql.DateTimeOffset, t.startDate ? new Date(t.startDate) : null)
        .input('dueDate',              sql.DateTimeOffset, t.dueDate   ? new Date(t.dueDate)   : null)
        .input('completionPercentage', sql.Int,           t.completionPercentage || 0)
        .input('status',               sql.NVarChar,      t.status)
        .input('priority',             sql.NVarChar,      t.priority)
        .input('createdAt',            sql.DateTimeOffset, new Date(t.createdAt))
        .query(`INSERT INTO tasks
          (id, project_id, title, description, assignee_id, department_id, assign_to_all,
           start_date, due_date, completion_percentage, status, priority, created_at)
          VALUES
          (@id, @projectId, @title, @description, @assigneeId, @departmentId, @assignToAll,
           @startDate, @dueDate, @completionPercentage, @status, @priority, @createdAt)`);

      // Task dependencies
      for (const depId of (t.dependencies || [])) {
        await pool.request()
          .input('taskId',     sql.NVarChar, t.id)
          .input('dependsOnId', sql.NVarChar, depId)
          .query('INSERT INTO task_dependencies (task_id, depends_on_id) VALUES (@taskId, @dependsOnId)');
      }
    }
  }

  // Ensure site_settings row exists with defaults
  const settingsExists = await pool.request().query('SELECT 1 FROM site_settings WHERE id = 1');
  if (settingsExists.recordset.length === 0) {
    await pool.request()
      .input('colorConfig', sql.NVarChar, JSON.stringify(defaultColorConfig))
      .input('uiColors',    sql.NVarChar, JSON.stringify(defaultUiColors))
      .input('password',    sql.NVarChar, '') // Will be set by setup
      .query(`INSERT INTO site_settings (id, site_owner_password, color_config, ui_colors)
              VALUES (1, @password, @colorConfig, @uiColors)`);
  }
}
