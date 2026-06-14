// Local-time date helpers for the calendar. All calendar grid math is done in
// the browser's local timezone; events are stored as UTC ISO strings.

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/**
 * 6-week (42-cell) grid for the month containing `monthAnchor`, starting on
 * Sunday — matching the Apple Calendar month view layout.
 */
export function buildMonthGrid(monthAnchor: Date): Date[] {
  const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const gridStart = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function formatMonthTitle(d: Date): string {
  return `${d.getFullYear()}年 ${d.getMonth() + 1}月`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayTitle(d: Date): string {
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/** Convert a Date to the value expected by <input type="datetime-local">. */
export function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Convert a Date to the value expected by <input type="date">. */
export function toDateValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse a datetime-local / date input value as a local-time Date. */
export function parseLocalValue(value: string): Date {
  // "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD"
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!timePart) return new Date(y, m - 1, d);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

/**
 * Does an event (its [start, end] interval) intersect the given day?
 * All-day events use date-only comparison.
 */
export function eventOnDay(
  start: Date,
  end: Date,
  day: Date,
  allDay: boolean,
): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  if (allDay) {
    return startOfDay(start) < dayEnd && startOfDay(end) >= dayStart;
  }
  return start < dayEnd && end > dayStart;
}
