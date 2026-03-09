import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getCompletionColor } from '../utils/colors';
import { parseDate, getDateRange, addDaysToDate, formatShortDate, getDaysDiff } from '../utils/dates';
import { differenceInDays, addDays, format, eachDayOfInterval, isWeekend } from 'date-fns';
import Avatar from '../components/UI/Avatar';
import TaskForm from '../components/Tasks/TaskForm';

const ROW_HEIGHT = 48;
const LABEL_WIDTH = 220;
const DAY_WIDTH = 28;
const HEADER_HEIGHT = 56;

function getTaskPosition(task, minDate) {
  const start = parseDate(task.startDate);
  const end = parseDate(task.dueDate);
  if (!start || !end) return null;
  const left = differenceInDays(start, minDate) * DAY_WIDTH;
  const width = Math.max(DAY_WIDTH, differenceInDays(end, start) * DAY_WIDTH + DAY_WIDTH);
  return { left, width };
}

export default function Gantt() {
  const { state, dispatch } = useApp();
  const [editTask, setEditTask] = useState(null);
  const containerRef = useRef(null);
  const dragging = useRef(null);

  const tasks = state.tasks.filter(t => t.startDate && t.dueDate);

  const { min: minDate, max: maxDate } = useMemo(() => getDateRange(tasks), [tasks]);
  const totalDays = differenceInDays(maxDate, minDate) + 1;

  const days = useMemo(() =>
    eachDayOfInterval({ start: minDate, end: maxDate }),
    [minDate, maxDate]
  );

  // Group days by month for header
  const months = useMemo(() => {
    const groups = [];
    let current = null;
    days.forEach((day, i) => {
      const monthLabel = format(day, 'MMMM yyyy');
      if (!current || current.label !== monthLabel) {
        current = { label: monthLabel, start: i, count: 1 };
        groups.push(current);
      } else {
        current.count++;
      }
    });
    return groups;
  }, [days]);

  // Build task row index map
  const taskRows = useMemo(() => {
    const map = {};
    tasks.forEach((t, i) => { map[t.id] = i; });
    return map;
  }, [tasks]);

  function handleMouseDown(e, task) {
    e.preventDefault();
    const startX = e.clientX;
    const origStart = task.startDate;
    const origEnd = task.dueDate;

    dragging.current = { taskId: task.id, startX, origStart, origEnd };

    function onMouseMove(e) {
      if (!dragging.current) return;
      const dx = e.clientX - dragging.current.startX;
      const daysDelta = Math.round(dx / DAY_WIDTH);
      if (daysDelta === 0) return;

      const newStart = addDaysToDate(dragging.current.origStart, daysDelta);
      const newEnd = addDaysToDate(dragging.current.origEnd, daysDelta);

      dispatch({
        type: 'UPDATE_TASK',
        payload: { ...task, startDate: newStart, dueDate: newEnd },
      });
    }

    function onMouseUp() {
      dragging.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // Draw dependency arrows
  function renderArrows() {
    const arrows = [];
    tasks.forEach(task => {
      if (!task.dependencies?.length) return;
      task.dependencies.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        if (!depTask) return;

        const fromPos = getTaskPosition(depTask, minDate);
        const toPos = getTaskPosition(task, minDate);
        if (!fromPos || !toPos) return;

        const fromRow = taskRows[depId];
        const toRow = taskRows[task.id];
        if (fromRow === undefined || toRow === undefined) return;

        const x1 = fromPos.left + fromPos.width;
        const y1 = fromRow * ROW_HEIGHT + ROW_HEIGHT / 2 + HEADER_HEIGHT;
        const x2 = toPos.left;
        const y2 = toRow * ROW_HEIGHT + ROW_HEIGHT / 2 + HEADER_HEIGHT;

        const midX = (x1 + x2) / 2;

        const pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

        arrows.push(
          <g key={`${depId}-${task.id}`}>
            <path
              d={pathD}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4,2"
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      });
    });
    return arrows;
  }

  const totalWidth = totalDays * DAY_WIDTH;
  const totalHeight = tasks.length * ROW_HEIGHT;

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-4">
          <p className="text-sm text-slate-500">{tasks.length} tasks shown</p>
          <div className="flex gap-2 text-xs text-slate-500 flex-wrap">
            {state.colorConfig.ranges.map(r => (
              <div key={r.label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: r.color }} />
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left label panel */}
          <div
            className="flex-shrink-0 border-r border-slate-200 bg-white z-10 overflow-y-auto"
            style={{ width: LABEL_WIDTH }}
          >
            {/* Header spacer */}
            <div
              className="border-b border-slate-200 bg-slate-50 px-3 flex items-end pb-2"
              style={{ height: HEADER_HEIGHT }}
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Task</span>
            </div>
            {/* Task labels */}
            {tasks.map((task, i) => {
              const project = state.projects.find(p => p.id === task.projectId);
              const assignee = state.teamMembers.find(m => m.id === task.assigneeId);
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 px-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => setEditTask(task)}
                >
                  {project && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{task.title}</p>
                    {project && (
                      <p className="text-xs text-slate-400 truncate">{project.name}</p>
                    )}
                  </div>
                  {assignee && <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" />}
                </div>
              );
            })}
          </div>

          {/* Scrollable chart area */}
          <div className="flex-1 overflow-auto" ref={containerRef}>
            <div style={{ width: totalWidth, position: 'relative' }}>
              {/* Month header row */}
              <div className="flex border-b border-slate-200 bg-slate-50" style={{ height: 28 }}>
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="border-r border-slate-200 px-2 flex items-center"
                    style={{ width: m.count * DAY_WIDTH, flexShrink: 0 }}
                  >
                    <span className="text-xs font-semibold text-slate-600 truncate">{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Day header row */}
              <div className="flex border-b border-slate-200" style={{ height: 28 }}>
                {days.map((day, i) => {
                  const weekend = isWeekend(day);
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 border-r flex items-center justify-center ${
                        weekend ? 'bg-slate-50' : 'bg-white'
                      } ${isToday ? 'bg-indigo-50' : ''} border-slate-100`}
                      style={{ width: DAY_WIDTH }}
                    >
                      <span className={`text-xs ${isToday ? 'text-indigo-600 font-bold' : weekend ? 'text-slate-400' : 'text-slate-500'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Today line */}
              {(() => {
                const todayOffset = differenceInDays(new Date(), minDate);
                if (todayOffset >= 0 && todayOffset <= totalDays) {
                  return (
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none z-20"
                      style={{
                        left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2,
                        width: 2,
                        backgroundColor: '#6366f1',
                        opacity: 0.6,
                        top: 0,
                      }}
                    />
                  );
                }
                return null;
              })()}

              {/* Grid rows + bars */}
              <div style={{ position: 'relative', height: totalHeight }}>
                {/* Grid lines */}
                {tasks.map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-full border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                    style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                  />
                ))}

                {/* Weekend shading */}
                {days.map((day, i) => {
                  if (!isWeekend(day)) return null;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0"
                      style={{
                        left: i * DAY_WIDTH,
                        width: DAY_WIDTH,
                        backgroundColor: 'rgba(148,163,184,0.07)',
                      }}
                    />
                  );
                })}

                {/* SVG for arrows */}
                <svg
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{ width: totalWidth, height: totalHeight, overflow: 'visible' }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="6"
                      markerHeight="6"
                      refX="3"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M 0 0 L 6 3 L 0 6 z" fill="#94a3b8" />
                    </marker>
                  </defs>
                  {renderArrows()}
                </svg>

                {/* Task bars */}
                {tasks.map((task, i) => {
                  const pos = getTaskPosition(task, minDate);
                  if (!pos) return null;
                  const color = getCompletionColor(task.completionPercentage, state.colorConfig);
                  const assignee = state.teamMembers.find(m => m.id === task.assigneeId);
                  const top = i * ROW_HEIGHT + 10;
                  const barHeight = ROW_HEIGHT - 20;

                  return (
                    <div
                      key={task.id}
                      className="gantt-bar absolute rounded overflow-hidden shadow-sm group"
                      style={{
                        left: pos.left,
                        width: pos.width,
                        top,
                        height: barHeight,
                        backgroundColor: color + '30',
                        border: `2px solid ${color}`,
                      }}
                      onMouseDown={e => handleMouseDown(e, task)}
                      onClick={() => setEditTask(task)}
                      title={`${task.title} — ${task.completionPercentage}%`}
                    >
                      {/* Progress fill */}
                      <div
                        className="absolute top-0 left-0 bottom-0 opacity-70 rounded-sm"
                        style={{
                          width: `${task.completionPercentage}%`,
                          backgroundColor: color,
                          transition: 'width 0.3s',
                        }}
                      />

                      {/* Stripe overlay for progress */}
                      <div
                        className="absolute top-0 left-0 bottom-0 opacity-20"
                        style={{
                          width: `${task.completionPercentage}%`,
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px)',
                        }}
                      />

                      {/* Label */}
                      <div className="absolute inset-0 flex items-center px-2 gap-1 z-10">
                        <span className="text-xs font-medium text-slate-800 truncate flex-1" style={{ textShadow: '0 0 4px rgba(255,255,255,0.8)' }}>
                          {task.title}
                        </span>
                        {pos.width > 80 && (
                          <span className="text-xs font-bold flex-shrink-0" style={{ color }}>
                            {task.completionPercentage}%
                          </span>
                        )}
                        {assignee && pos.width > 120 && (
                          <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskForm
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        task={editTask}
      />
    </div>
  );
}
