import sql from 'mssql';
import { getDbConfig } from './config.js';

let pool = null;

function buildPoolConfig(config) {
  return {
    user: config.user,
    password: config.password,
    server: config.server,
    port: Number(config.port) || 1433,
    database: config.database,
    options: {
      encrypt: config.encrypt ?? true,
      trustServerCertificate: config.trustServerCertificate ?? false,
      enableArithAbort: true,
      connectTimeout: 30000,
      requestTimeout: 30000,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

export async function getPool(overrideConfig) {
  const config = overrideConfig || getDbConfig();
  if (!config) throw new Error('Database not configured');

  // If using the stored config and pool is healthy, reuse it
  if (!overrideConfig && pool && pool.connected) return pool;

  const newPool = new sql.ConnectionPool(buildPoolConfig(config));
  await newPool.connect();

  if (!overrideConfig) pool = newPool;
  return newPool;
}

export async function resetPool() {
  if (pool) {
    try { await pool.close(); } catch { /* ignore */ }
    pool = null;
  }
}

export { sql };
