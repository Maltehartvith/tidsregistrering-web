import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { categoriesInTargets } from "@/domain/catalog";
import type { CategoriesMap } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/NumberInput";
import { Selector } from "@/components/ui/Selector";

type ProgramCategoryFieldsProps = {
  label: string;
  hint?: string;
  targets: Record<string, number>;
  onChange: (targets: Record<string, number>) => void;
  /** Active categories. Only these can be added. */
  categories: CategoriesMap;
};

/** Target hours for the categories explicitly attached to a program. */
export function ProgramCategoryFields({
  label,
  hint,
  targets,
  onChange,
  categories,
}: ProgramCategoryFieldsProps) {
  const [addingKey, setAddingKey] = useState("");
  const attached = categoriesInTargets(targets, categories);
  const available = Object.values(categories).filter(
    (category) =>
      !Object.prototype.hasOwnProperty.call(targets, category.key),
  );

  const addCategory = () => {
    const category = categories[addingKey];
    if (!category) return;
    onChange({ ...targets, [category.key]: category.defaultTarget ?? 0 });
    setAddingKey("");
  };

  const removeCategory = (key: string) => {
    const next = { ...targets };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="mb-3.5">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
        {label}
      </span>
      <div className="flex flex-col gap-2">
        {attached.length === 0 && (
          <p className="text-[13px] text-ink-soft">
            Ingen kategorier tilføjet endnu.
          </p>
        )}
        {attached.map((category) => (
          <div key={category.key} className="flex items-end gap-2">
            <Field label={category.short} className="mb-0 min-w-0 flex-1">
              <NumberInput
                min={0}
                step={1}
                inputMode="numeric"
                value={targets[category.key] ?? 0}
                onChange={(e) =>
                  onChange({
                    ...targets,
                    [category.key]: Number(e.target.value),
                  })
                }
                placeholder="0"
                required
              />
            </Field>
            <Button
              variant="icon"
              size="icon"
              onClick={() => removeCategory(category.key)}
              title={`Fjern ${category.label}`}
              aria-label={`Fjern ${category.label}`}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
        {available.length > 0 && (
          <div className="mt-1 flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Selector
                value={addingKey}
                onChange={(e) => setAddingKey(e.target.value)}
                options={available.map((category) => ({
                  value: category.key,
                  label: category.label,
                }))}
                placeholder="Vælg kategori"
                position="left"
              />
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={addCategory}
              disabled={!addingKey}
            >
              <PlusCircle size={14} /> Tilføj
            </Button>
          </div>
        )}
      </div>
      {hint && (
        <span className="mt-1 block whitespace-pre-line text-[11px] text-ink-soft">
          {hint}
        </span>
      )}
    </div>
  );
}

type CourseGoalFieldsProps = {
  targets: Record<string, number>;
  /** Education maximum for each category key. The course cannot exceed these. */
  ceilings: Record<string, number>;
  onChange: (targets: Record<string, number>) => void;
  categories: CategoriesMap;
};

/** Hour goals for one course. Categories come from the education and cannot be added here. */
export function CourseGoalFields({
  targets,
  ceilings,
  onChange,
  categories,
}: CourseGoalFieldsProps) {
  const rows = categoriesInTargets(ceilings, categories);

  return (
    <div className="mb-3.5">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
        Holdets delmål
      </span>
      <div className="flex flex-col gap-2">
        {rows.length === 0 && (
          <p className="text-[13px] text-ink-soft">
            Uddannelsen har ingen kategorier endnu.
          </p>
        )}
        {rows.map((category) => {
          const ceiling = ceilings[category.key] ?? 0;
          return (
            <Field
              key={category.key}
              label={category.short}
              hint={`Højst ${ceiling} timer, som er uddannelsens mål.`}
              className="mb-0"
            >
              <NumberInput
                min={0}
                max={ceiling}
                step={1}
                inputMode="numeric"
                value={targets[category.key] ?? ceiling}
                onChange={(e) => {
                  const next = Math.min(ceiling, Math.max(0, Number(e.target.value)));
                  onChange({ ...targets, [category.key]: next });
                }}
                placeholder="0"
                required
              />
            </Field>
          );
        })}
      </div>
    </div>
  );
}
