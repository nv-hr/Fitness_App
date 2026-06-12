export function isDateWithinTimezoneRange(dateStr) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return dateStr === todayStr || dateStr === yesterdayStr || dateStr === tomorrowStr;
}

export function getHistoryCutoffStr(days, inclusiveToday = false) {
  const normalizedDays = Math.min(Math.max(1, Math.floor(days)), 365);
  const cutoffDate = new Date();
  const offset = inclusiveToday ? (normalizedDays - 1) : normalizedDays;
  cutoffDate.setDate(cutoffDate.getDate() - offset);
  return cutoffDate.toISOString().split('T')[0];
}
