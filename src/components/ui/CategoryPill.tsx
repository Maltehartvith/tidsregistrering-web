import type { Category } from "../../types/domain";
import { Button } from "./Button";

export function CategoryPill({
  cat,
  active,
  onClick,
}: {
  cat: Category;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="pill"
      aria-pressed={active}
      onClick={onClick}
      className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all cat-"
      style={{
        background: active ? cat.color : cat.soft,
        color: active ? "#FAFAF7" : cat.color,
        borderColor: cat.color,
      }}
    >
      {cat.short}
    </Button>
  );
}
