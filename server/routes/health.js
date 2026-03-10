import express from 'express';
import { hasDbConfig } from '../config.js';
import { getPool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  if (!hasDbConfig()) {
    return res.json({ dbConfigured: false, dbConnected: false });
  }
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    res.json({ dbConfigured: true, dbConnected: true });
  } catch (e) {
    res.json({ dbConfigured: true, dbConnected: false, error: e.message });
  }
});

export default router;
