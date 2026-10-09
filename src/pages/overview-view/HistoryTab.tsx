import { Check, Pencil, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useAuditLogs } from "@/context/AuditLogsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useEntries } from "@/context/EntriesContext";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { EntryForm } from "@/components/ui/EntryForm";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { categoryOf } from "@/domain/catalog";
import { emptyForm } from "@/domain/entryForm";
import { holdLabel } from "@/domain/totals";
import { TimeEntry } from "@/types/entry";
import { useStudentOutlet } from "./StudentLayout";

export const HistoryTab = () => {
  const { student } = useStudentOutlet();
  const { CATEGORIES, ALL_CATEGORIES, LEARNING_GOALS } = useCatalog();
  const { courses } = useCourses();
  const { entries, updateEntry, deleteEntry } = useEntries();
  const { logEvent } = useAuditLogs();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(
    emptyForm(student.courseId, CATEGORIES, LEARNING_GOALS),
  );
  const [filterCat, setFilterCat] = useState("alle");
  const [filterHold, setFilterHold] = useState("alle");
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const myEntries = entries.filter((e) => e.studentId === student.id);

  const startEdit = (entry: TimeEntry) => {
    setEditingId(entry.id ?? null);
    setEditForm({ ...entry, hours: String(entry.hours) });
    setConfirmId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateEntry(editingId, {
      ...editForm,
      hours: Number(editForm.hours),
    });
    void logEvent({
      actor: "Kursist",
      studentId: student.id,
      description: `${student.name} rettede en registrering (${categoryOf(ALL_CATEGORIES, editForm.category).label})`,
    });
    setEditingId(null);
    showToast("Ændring gemt");
  };

  const removeEntry = async (id: string) => {
    const removed = entries.find((e) => e.id === id);
    await deleteEntry(id);
    if (removed) {
      void logEvent({
        actor: "Kursist",
        studentId: student.id,
        description: `${student.name} slettede en registrering på ${removed.hours} timer (${categoryOf(ALL_CATEGORIES, removed.category).label})`,
      });
    }
    setConfirmId(null);
    showToast("Registrering slettet");
  };

  const myHoldIds = Array.from(
    new Set([
      student.courseId,
      ...(student.courseLinks || []).map((l) => l.courseId),
    ]),
  );

  const filteredEntries = myEntries
    .filter((e) => filterCat === "alle" || e.category === filterCat)
    .filter((e) => filterHold === "alle" || e.courseId === filterHold)
    .filter((e) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        e.therapist?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q) ||
        e.learningGoal.toLowerCase().includes(q) ||
        categoryOf(ALL_CATEGORIES, e.category).label.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <>
      <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
        Historik
      </div>

      <div className="mb-3.5 flex flex-wrap gap-2">
        <button
          className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
          style={{
            background: filterCat === "alle" ? "var(--ink)" : "var(--card)",
            color: filterCat === "alle" ? "var(--card)" : "var(--ink)",
            borderColor: "var(--border)",
          }}
          onClick={() => setFilterCat("alle")}
        >
          Alle
        </button>
        {Object.values(CATEGORIES).map((c) => (
          <CategoryPill
            key={c.key}
            cat={c}
            active={filterCat === c.key}
            onClick={() => setFilterCat(c.key)}
          />
        ))}
      </div>

      {myHoldIds.length > 1 && (
        <div className="mb-3.5 flex flex-wrap gap-2">
          <button
            className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
            style={{
              background: filterHold === "alle" ? "var(--ink)" : "var(--card)",
              color: filterHold === "alle" ? "var(--card)" : "var(--ink)",
              borderColor: "var(--border)",
            }}
            onClick={() => setFilterHold("alle")}
          >
            Alle hold
          </button>
          {myHoldIds.map((id) => (
            <button
              key={id}
              className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
              style={{
                background: filterHold === id ? "var(--ink)" : "var(--card)",
                color: filterHold === id ? "var(--card)" : "var(--ink)",
                borderColor: "var(--border)",
              }}
              onClick={() => setFilterHold(id)}
            >
              {holdLabel(id, courses)}
            </button>
          ))}
        </div>
      )}

      <Input
        placeholder="Søg i noter, terapeut eller læringsmål..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        icon={<Search size={15} />}
        type="text"
        className="mb-4"
      />

      {filteredEntries.length === 0 && (
        <div className="px-2.5 py-10 text-center text-[13px] text-ink-soft">
          Ingen registreringer fundet.
        </div>
      )}

      {filteredEntries.map((e) => {
        const cat = categoryOf(ALL_CATEGORIES, e.category);
        if (editingId === e.id) {
          return (
            <div
              className="mb-2.5 rounded-xl border border-border bg-card px-3.5 py-3"
              key={e.id}
            >
              <EntryForm
                values={editForm}
                onChange={setEditForm}
                onSubmit={saveEdit}
                onCancel={() => setEditingId(null)}
                submitLabel="Gem ændring"
              />
            </div>
          );
        }
        return (
          <div
            className="mb-2.5 rounded-xl border border-border bg-card px-3.5 py-3"
            key={e.id}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: cat.color }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: cat.color }}
              >
                {cat.label}
              </span>
              <span className="ml-auto font-mono text-[11px] text-ink-soft">
                {e.date}
              </span>
            </div>
            <div className="mt-1.5 flex items-end justify-between">
              <div>
                <div className="font-mono text-xl font-semibold">
                  {e.hours} timer
                </div>
                {e.therapist && (
                  <div className="mt-0.5 text-xs text-ink-soft">
                    Terapeut: {e.therapist}
                  </div>
                )}
                {e.courseId !== student.courseId && (
                  <div className="mt-0.5 text-xs text-ink-soft">
                    Overført fra {holdLabel(e.courseId, courses)}
                  </div>
                )}
              </div>
              {confirmId === e.id ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <span>Slet?</span>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => removeEntry(e.id ?? "")}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => setConfirmId(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => startEdit(e)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => setConfirmId(e.id ?? "")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-1.5 text-xs leading-snug text-ink-soft">
              {e.learningGoal}
            </div>
            {e.notes && (
              <div className="mt-1.5 text-xs leading-snug text-ink-soft">
                {e.notes}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
