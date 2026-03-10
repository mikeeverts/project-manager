import express from 'express';
import { getPool, sql } from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id',        sql.NVarChar,      d.id)
      .input('companyId', sql.NVarChar,      d.companyId)
      .input('name',      sql.NVarChar,      d.name)
      .input('color',     sql.NVarChar,      d.color)
      .input('createdAt', sql.DateTimeOffset, new Date(d.createdAt))
      .query('INSERT INTO departments (id, company_id, name, color, created_at) VALUES (@id, @companyId, @name, @color, @createdAt)');
    res.json({ success: true });
  } catch (e) {
    console.error('POST /api/departments:', e.message);
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id',    sql.NVarChar, req.params.id)
      .input('name',  sql.NVarChar, name)
      .input('color', sql.NVarChar, color)
      .query('UPDATE departments SET name = @name, color = @color WHERE id = @id');
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/departments/:id:', e.message);
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    // Unassign members from this department
    await pool.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('UPDATE team_members SET department_id = NULL WHERE department_id = @id');
    await pool.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('UPDATE tasks SET department_id = NULL WHERE department_id = @id');
    await pool.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('DELETE FROM departments WHERE id = @id');
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/departments/:id:', e.message);
    res.status(500).json({ message: e.message });
  }
});

export default router;
