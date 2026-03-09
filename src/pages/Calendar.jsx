import React, { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useApp } from '../context/AppContext';
import { getCompletionColor } from '../utils/colors';
import { parseDate } from '../utils/dates';
import TaskForm from '../components/Tasks/TaskForm';
import Avatar from '../components/UI/Avatar';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function Calendar() {
  const { state, filterProject } = useApp();
  const [editTask, setEditTask] = useState(null);
  const [taskModal, setTaskModal] = useState(false);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [filterMember, setFilterMember] = useState('all');

  const events = state.tasks
    .filter(t => t.startDate && t.dueDate)
    .filter(t => filterProject === 'all' || t.projectId === filterProject)
    .filter(t => filterMember === 'all' || t.assigneeId === filterMember)
    .map(t => {
      const color = getCompletionColor(t.completionPercentage, state.colorConfig);
      const project = state.projects.find(p => p.id === t.projectId);
      const assignee = state.teamMembers.find(m => m.id === t.assigneeId);
      return {
        id: t.id,
        title: t.title,
        start: parseDate(t.startDate),
        end: parseDate(t.dueDate),
        resource: { task: t, color, project, assignee },
      };
    })
    .filter(e => e.start && e.end);

  function eventStyleGetter(event) {
    const { color } = event.resource;
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: '#fff',
        borderRadius: '4px',
        border: 'none',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  }

  function handleSelectEvent(event) {
    const task = state.tasks.find(t => t.id === event.id);
    if (task) setEditTask(task);
  }

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden" style={{ minHeight: '600px' }}>
        <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setTaskModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {['month', 'week', 'day', 'agenda'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium capitalize transition-colors ${
                    view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-sm text-slate-500 flex-wrap">
              {state.colorConfig.ranges.map(r => (
                <div key={r.label} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-500 font-medium w-16">Member:</span>
            <button
              onClick={() => setFilterMember('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                filterMember === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {state.teamMembers.map(m => (
              <button
                key={m.id}
                onClick={() => setFilterMember(filterMember === m.id ? 'all' : m.id)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filterMember === m.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Avatar name={m.name} color={m.avatarColor} size="xs" />
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 h-full">
          <BigCalendar
            localizer={localizer}
            events={events}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            style={{ height: '100%', minHeight: 550 }}
            popup
            showMultiDayTimes
            tooltipAccessor={e => `${e.title} — ${e.resource.task.completionPercentage}%`}
          />
        </div>
      </div>

      <TaskForm
        isOpen={taskModal}
        onClose={() => setTaskModal(false)}
      />
      <TaskForm
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        task={editTask}
      />
    </div>
  );
}
