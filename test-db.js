// Quick SQL Server connectivity test — run with: node test-db.js
import sql from 'mssql';

const config = {
  server: 'ABP188',
  port: 1433,
  user: 'sa',
  password: 'Letmein!!!',
  database: 'master',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 15000,
  },
};

console.log(`Connecting to ${config.server}:${config.port} as ${config.user}...`);

try {
  const pool = await sql.connect(config);
  const result = await pool.request().query('SELECT @@VERSION AS version, @@SERVERNAME AS name');
  const row = result.recordset[0];
  console.log('\n✓ Connected successfully!');
  console.log(`  Server name : ${row.name}`);
  console.log(`  SQL version : ${row.version.split('\n')[0]}`);
  await pool.close();
} catch (e) {
  console.error('\n✗ Connection failed:');
  console.error(' ', e.message);
}
