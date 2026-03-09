import { format, parseISO, isValid, differenceInDays, addDays, isBefore, isAfter, startOfDay } from 'date-fns';

export function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
}

export function formatDate(dateStr, fmt = 'MMM d, yyyy') {
  const date = parseDate(dateStr);
  if (!date) return '';
  return format(date, fmt);
}

export function formatShortDate(dateStr) {
  return formatDate(dateStr, 'MMM d');
}

export function isOverdue(dueDate) {
  const date = parseDate(dueDate);
  if (!date) return false;
  return isBefore(date, startOfDay(new Date()));
}

export function getDaysDiff(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return 0;
  return differenceInDays(end, start);
}

export function addDaysToDate(dateStr, days) {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  return addDays(date, days).toISOString();
}

export function toInputDateString(dateStr) {
  const date = parseDate(dateStr);
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

export function fromInputDateString(str) {
  if (!str) return null;
  const date = new Date(str + 'T00:00:00');
  return isValid(date) ? date.toISOString() : null;
}

export function getDateRange(tasks) {
  const dates = tasks.flatMap(t => [parseDate(t.startDate), parseDate(t.dueDate)]).filter(Boolean);
  if (dates.length === 0) {
    const today = new Date();
    return { min: addDays(today, -7), max: addDays(today, 30) };
  }
  const min = dates.reduce((a, b) => isBefore(a, b) ? a : b);
  const max = dates.reduce((a, b) => isAfter(a, b) ? a : b);
  return { min: addDays(min, -3), max: addDays(max, 7) };
}
