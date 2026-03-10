import express from 'express';
import { getPool, sql } from '../db.js';

const router = express.Router();

async function upsertDependencies(pool, taskId, dependencies) {
  await pool.request()
    .input('taskId', sql.NVarChar, taskId)
    .query('DELETE FROM task_dependencies WHERE task_id = @taskId');
  for (const depId of (dependencies || [])) {
    await pool.request()
      .input('taskId',      sql.NVarChar, taskId)
      .input('dependsOnId', sql.NVarChar, depId)
      .query('INSERT INTO task_dependencies (task_id, depends_on_id) VALUES (@taskId, @dependsOnId)');
  }
}

function taskInputs(req, t) {
  return req
    .input('title',                sql.NVarChar,      t.title)
    .input('description',          sql.NVarChar,      t.description || null)
    .input('assigneeId',           sql.NVarChar,      t.assigneeId   || null)
    .input('departmentId',         sql.NVarChar,      t.departmentId || null)
    .input('assignToAll',          sql.Bit,           t.assignToAll ? 1 : 0)
    .input('startDate',            sql.DateTimeOffset, t.startDate ? new Date(t.startDate) : null)
    .input('dueDate',              sql.DateTimeOffset, t.dueDate   ? new Date(t.dueDate)   : null)
    .input('completionPercentage', sql.Int,           t.completionPercentage ?? 0)
    .input('status',               sql.NVarChar,      t.status)
    .input('priority',             sql.NVarChar,      t.priority);
}

router.post('/', async (req, res) => {
  try {
    const t = req.body;
    const pool = await getPool();
    await taskInputs(pool.request(), t)
      .input('id',        sql.NVarChar,      t.id)
      .input('projectId', sql.NVarChar,      t.projectId)
      .input('createdAt', sql.DateTimeOffset, new Date(t.createdAt))
      .query(`INSERT INTO tasks
        (id, project_id, title, description, assignee_id, department_id, assign_to_all,
         start_date, due_date, completion_percentage, status, priority, created_at)
        VALUES
        (@id, @projectId, @title, @description, @assigneeId, @departmentId, @assignToAll,
         @startDate, @dueDate, @completionPercentage, @status, @priority, @createdAt)`);
    await upsertDependencies(pool, t.id, t.dependencies);
    res.json({ success: true });
  } catch (e) {
    console.error('POST /api/tasks:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const t = req.body;
    const pool = await getPool();
    await taskInputs(pool.request(), t)
      .input('id', sql.NVarChar, req.params.id)
      .query(`UPDATE tasks SET
        title = @title, description = @description, assignee_id = @assigneeId,
        department_id = @departmentId, assign_to_all = @assignToAll,
        start_date = @startDate, due_date = @dueDate,
        completion_percentage = @completionPercentage,
        status = @status, priority = @priority
        WHERE id = @id`);
    await upsertDependencies(pool, req.params.id, t.dependencies);
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/tasks/:id:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Quick status update (drag-and-drop)
router.patch('/:id/status', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id',     sql.NVarChar, req.params.id)
      .input('status', sql.NVarChar, req.body.status)
      .query('UPDATE tasks SET status = @status WHERE id = @id');
    res.json({ success: true });
  } catch (e) {
    console.error('PATCH /api/tasks/:id/status:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('DELETE FROM tasks WHERE id = @id');
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/tasks/:id:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
