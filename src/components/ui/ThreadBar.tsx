export function ThreadBar({ percent, color }: { percent: number; color: string }) {
  const capped = Math.max(0, Math.min(percent, 100));
  return (
    <div className="thread-track">
      <div
        className="absolute inset-y-0 left-0 rounded-[3px] transition-[width] duration-500 ease-in-out"
        style={{ width: `${capped}%`, background: color }}
      />
      <div
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] bg-card transition-[left] duration-500 ease-in-out"
        style={{ left: `${capped}%`, borderColor: color }}
      />
      <div className="absolute right-0 -top-0.75 h-3 w-0.5 bg-ink-soft opacity-40" title="Mål" />
    </div>
  );
}
