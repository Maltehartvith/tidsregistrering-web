import { useState, useEffect, type ChangeEvent } from "react";
import { User, ChevronDown } from "lucide-react";
import { useCatalog } from "../../context/CatalogContext";
import { categoryOf } from "../../domain/catalog";
import { Field } from "./Field";
import { CategoryPill } from "./CategoryPill";
import type { EntryFormValues } from "../../types/entry";
import type { Course } from "../../types/course";

export function EntryForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  showHoldField,
  holdOptions = [],
}: {
  values: EntryFormValues;
  onChange: (v: EntryFormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  showHoldField?: boolean;
  holdOptions?: Course[];
}) {
  const { CATEGORIES, ALL_CATEGORIES, LEARNING_GOALS } = useCatalog();
  const cat = categoryOf(ALL_CATEGORIES, values.category);
  const [error, setError] = useState("");
  useEffect(() => {
    setError("");
  }, [values]);
  const set =
    (key: keyof EntryFormValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange({ ...values, [key]: e.target.value });

  // Egen validering med tydelige danske beskeder (browserens egne bobler er lette at overse)
  const validate = () => {
    if (cat?.requiresTherapist && !String(values.therapist || "").trim()) return "Udfyld navn på terapeut.";
    if (!values.date) return "Vælg en dato.";
    const hours = Number(String(values.hours).replace(",", "."));
    if (!(hours > 0)) return "Angiv antal timer (større end 0).";
    if (Math.abs(hours * 4 - Math.round(hours * 4)) > 1e-9) return "Timer angives i kvarter, fx 0,75 eller 1,5.";
    return "";
  };

  // Bevidst uden HTML-formular: sikrede forhåndsvisninger (fx Claudes artifact-panel) blokerer formular-indsendelse.
  const submit = () => {
    const problem = validate();
    if (problem) { setError(problem); return; }
    onSubmit();
  };

  return (
    <div
      className="mt-1.5"
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault();
          submit();
        }
      }}
    >
      <div className="mb-3.5 block">
        <span className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Kategori</span>
        <div className="flex flex-wrap gap-2">
          {[
            ...Object.values(CATEGORIES),
            ...(values.category && !CATEGORIES[values.category] ? [{ ...categoryOf(ALL_CATEGORIES, values.category), short: `${categoryOf(ALL_CATEGORIES, values.category).short} (arkiveret)` }] : []),
          ].map((c) => (
            <CategoryPill
              key={c.key}
              cat={c}
              active={values.category === c.key}
              onClick={() => onChange({ ...values, category: c.key })}
            />
          ))}
        </div>
      </div>

      {cat.requiresTherapist && (
        <Field label="Navn på terapeut">
          <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink-soft)]">
            <User size={16} strokeWidth={2} />
            <input
              type="text"
              value={values.therapist}
              onChange={set("therapist")}
              placeholder="F.eks. Mette Vinther"
              required
            />
          </div>
        </Field>
      )}

      <div className="flex gap-3">
        <Field label="Dato">
          <input type="date" value={values.date} onChange={set("date")} required />
        </Field>
        <Field label="Timer">
          <input
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            value={values.hours}
            onChange={set("hours")}
            placeholder="0"
            required
          />
        </Field>
      </div>

      {showHoldField && (
        <Field label="Hold" hint="Bestemmer hvilket hold registreringen tæller under.">
          <div className="relative">
            <select value={values.courseId} onChange={set("courseId")}>
              {holdOptions.map((h) => (
                <option key={h.id} value={h.id}>{h.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
          </div>
        </Field>
      )}

      <Field label="Læringsmål">
        <div className="relative">
          <select value={values.learningGoal} onChange={set("learningGoal")}>
            {values.learningGoal && !LEARNING_GOALS.includes(values.learningGoal) && (
              <option value={values.learningGoal}>{values.learningGoal} (udgået)</option>
            )}
            {LEARNING_GOALS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
        </div>
      </Field>

      <Field label="Noter (valgfrit)">
        <textarea rows={2} value={values.notes} onChange={set("notes")} placeholder="Kort beskrivelse..." />
      </Field>

      {error && <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{error}</div>}

      <div className="mt-[18px] flex gap-2.5">
        {onCancel && (
          <button type="button" className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border)] bg-transparent px-4 py-3 font-sans text-sm font-semibold text-[var(--ink-soft)] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45" onClick={onCancel}>Annuller</button>
        )}
        <button type="button" className="flex-1 cursor-pointer rounded-[10px] border-0 bg-[var(--blue)] px-4 py-3 font-sans text-sm font-semibold text-[#fafaf7] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45" onClick={submit}>{submitLabel}</button>
      </div>
    </div>
  );
}
