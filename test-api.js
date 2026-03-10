// Tests the HTTP API endpoint directly — run with: node test-api.js
// Make sure the server is running first (npm run dev)

const body = {
  server: 'ABP188',
  port: '1433',
  user: 'sa',
  password: 'Letmein!!!',
  database: 'ProjectHub',
  encrypt: false,
  trustServerCertificate: true,
};

console.log('POSTing to http://localhost:3001/api/db/test ...');

try {
  const res = await fetch('http://localhost:3001/api/db/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  console.log('HTTP status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Response body:', text);
} catch (e) {
  console.error('Fetch error:', e.message);
}
