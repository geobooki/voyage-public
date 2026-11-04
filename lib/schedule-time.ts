export const scheduleTimes = Array.from({ length: 24 * 12 }, (_, index) => {
  const minutes = index * 5;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export function fiveMinuteTime(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "09:00";
  const minutes = Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  return scheduleTimes[Math.min(scheduleTimes.length - 1, Math.round(minutes / 5))];
}

export const timeMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
export const durationBetween = (start: string, end: string) => (timeMinutes(end) - timeMinutes(start) + 1440) % 1440 || 1440;
export function timingFromDuration(start: string, input: string) {
  if (!input) return { endTime: "", durationMinutes: "" };
  const duration = Math.min(1440, Math.max(5, Math.round(Number(input) / 5) * 5));
  if (!Number.isFinite(duration)) return { endTime: "", durationMinutes: "" };
  const end = (timeMinutes(start) + duration) % 1440;
  return { endTime: scheduleTimes[Math.floor(end / 5)], durationMinutes: String(duration) };
}
export function timingFromEnd(start: string, end: string) {
  if (!end) return { endTime: "", durationMinutes: "" };
  const endTime = fiveMinuteTime(end);
  return { endTime, durationMinutes: String(durationBetween(start, endTime)) };
}

export function layoutIntervals<T extends { start: number; end: number }>(entries: T[]) {
  const result: (T & { lane: number; columns: number })[] = [];
  let group: typeof result = [];
  let ends: number[] = [];
  let groupEnd = -1;
  const finish = () => { group.forEach((entry) => { entry.columns = ends.length; }); group = []; ends = []; };
  for (const entry of [...entries].sort((a, b) => a.start - b.start || a.end - b.end)) {
    if (entry.start >= groupEnd) finish();
    let lane = ends.findIndex((end) => end <= entry.start);
    if (lane < 0) lane = ends.length;
    ends[lane] = entry.end;
    groupEnd = group.length ? Math.max(groupEnd, entry.end) : entry.end;
    const placed = { ...entry, lane, columns: 1 };
    group.push(placed); result.push(placed);
  }
  finish();
  return result;
}
