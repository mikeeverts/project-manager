import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadConfig } from './config.js';

// Routes
import healthRouter     from './routes/health.js';
import setupRouter      from './routes/setup.js';
import stateRouter      from './routes/state.js';
import settingsRouter   from './routes/settings.js';
import companiesRouter  from './routes/companies.js';
import membersRouter    from './routes/members.js';
import departmentsRouter from './routes/departments.js';
import projectsRouter   from './routes/projects.js';
import tasksRouter      from './routes/tasks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// API routes
app.use('/api/health',      healthRouter);
app.use('/api/db',          setupRouter);
app.use('/api/state',       stateRouter);
app.use('/api/settings',    settingsRouter);
app.use('/api/companies',   companiesRouter);
app.use('/api/members',     membersRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/projects',    projectsRouter);
app.use('/api/tasks',       tasksRouter);

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

// Load saved DB config on startup (non-fatal if missing)
await loadConfig();

app.listen(PORT, () => {
  console.log(`ProjectHub server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
