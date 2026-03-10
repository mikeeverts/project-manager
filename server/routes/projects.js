import express from 'express';
import { getPool, sql } from '../db.js';

const router = express.Router();

async function upsertProjectMembers(pool, projectId, members) {
  await pool.request()
    .input('projectId', sql.NVarChar, projectId)
    .query('DELETE FROM project_members WHERE project_id = @projectId');
  for (const m of (members || [])) {
    await pool.request()
      .input('projectId',   sql.NVarChar, projectId)
      .input('memberId',    sql.NVarChar, m.memberId)
      .input('projectRole', sql.NVarChar, m.projectRole)
      .query('INSERT INTO project_members (project_id, member_id, project_role) VALUES (@projectId, @memberId, @projectRole)');
  }
}

router.post('/', async (req, res) => {
  try {
    const p = req.body;
    const pool = await getPool();
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
    await upsertProjectMembers(pool, p.id, p.members);
    res.json({ success: true });
  } catch (e) {
    console.error('POST /api/projects:', e.message);
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const p = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id',          sql.NVarChar, req.params.id)
      .input('name',        sql.NVarChar, p.name)
      .input('description', sql.NVarChar, p.description || null)
      .input('color',       sql.NVarChar, p.color)
      .input('status',      sql.NVarChar, p.status || 'open')
      .query(`UPDATE projects SET name = @name, description = @description,
              color = @color, status = @status WHERE id = @id`);
    await upsertProjectMembers(pool, req.params.id, p.members);
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/projects/:id:', e.message);
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('DELETE FROM projects WHERE id = @id');
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/projects/:id:', e.message);
    res.status(500).json({ message: e.message });
  }
});

export default router;
