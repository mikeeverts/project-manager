import React from 'react';

const priorityConfig = {
  high: { label: 'High', className: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  low: { label: 'Low', className: 'bg-green-100 text-green-700' },
};

export default function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
