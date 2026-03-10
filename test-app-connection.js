// Tests the exact same connection code the app uses — run with: node test-app-connection.js
import { getPool } from './server/db.js';

const config = {
  server: 'ABP188',
  port: '1433',
  user: 'sa',
  password: 'Letmein!!!',
  database: 'ProjectHub',
  encrypt: false,
  trustServerCertificate: true,
};

console.log('Testing connection using app db.js code...');
console.log('Config:', { ...config, password: '***' });

let pool;
try {
  pool = await getPool({ ...config, database: 'master' });
  await pool.request().query('SELECT 1 AS ok');
  console.log('\n✓ Connection successful — app code works fine.');
} catch (e) {
  console.error('\n✗ Connection failed:');
  console.error('  Message :', e.message);
  console.error('  Code    :', e.code);
  console.error('  Full    :', e);
} finally {
  if (pool) try { await pool.close(); } catch { /* ignore */ }
}
