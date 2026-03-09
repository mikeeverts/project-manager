import React from 'react';
import { useApp } from '../../context/AppContext';
import { getCompletionColor } from '../../utils/colors';

export default function ProgressBar({ percentage, height = 6, showLabel = false }) {
  const { state } = useApp();
  const color = getCompletionColor(percentage, state.colorConfig);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full bg-slate-200 overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.max(0, Math.min(100, percentage))}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
