import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useApp } from '../context/AppContext';
import { getCompletionColor } from '../utils/colors';
import { isOverdue, formatDate } from '../utils/dates';
import Avatar from '../components/UI/Avatar';
import ProgressBar from '../components/UI/ProgressBar';
import PriorityBadge from '../components/UI/PriorityBadge';
import TaskForm from '../components/Tasks/TaskForm';

const COLUMNS = [
  { id: 'todo', label: 'Todo', color: '#94a3b8', bg: '#f8fafc' },
  { id: 'in-progress', label: 'In Progress', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'review', label: 'Review', color: '#6366f1', bg: '#eef2ff' },
  { id: 'done', label: 'Done', color: '#22c55e', bg: '#f0fdf4' },
];

function KanbanCard({ task, onClick, isDragging = false }) {
  const { state } = useApp();
  const project = state.projects.find(p => p.id === task.projectId);
  const assignee = state.teamMembers.find(m => m.id === task.assigneeId);
  const department = state.departments?.find(d => d.id === task.departmentId);
  const overdue = isOverdue(task.dueDate) && task.status !== 'done';

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm cursor-grab select-none transition-shadow ${
        isDragging ? 'opacity-50' : 'hover:shadow-md'
      } ${overdue ? 'border-red-300' : 'border-slate-200'}`}
      onClick={onClick}
    >
      {project && (
        <div className="h-1 rounded-t-lg" style={{ backgroundColor: project.color }} />
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-2">
          <p className="text-sm font-medium text-slate-800 line-clamp-2 flex-1">{task.title}</p>
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: getCompletionColor(task.completionPercentage, state.colorConfig) }}
          />
        </div>

        <ProgressBar percentage={task.completionPercentage} height={4} />

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{task.completionPercentage}%</span>
            {assignee && <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" />}
            {!assignee && department && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: department.color + '20', color: department.color }}>
                {department.name}
              </span>
            )}
          </div>
        </div>

        {overdue && (
          <p className="text-xs text-red-500 mt-1.5 font-medium">
            Overdue: {formatDate(task.dueDate)}
          </p>
        )}

        {project && (
          <p className="text-xs text-slate-400 mt-1 truncate">{project.name}</p>
        )}
      </div>
    </div>
  );
}

function SortableCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard task={task} onClick={onClick} />
    </div>
  );
}

function Column({ column, tasks, onCardClick, onAddTask }) {
  return (
    <div
      className="flex flex-col rounded-xl border border-slate-200 overflow-hidden"
      style={{ backgroundColor: column.bg, minWidth: '260px', flex: '1' }}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="font-semibold text-sm text-slate-700">{column.label}</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
          title="Add task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ minHeight: '100px' }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export default function Board() {
  const { state, dispatch, filterProject } = useApp();
  const [editTask, setEditTask] = useState(null);
  const [taskModal, setTaskModal] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [filterMember, setFilterMember] = useState('all');
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function getFilteredTasks(status) {
    let tasks = state.tasks.filter(t => t.status === status);
    if (filterProject !== 'all') {
      tasks = tasks.filter(t => t.projectId === filterProject);
    }
    if (filterMember !== 'all') {
      tasks = tasks.filter(t => t.assigneeId === filterMember);
    }
    return tasks;
  }

  function handleDragStart(event) {
    const { active } = event;
    const task = state.tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;
    const activeId = active.id;
    const overId = over.id;

    // Find what column overId belongs to
    let targetStatus = null;

    // Check if dropped directly on a column
    const col = COLUMNS.find(c => c.id === overId);
    if (col) {
      targetStatus = col.id;
    } else {
      // Dropped on a card — find which column that card is in
      const overTask = state.tasks.find(t => t.id === overId);
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus && activeId !== overId) {
      const activeTask = state.tasks.find(t => t.id === activeId);
      if (activeTask && activeTask.status !== targetStatus) {
        dispatch({
          type: 'UPDATE_TASK_STATUS',
          payload: { id: activeId, status: targetStatus },
        });
      }
    }
  }

  function handleAddTask(status) {
    setNewTaskStatus(status);
    setTaskModal(true);
  }

  return (
    <div className="p-6 flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => handleAddTask('todo')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
        <div className="w-px h-5 bg-slate-200" />
        <span className="text-sm text-slate-500 font-medium">Member:</span>
        <button
          onClick={() => setFilterMember('all')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            filterMember === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Members
        </button>
        {state.teamMembers.map(m => (
          <button
            key={m.id}
            onClick={() => setFilterMember(filterMember === m.id ? 'all' : m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filterMember === m.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Avatar name={m.name} color={m.avatarColor} size="xs" />
            {m.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <Column
              key={col.id}
              column={col}
              tasks={getFilteredTasks(col.id)}
              onCardClick={setEditTask}
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskForm
        isOpen={taskModal}
        onClose={() => setTaskModal(false)}
        defaultStatus={newTaskStatus}
      />
      <TaskForm
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        task={editTask}
      />
    </div>
  );
}
