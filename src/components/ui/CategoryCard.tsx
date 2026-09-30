import { ThreadBar } from "./ThreadBar";
import { formatDiff } from "../../domain/format";

export function CategoryCard({
  label,
  registered = 0,
  target = 0,
  color,
}: {
  label: string;
  registered?: number;
  target?: number;
  color: string;
}) {
  const diff = registered - target;
  return (
    <div className="mb-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] px-[18px] py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color }}>
        {label}
      </div>
      <div
        className="my-1 mb-2.5 font-[family-name:var(--font-mono)] text-[26px] font-semibold"
        style={{ color: diff < 0 ? "var(--deficit)" : "var(--surplus)" }}
      >
        {formatDiff(diff)}
      </div>
      <ThreadBar percent={target > 0 ? (registered / target) * 100 : 100} color={color} />
      <div className="mt-2 flex justify-between text-xs text-[var(--ink-soft)]">
        <span>
          {registered} af {target} timer registreret
        </span>
        <span>{target}t</span>
      </div>
    </div>
  );
}
