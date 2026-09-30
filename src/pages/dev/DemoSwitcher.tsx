import { useLocation, useNavigate } from "react-router-dom";
import { isAdminPath, routes } from "../../routes.ts";

export function DemoSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!import.meta.env.DEV) return null;

  const path = location.pathname;
  const btn = (active: boolean) =>
    `font-[family-name:var(--font-mono)] text-[10px] tracking-[0.04em] rounded-full border px-2.5 py-1 cursor-pointer ${
      active
        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--card)]"
        : "border-[var(--border)] bg-[var(--card)] text-[var(--ink-soft)]"
    }`;

  return (
    <div className="sticky top-0 z-20 mx-auto flex max-w-[430px] justify-center gap-1.5 border-b border-[var(--border)] bg-[#f4f3ee] p-2">
      <button
        type="button"
        className={btn(path === routes.student)}
        onClick={() => navigate(routes.student)}
      >
        KURSIST
      </button>
      <button
        type="button"
        className={btn(isAdminPath(path))}
        onClick={() => navigate(routes.adminStudents)}
      >
        ADMINISTRATOR
      </button>
      <button
        type="button"
        className={btn(path === routes.login)}
        onClick={() => navigate(routes.login)}
      >
        LOG IND-FLOW
      </button>
    </div>
  );
}
