import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../../context/AppContext';
import Modal from '../UI/Modal';
import { toInputDateString, fromInputDateString } from '../../utils/dates';

const STATUSES = [
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function emptyForm(projectId = '', status = 'todo') {
  const today = new Date().toISOString();
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
  return {
    projectId,
    title: '',
    description: '',
    assigneeId: '',
    departmentId: '',
    assignToAll: false,
    startDate: today,
    dueDate: nextWeek,
    completionPercentage: 0,
    status,
    dependencies: [],
    priority: 'medium',
  };
}

export default function TaskForm({ isOpen, onClose, task = null, defaultProjectId = '', defaultStatus = 'todo' }) {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState(emptyForm(defaultProjectId, defaultStatus));
  const [errors, setErrors] = useState({});
  const [assignType, setAssignType] = useState('user');

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setForm({
          projectId: task.projectId || '',
          title: task.title || '',
          description: task.description || '',
          assigneeId: task.assigneeId || '',
          departmentId: task.departmentId || '',
          assignToAll: task.assignToAll || false,
          startDate: task.startDate || new Date().toISOString(),
          dueDate: task.dueDate || new Date().toISOString(),
          completionPercentage: task.completionPercentage ?? 0,
          status: task.status || 'todo',
          dependencies: task.dependencies || [],
          priority: task.priority || 'medium',
        });
        setAssignType(task.assignToAll ? 'all' : task.departmentId ? 'department' : 'user');
      } else {
        setForm(emptyForm(defaultProjectId, defaultStatus));
        setAssignType('user');
      }
      setErrors({});
    }
  }, [isOpen, task, defaultProjectId, defaultStatus]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.projectId) errs.projectId = 'Project is required';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.dueDate) errs.dueDate = 'Due date is required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload = {
      ...form,
      completionPercentage: Number(form.completionPercentage),
    };

    if (task) {
      dispatch({ type: 'UPDATE_TASK', payload: { ...task, ...payload } });
    } else {
      dispatch({
        type: 'ADD_TASK',
        payload: { ...payload, id: uuidv4(), createdAt: new Date().toISOString() },
      });
    }
    onClose();
  }

  function toggleDependency(taskId) {
    set('dependencies', form.dependencies.includes(taskId)
      ? form.dependencies.filter(id => id !== taskId)
      : [...form.dependencies, taskId]);
  }

  // Available tasks for dependencies (exclude current task and tasks in circular deps)
  const availableDependencies = state.tasks.filter(t =>
    t.id !== task?.id && t.projectId === form.projectId
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'Create Task'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Enter task title"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe this task..."
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            value={form.projectId}
            onChange={e => set('projectId', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select project</option>
            {state.projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.projectId && <p className="text-red-500 text-xs mt-1">{errors.projectId}</p>}
        </div>

        {/* Assign to */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-2 w-fit">
            <button
              type="button"
              onClick={() => { setAssignType('user'); set('departmentId', ''); set('assignToAll', false); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                assignType === 'user' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => { setAssignType('department'); set('assigneeId', ''); set('assignToAll', false); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                assignType === 'department' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Department
            </button>
            <button
              type="button"
              onClick={() => { setAssignType('all'); set('assigneeId', ''); set('departmentId', ''); set('assignToAll', true); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                assignType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All Members
            </button>
          </div>

          {assignType === 'user' && (
            <select
              value={form.assigneeId}
              onChange={e => set('assigneeId', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Unassigned</option>
              {state.teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}

          {assignType === 'department' && (
            <select
              value={form.departmentId}
              onChange={e => set('departmentId', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select department</option>
              {state.departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          {assignType === 'all' && (() => {
            const project = state.projects.find(p => p.id === form.projectId);
            const projectMemberIds = (project?.members ?? []).map(m => m.memberId);
            const members = projectMemberIds.length > 0
              ? state.teamMembers.filter(m => projectMemberIds.includes(m.id))
              : state.teamMembers;
            return (
              <div className="border border-indigo-200 bg-indigo-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-indigo-700">
                    Assigned to all project members ({members.length})
                  </span>
                </div>
                {members.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {members.map(m => (
                      <span key={m.id} className="flex items-center gap-1 bg-white border border-indigo-200 rounded-full px-2 py-0.5 text-xs text-slate-700">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: m.avatarColor }}
                        />
                        {m.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-indigo-500">
                    {form.projectId ? 'No members assigned to this project yet — assign them in Settings → Project Members.' : 'Select a project first.'}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={toInputDateString(form.startDate)}
              onChange={e => set('startDate', fromInputDateString(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={toInputDateString(form.dueDate)}
              onChange={e => set('dueDate', fromInputDateString(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
          </div>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={e => set('priority', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Completion */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Completion: {form.completionPercentage}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={form.completionPercentage}
            onChange={e => set('completionPercentage', Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>

        {/* Dependencies */}
        {availableDependencies.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dependencies (tasks that must complete before this one)
            </label>
            <div className="border border-slate-300 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
              {availableDependencies.map(t => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={form.dependencies.includes(t.id)}
                    onChange={() => toggleDependency(t.id)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700">{t.title}</span>
                  <span className="text-xs text-slate-400 ml-auto">{t.completionPercentage}%</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
