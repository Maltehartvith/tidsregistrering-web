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
    <div className="cat-card mb-3 rounded-[14px] border border-border bg-card px-4.5 py-4">
      <div
        className="cat-eyebrow text-[0.6875rem] font-semibold uppercase tracking-[0.06em]"
        style={{ color }}
      >
        {label}
      </div>
      <div
        className={`my-1 mb-2.5 font-mono text-[1.625rem] font-semibold ${diff < 0 ? "text-deficit" : "text-surplus"}`}
      >
        {formatDiff(diff)}
      </div>
      <ThreadBar
        percent={target > 0 ? (registered / target) * 100 : 100}
        color={color}
      />
      <div className="mt-2 flex justify-between text-xs text-ink-soft">
        <span>
          {registered} af {target} timer registreret
        </span>
        <span>{target}t</span>
      </div>
    </div>
  );
}
