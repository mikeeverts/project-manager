/**
 * Returns the color for a given completion percentage based on the ColorConfig ranges.
 */
export function getCompletionColor(percentage, colorConfig) {
  if (!colorConfig || !colorConfig.ranges) return '#94a3b8';
  const pct = Math.max(0, Math.min(100, percentage));
  for (const range of colorConfig.ranges) {
    if (pct >= range.min && pct <= range.max) {
      return range.color;
    }
  }
  return '#94a3b8';
}

/**
 * Returns the label for a given completion percentage based on the ColorConfig ranges.
 */
export function getCompletionLabel(percentage, colorConfig) {
  if (!colorConfig || !colorConfig.ranges) return '';
  const pct = Math.max(0, Math.min(100, percentage));
  for (const range of colorConfig.ranges) {
    if (pct >= range.min && pct <= range.max) {
      return range.label;
    }
  }
  return '';
}
