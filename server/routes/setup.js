import express from 'express';
import { saveConfig } from '../config.js';
import { getPool, resetPool, sql } from '../db.js';
import { SCHEMA_STATEMENTS } from '../schema.js';
import { insertSeedData } from '../seed.js';
import { hashPassword } from '../../src/utils/auth.js';

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
  sidebarBg:     '#1e293b',
  sidebarAccent: '#6366f1',
  headerBg:      '#ffffff',
  headerBorder:  '#e2e8f0',
  contentBg:     '#f8fafc',
};

// POST /api/db/test — verify credentials without saving or creating anything
router.post('/test', async (req, res) => {
  const config = req.body;
  let testPool;
  try {
    testPool = await getPool({ ...config, database: 'master' });
    await testPool.request().query('SELECT 1 AS ok');
    res.json({ success: true, message: 'Connection successful' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  } finally {
    if (testPool) try { await testPool.close(); } catch { /* ignore */ }
  }
});

// POST /api/db/setup — create database + tables + default settings row, save config
router.post('/setup', async (req, res) => {
  const config = req.body;
  const safeName = config.database?.replace(/[^a-zA-Z0-9_\-]/g, '');
  if (!safeName) return res.status(400).json({ success: false, message: 'Invalid database name' });

  let masterPool;
  let appPool;
  try {
    // Step 1: connect to master and create database if needed
    masterPool = await getPool({ ...config, database: 'master' });
    await masterPool.request().query(
      `IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${safeName}')
       CREATE DATABASE [${safeName}]`
    );
    await masterPool.close();
    masterPool = null;

    // Step 2: connect to the application database
    appPool = await getPool({ ...config, database: safeName });

    // Step 3: create tables
    for (const stmt of SCHEMA_STATEMENTS) {
      await appPool.request().query(stmt);
    }

    // Step 4: ensure default site_settings row
    const existing = await appPool.request().query('SELECT 1 FROM site_settings WHERE id = 1');
    if (existing.recordset.length === 0) {
      await appPool.request()
        .input('password',    sql.NVarChar, hashPassword('admin'))
        .input('colorConfig', sql.NVarChar, JSON.stringify(defaultColorConfig))
        .input('uiColors',    sql.NVarChar, JSON.stringify(defaultUiColors))
        .query(`INSERT INTO site_settings (id, site_owner_password, must_change_password, color_config, ui_colors)
                VALUES (1, @password, 1, @colorConfig, @uiColors)`);
    }

    await appPool.close();
    appPool = null;

    // Step 5: save config and reset pool so next requests use the real DB
    const finalConfig = { ...config, database: safeName };
    await saveConfig(finalConfig);
    await resetPool();

    res.json({ success: true, message: 'Database created and configured successfully' });
  } catch (e) {
    if (masterPool) try { await masterPool.close(); } catch { /* ignore */ }
    if (appPool)    try { await appPool.close();    } catch { /* ignore */ }
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/db/seed — load demo data
router.post('/seed', async (req, res) => {
  try {
    const pool = await getPool();
    await insertSeedData(pool);
    res.json({ success: true, message: 'Demo data loaded successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
