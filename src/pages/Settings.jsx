import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCompletionColor } from '../utils/colors';
import ProgressBar from '../components/UI/ProgressBar';

export default function Settings() {
  const { state, dispatch } = useApp();
  const [localConfig, setLocalConfig] = useState(() => ({
    ranges: state.colorConfig.ranges.map(r => ({ ...r })),
  }));
  const [saved, setSaved] = useState(false);
  const [companyName, setCompanyName] = useState(state.companyName || 'ProjectHub');
  const [companySaved, setCompanySaved] = useState(false);

  function handleSaveCompany() {
    dispatch({ type: 'UPDATE_COMPANY_NAME', payload: companyName.trim() || 'ProjectHub' });
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2000);
  }

  function updateRange(index, field, value) {
    setLocalConfig(prev => ({
      ranges: prev.ranges.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }));
    setSaved(false);
  }

  function handleSave() {
    dispatch({ type: 'UPDATE_COLOR_CONFIG', payload: localConfig });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    const defaults = {
      ranges: [
        { min: 0, max: 33, color: '#ef4444', label: 'Not Started' },
        { min: 34, max: 66, color: '#f59e0b', label: 'In Progress' },
        { min: 67, max: 99, color: '#3b82f6', label: 'Nearly Done' },
        { min: 100, max: 100, color: '#22c55e', label: 'Complete' },
      ],
    };
    setLocalConfig(defaults);
    dispatch({ type: 'UPDATE_COLOR_CONFIG', payload: defaults });
    setSaved(false);
  }

  const previewPercentages = [0, 15, 33, 50, 66, 80, 99, 100];

  return (
    <div className="p-6 max-w-3xl">
      {/* Company Name */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Company Name</h2>
        <p className="text-sm text-slate-500 mb-4">Shown in the sidebar and browser tab title.</p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={companyName}
            onChange={e => { setCompanyName(e.target.value); setCompanySaved(false); }}
            placeholder="Your company name"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-72"
          />
          <button
            onClick={handleSaveCompany}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save
          </button>
          {companySaved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Completion Color Ranges</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure how task completion percentages map to colors across the app.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Reset to defaults
          </button>
        </div>

        <div className="space-y-4">
          {localConfig.ranges.map((range, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Color picker */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-xl border-2 border-slate-200 overflow-hidden cursor-pointer relative"
                    style={{ backgroundColor: range.color }}
                  >
                    <input
                      type="color"
                      value={range.color}
                      onChange={e => updateRange(i, 'color', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Pick color"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{range.color}</span>
                </div>

                {/* Label */}
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={range.label}
                    onChange={e => updateRange(i, 'label', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Range display */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Range</label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-mono bg-slate-100 px-2 py-1.5 rounded text-slate-700">
                      {range.min}%
                    </div>
                    <span className="text-slate-400">—</span>
                    <div className="text-sm font-mono bg-slate-100 px-2 py-1.5 rounded text-slate-700">
                      {range.max}%
                    </div>
                  </div>
                </div>

                {/* Preview badge */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Preview</label>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: range.color }}
                  >
                    {range.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save Changes
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </div>
          )}
        </div>
      </div>

      {/* Preview section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Preview</h2>
        <p className="text-sm text-slate-500 mb-5">
          How tasks would look at various completion percentages with the current color configuration.
        </p>

        <div className="space-y-3">
          {previewPercentages.map(pct => {
            const color = getCompletionColor(pct, localConfig);
            const range = localConfig.ranges.find(r => pct >= r.min && pct <= r.max);
            return (
              <div key={pct} className="flex items-center gap-4">
                <div className="w-12 text-right text-sm font-mono text-slate-600">{pct}%</div>
                <div className="flex-1">
                  <div className="h-5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded text-white w-28 text-center"
                  style={{ backgroundColor: color }}
                >
                  {range?.label || ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* App info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">App Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Total Projects</p>
            <p className="font-semibold text-slate-800 mt-0.5">{state.projects.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Total Tasks</p>
            <p className="font-semibold text-slate-800 mt-0.5">{state.tasks.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Team Members</p>
            <p className="font-semibold text-slate-800 mt-0.5">{state.teamMembers.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Storage</p>
            <p className="font-semibold text-slate-800 mt-0.5">LocalStorage</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              if (confirm('This will clear ALL data and reload with seed data. Are you sure?')) {
                localStorage.removeItem('project_manager_state');
                window.location.reload();
              }
            }}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Reset all data to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
