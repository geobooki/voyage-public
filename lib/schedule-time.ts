export const scheduleTimes = Array.from({ length: 24 * 12 }, (_, index) => {
  const minutes = index * 5;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export function fiveMinuteTime(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "09:00";
  const minutes = Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  return scheduleTimes[Math.min(scheduleTimes.length - 1, Math.round(minutes / 5))];
}
