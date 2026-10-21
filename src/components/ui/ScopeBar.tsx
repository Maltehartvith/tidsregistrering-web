import { Button } from "@/components/ui/Button";
import type { ScopeChoice } from "@/domain/hourScope";

export function ScopeBar({
  choices,
  value,
  onChange,
}: {
  choices: ScopeChoice[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (choices.length <= 1) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {choices.map((choice) => {
        const selected = value === choice.id;
        return (
          <Button
            key={choice.id}
            variant="pill"
            style={{
              background: selected ? "var(--ink)" : "var(--card)",
              color: selected ? "var(--card)" : "var(--ink)",
            }}
            onClick={() => onChange(choice.id)}
          >
            {choice.label}
          </Button>
        );
      })}
    </div>
  );
}
