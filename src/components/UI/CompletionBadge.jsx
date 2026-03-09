import React from 'react';
import { useApp } from '../../context/AppContext';
import { getCompletionColor, getCompletionLabel } from '../../utils/colors';

export default function CompletionBadge({ percentage }) {
  const { state } = useApp();
  const color = getCompletionColor(percentage, state.colorConfig);
  const label = getCompletionLabel(percentage, state.colorConfig);

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {percentage}% — {label}
    </span>
  );
}
