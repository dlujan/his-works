export function formatTimeSince(date: string) {
  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }

  const now = Date.now();
  const diff = Math.max(0, now - timestamp);

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function formatTimeUntil(date: string) {
  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }

  const now = Date.now();
  const diff = timestamp - now;

  if (diff <= 0) {
    const overdue = Math.abs(diff);
    const minutesOverdue = Math.floor(overdue / (1000 * 60));
    if (minutesOverdue < 1) return "due now";
    if (minutesOverdue < 60) return `${minutesOverdue}m overdue`;
    const hoursOverdue = Math.floor(minutesOverdue / 60);
    if (hoursOverdue < 24) return `${hoursOverdue}h overdue`;
    const daysOverdue = Math.floor(hoursOverdue / 24);
    return `${daysOverdue}d overdue`;
  }

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "due soon";
  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `in ${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `in ${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `in ${months}mo`;

  const years = Math.floor(days / 365);
  return `in ${years}y`;
}
