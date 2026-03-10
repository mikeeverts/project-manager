import express from 'express';
import { getPool, sql } from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { id, name, createdAt } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id',        sql.NVarChar,      id)
      .input('name',      sql.NVarChar,      name)
      .input('createdAt', sql.DateTimeOffset, new Date(createdAt))
      .query('INSERT INTO companies (id, name, created_at) VALUES (@id, @name, @createdAt)');
    res.json({ success: true });
  } catch (e) {
    console.error('POST /api/companies:', e.message);
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id',   sql.NVarChar, req.params.id)
      .input('name', sql.NVarChar, name)
      .query('UPDATE companies SET name = @name WHERE id = @id');
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/companies/:id:', e.message);
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('DELETE FROM companies WHERE id = @id');
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/companies/:id:', e.message);
    res.status(500).json({ message: e.message });
  }
});

export default router;
