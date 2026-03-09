import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';
import { formatDate } from '../utils/dates';
import ProgressBar from '../components/UI/ProgressBar';

const PRESET_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

function ProjectForm({ project, onSave, onClose }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || '#6366f1');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required'); return; }
    onSave({ name: name.trim(), description: description.trim(), color });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="Enter project name"
          autoFocus
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe this project..."
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="flex items-center gap-2 ml-2">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-slate-300"
              title="Custom color"
            />
            <span className="text-xs text-slate-500">Custom</span>
          </div>
        </div>
      </div>
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
          {project ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}

export default function Projects() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [createModal, setCreateModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function handleCreate(data) {
    dispatch({
      type: 'ADD_PROJECT',
      payload: { ...data, id: uuidv4(), createdAt: new Date().toISOString() },
    });
    setCreateModal(false);
  }

  function handleEdit(data) {
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...editProject, ...data } });
    setEditProject(null);
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_PROJECT', payload: id });
    setDeleteConfirm(null);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-500 text-sm">{state.projects.length} project{state.projects.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.projects.map(project => {
          const projectTasks = state.tasks.filter(t => t.projectId === project.id);
          const doneTasks = projectTasks.filter(t => t.status === 'done').length;
          const avg = projectTasks.length > 0
            ? Math.round(projectTasks.reduce((sum, t) => sum + t.completionPercentage, 0) / projectTasks.length)
            : 0;

          return (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Color bar */}
              <div className="h-2 rounded-t-xl" style={{ backgroundColor: project.color }} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: project.color + '20' }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
                      </div>
                    </div>
                    <div>
                      <h3
                        className="font-semibold text-slate-800 hover:text-indigo-600 cursor-pointer"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-400">{formatDate(project.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditProject(project)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(project)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{project.description}</p>
                )}

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Overall progress</span>
                    <span>{avg}%</span>
                  </div>
                  <ProgressBar percentage={avg} height={6} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>{projectTasks.length} tasks</span>
                    <span>{doneTasks} done</span>
                  </div>
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View tasks →
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {state.projects.length === 0 && (
          <div className="col-span-3 text-center py-16">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-slate-400 mb-3">No projects yet</p>
            <button
              onClick={() => setCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Create your first project
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="New Project">
        <ProjectForm onSave={handleCreate} onClose={() => setCreateModal(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
        {editProject && (
          <ProjectForm project={editProject} onSave={handleEdit} onClose={() => setEditProject(null)} />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Project" size="sm">
        {deleteConfirm && (
          <div>
            <p className="text-slate-600 mb-2">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
            </p>
            <p className="text-slate-500 text-sm mb-6">
              This will also delete all {state.tasks.filter(t => t.projectId === deleteConfirm.id).length} tasks in this project.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete Project
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
