import express from 'express';
import { getPool, sql } from '../db.js';

const router = express.Router();

// PUT /api/settings — partial update of site_settings
router.put('/', async (req, res) => {
  try {
    const pool = await getPool();
    const body = req.body;
    const sets = [];
    const req2 = pool.request();

    if (body.companyName !== undefined) {
      sets.push('company_name = @companyName');
      req2.input('companyName', sql.NVarChar, body.companyName);
    }
    if (body.companyLogo !== undefined) {
      sets.push('company_logo = @companyLogo');
      req2.input('companyLogo', sql.NVarChar, body.companyLogo);
    }
    if (body.themeMode !== undefined) {
      sets.push('theme_mode = @themeMode');
      req2.input('themeMode', sql.NVarChar, body.themeMode);
    }
    if (body.colorConfig !== undefined) {
      sets.push('color_config = @colorConfig');
      req2.input('colorConfig', sql.NVarChar, JSON.stringify(body.colorConfig));
    }
    if (body.uiColors !== undefined) {
      sets.push('ui_colors = @uiColors');
      req2.input('uiColors', sql.NVarChar, JSON.stringify(body.uiColors));
    }
    if (body.sidebarCollapsed !== undefined) {
      sets.push('sidebar_collapsed = @sidebarCollapsed');
      req2.input('sidebarCollapsed', sql.Bit, body.sidebarCollapsed ? 1 : 0);
    }
    if (body.filterProject !== undefined) {
      sets.push('filter_project = @filterProject');
      req2.input('filterProject', sql.NVarChar, body.filterProject);
    }

    if (sets.length > 0) {
      await req2.query(`UPDATE site_settings SET ${sets.join(', ')} WHERE id = 1`);
    }
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/settings:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/settings/site-owner — update admin password
router.put('/site-owner', async (req, res) => {
  try {
    const { password, mustChangePassword } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('password',           sql.NVarChar, password)
      .input('mustChangePassword', sql.Bit,      mustChangePassword ? 1 : 0)
      .query(`UPDATE site_settings
              SET site_owner_password = @password,
                  must_change_password = @mustChangePassword
              WHERE id = 1`);
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/settings/site-owner:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
