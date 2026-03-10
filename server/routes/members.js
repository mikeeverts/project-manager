import express from 'express';
import { getPool, sql } from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const m = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id',           sql.NVarChar,      m.id)
      .input('companyId',    sql.NVarChar,      m.companyId)
      .input('name',         sql.NVarChar,      m.name)
      .input('email',        sql.NVarChar,      m.email)
      .input('avatarColor',  sql.NVarChar,      m.avatarColor)
      .input('role',         sql.NVarChar,      m.role)
      .input('password',     sql.NVarChar,      m.password)
      .input('departmentId', sql.NVarChar,      m.departmentId || null)
      .input('isDisabled',         sql.Bit,           m.isDisabled ? 1 : 0)
      .input('mustChangePassword', sql.Bit,           m.mustChangePassword ? 1 : 0)
      .input('createdAt',          sql.DateTimeOffset, new Date(m.createdAt))
      .query(`INSERT INTO team_members
        (id, company_id, name, email, avatar_color, role, password, department_id, is_disabled, must_change_password, created_at)
        VALUES (@id, @companyId, @name, @email, @avatarColor, @role, @password, @departmentId, @isDisabled, @mustChangePassword, @createdAt)`);
    res.json({ success: true });
  } catch (e) {
    console.error('POST /api/members:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const m = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id',           sql.NVarChar, req.params.id)
      .input('name',         sql.NVarChar, m.name)
      .input('email',        sql.NVarChar, m.email)
      .input('avatarColor',  sql.NVarChar, m.avatarColor)
      .input('role',         sql.NVarChar, m.role)
      .input('password',     sql.NVarChar, m.password)
      .input('departmentId', sql.NVarChar, m.departmentId || null)
      .input('isDisabled',         sql.Bit, m.isDisabled ? 1 : 0)
      .input('mustChangePassword', sql.Bit, m.mustChangePassword ? 1 : 0)
      .query(`UPDATE team_members SET
        name = @name, email = @email, avatar_color = @avatarColor, role = @role,
        password = @password, department_id = @departmentId, is_disabled = @isDisabled,
        must_change_password = @mustChangePassword
        WHERE id = @id`);
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/members/:id:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    // Unassign tasks first (no cascade on assignee_id)
    await pool.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('UPDATE tasks SET assignee_id = NULL WHERE assignee_id = @id');
    await pool.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('DELETE FROM team_members WHERE id = @id');
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/members/:id:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
