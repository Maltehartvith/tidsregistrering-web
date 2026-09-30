export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const formatDiff = (diff: number): string => {
  const abs = Math.round(Math.abs(diff) * 10) / 10;
  const unit = abs === 1 ? "time" : "timer";
  if (diff > 0) return `+${abs} ${unit}`;
  if (diff < 0) return `−${abs} ${unit}`;
  return `0 ${unit}`;
};

export const formatLogTime = (at: Date): string =>
  at.toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit", year: "numeric" }) +
  " kl. " +
  at.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
