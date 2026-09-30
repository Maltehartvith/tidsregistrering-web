import { useState } from "react";
import {
  Home,
  PlusCircle,
  ListChecks,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  Eye,
} from "lucide-react";
import { useCatalog } from "../../context/CatalogContext";
import { useBranding } from "../../context/BrandingContext";
import { useCourses } from "../../context/CoursesContext";
import { useEntries } from "../../context/EntriesContext";
import { categoryOf } from "../../domain/catalog";
import {
  totalsForStudent,
  totalsForStudentOnHold,
  targetsForStudent,
  programName,
  holdLabel,
} from "../../domain/totals";
import { emptyForm } from "../../domain/entryForm";

import { CategoryPill } from "../../components/ui/CategoryPill";
import { CategoryCard } from "../../components/ui/CategoryCard";
import { EntryForm } from "../../components/ui/EntryForm";
import { BrandLogo, BrandName, AppTitle } from "../../components/brand/Brand";

import { viewPrefClasses } from "../../theme/viewPrefs";

import { ViewSettingsPanel } from "./ViewSettingsPanel";
import { Student } from "@/types/user";
import { Entry, TimeEntry } from "@/types/entry";
import { ViewPrefs } from "@/types/ui";
import { useAuditLogs } from "@/context/AuditLogsContext";

type StudentViewProps = {
  student: Student;
  viewPrefs: ViewPrefs;
  setViewPrefs: (viewPrefs: ViewPrefs) => void;
};
export const StudentView = ({
  student,
  viewPrefs,
  setViewPrefs,
}: StudentViewProps) => {
  const { CATEGORIES, ALL_CATEGORIES, LEARNING_GOALS, programs } = useCatalog();
  const { courses } = useCourses();
  const { entries, createEntry, updateEntry, deleteEntry } = useEntries();
  const { logEvent } = useAuditLogs();
  const [tab, setTab] = useState("oversigt");
  const [showView, setShowView] = useState(false);
  const [scope, setScope] = useState("uddannelse");
  const [form, setForm] = useState(
    emptyForm(student.courseId, CATEGORIES, LEARNING_GOALS),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(
    emptyForm(student.courseId, CATEGORIES, LEARNING_GOALS),
  );
  const [filterCat, setFilterCat] = useState("alle");
  const [filterHold, setFilterHold] = useState("alle");
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const includedLinks = (student.courseLinks || []).filter((l) => l.included);
  const brand = useBranding();
  const contactHref = brand.contactEmail
    ? `mailto:${brand.contactEmail}?subject=${encodeURIComponent(`Henvendelse fra ${student.name} (${holdLabel(student.courseId, courses)})`)}&body=${encodeURIComponent(
        `Hej\n\n[Skriv din besked her]\n\n---\nNavn: ${student.name}\nEmail: ${student.email}\nHold: ${holdLabel(student.courseId, courses)}\nUddannelse: ${programName(courses[student.courseId], programs) || "-"}\n`,
      )}`
    : "";

  const myEntries = entries.filter((e) => e.studentId === student.id);
  const totalsWholeProgram = totalsForStudent(student, entries, CATEGORIES);
  const targetsWholeProgram = targetsForStudent(student, courses, CATEGORIES);
  const totalsThisHold = totalsForStudentOnHold(
    student,
    entries,
    student.courseId,
    CATEGORIES,
  );
  const targetsThisHold = courses?.[student.courseId]?.targets || {};
  const totals = scope === "hold" ? totalsThisHold : totalsWholeProgram;
  const targets = scope === "hold" ? targetsThisHold : targetsWholeProgram;

  const handleAdd = async () => {
    if (!form.hours || Number(form.hours) <= 0) return;
    await createEntry({
      ...form,
      studentId: student.id,
      courseId: student.courseId,
      hours: Number(form.hours),
    });
    void logEvent({
      actor: "Kursist",
      studentId: student.id,
      description: `${student.name} registrerede ${form.hours} timer (${categoryOf(ALL_CATEGORIES, form.category).label})`,
    });
    setForm(emptyForm(student.courseId, CATEGORIES, LEARNING_GOALS));
    showToast("Registrering gemt");
    setTab("oversigt");
  };

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

  const recentEntries = [...myEntries]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  return (
    <div
      className={`relative mx-auto flex min-h-screen max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100vh-80px)] md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)] ${viewPrefClasses(viewPrefs)}`}
    >
      <div className="px-5 pb-4.5 pt-6.5">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-6.5 w-auto max-w-35 shrink-0 object-contain" />
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
            <BrandName />
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <div className="mb-0.5 font-display text-[28px] font-semibold">
              <AppTitle />
            </div>
            <div className="text-[13px] text-ink-soft">
              {student.name} ·{" "}
              {programName(courses[student.courseId], programs)
                ? `${programName(courses[student.courseId], programs)} · `
                : ""}
              {courses[student.courseId].label}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
              onClick={() => setShowView(!showView)}
              title="Visning og tilgængelighed"
              aria-label="Visning og tilgængelighed"
              aria-expanded={showView}
            >
              <Eye size={16} />
            </button>
            {/*          {onGoAdmin && (
              <button
                className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                onClick={onGoAdmin}
                title="Administrator"
              >
                <ShieldCheck size={16} />
              </button>
            )} */}
          </div>
        </div>
        {showView && viewPrefs && (
          <ViewSettingsPanel
            prefs={viewPrefs}
            onChange={setViewPrefs}
            onClose={() => setShowView(false)}
          />
        )}
        <div className="mt-4 flex items-center gap-2">
          <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
          <span className="stitch-line" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-25 pt-1">
        {tab === "oversigt" && (
          <>
            <div className="mb-4 rounded-[14px] border border-border bg-card px-4.5 py-3.5">
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <div
                    className="mb-1.5 block text-xs font-semibold text-ink-soft"
                    style={{ marginBottom: 4 }}
                  >
                    Mit hold
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ fontSize: 15 }}
                  >
                    {courses[student.courseId].label} ·{" "}
                    {courses[student.courseId].startYear}
                  </div>
                  {programName(courses[student.courseId], programs) && (
                    <div className="mt-px text-xs text-ink-soft">
                      {programName(courses[student.courseId], programs)}
                    </div>
                  )}
                </div>
              </div>
              {includedLinks.length > 0 && (
                <div className="mt-2.5 text-xs leading-normal text-ink-soft">
                  Timer fra{" "}
                  {includedLinks
                    .map((l) => holdLabel(l.courseId, courses))
                    .join(", ")}{" "}
                  tæller også med i dit regnskab.
                </div>
              )}
              {brand.contactEmail && (
                <a
                  className="mt-2.5 inline-block text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
                  href={contactHref}
                >
                  Er noget forkert? Kontakt os
                </a>
              )}
            </div>

            {includedLinks.length > 0 && (
              <div
                className="flex flex-wrap gap-2"
                style={{ marginBottom: 12 }}
              >
                <button
                  className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
                  style={{
                    background:
                      scope === "uddannelse" ? "var(--ink)" : "var(--card)",
                    color:
                      scope === "uddannelse" ? "var(--card)" : "var(--ink)",
                  }}
                  onClick={() => setScope("uddannelse")}
                >
                  Hele uddannelsen
                </button>
                <button
                  className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
                  style={{
                    background: scope === "hold" ? "var(--ink)" : "var(--card)",
                    color: scope === "hold" ? "var(--card)" : "var(--ink)",
                  }}
                  onClick={() => setScope("hold")}
                >
                  Dette hold
                </button>
              </div>
            )}

            {Object.values(CATEGORIES).map((cat) => (
              <CategoryCard
                key={cat.key}
                label={cat.label}
                registered={totals[cat.key]}
                target={targets[cat.key]}
                color={cat.color}
              />
            ))}

            <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
              Seneste registreringer
            </div>
            {recentEntries.length === 0 && (
              <div className="px-2.5 py-10 text-center text-[13px] text-ink-soft">
                Ingen registreringer endnu.
              </div>
            )}
            {recentEntries.map((e) => {
              const cat = categoryOf(ALL_CATEGORIES, e.category);
              return (
                <div
                  className="flex items-center gap-2.5 border-b border-border py-2.5 text-[13px] last:border-b-0"
                  key={e.id}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: cat.color }}
                  />
                  <span>{cat.short}</span>
                  <span className="font-mono text-[11px] text-ink-soft">
                    {e.date}
                  </span>
                  <span className="ml-auto font-mono font-semibold">
                    {e.hours}t
                  </span>
                </div>
              );
            })}
          </>
        )}

        {tab === "registrer" && (
          <>
            <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
              Registrér timer
            </div>
            <EntryForm
              values={form}
              onChange={setForm}
              onSubmit={handleAdd}
              submitLabel="Gem registrering"
            />
          </>
        )}

        {tab === "historik" && (
          <>
            <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
              Historik
            </div>

            <div className="mb-3.5 flex flex-wrap gap-2">
              <button
                className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
                style={{
                  background:
                    filterCat === "alle" ? "var(--ink)" : "var(--card)",
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
                    background:
                      filterHold === "alle" ? "var(--ink)" : "var(--card)",
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
                      background:
                        filterHold === id ? "var(--ink)" : "var(--card)",
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

            <div className="mb-4 flex items-center gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 py-2 text-ink-soft">
              <Search size={15} />
              <input
                type="text"
                placeholder="Søg i noter, terapeut eller læringsmål..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

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
                          className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                          onClick={() => removeEntry(e.id ?? "")}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                          onClick={() => setConfirmId(null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                          onClick={() => startEdit(e)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
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
        )}
      </div>

      {toast && (
        <div className="fixed bottom-21 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4.5 py-2.5 text-[13px] text-card shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
          <Check size={14} /> {toast}
        </div>
      )}

      <div className="sticky bottom-0 mx-auto flex w-full max-w-107.5 border-t border-border bg-card">
        <button
          className={`flex flex-1 cursor-pointer flex-col items-center gap-1 border-0 bg-transparent pb-3.5 pt-3 font-sans text-[11px] font-semibold ${tab === "oversigt" ? "text-blue" : "text-ink-soft"}`}
          onClick={() => setTab("oversigt")}
        >
          <Home size={19} />
          Oversigt
        </button>
        <button
          className={`flex flex-1 cursor-pointer flex-col items-center gap-1 border-0 bg-transparent pb-3.5 pt-3 font-sans text-[11px] font-semibold ${tab === "registrer" ? "text-blue" : "text-ink-soft"}`}
          onClick={() => setTab("registrer")}
        >
          <PlusCircle size={19} />
          Registrér
        </button>
        <button
          className={`flex flex-1 cursor-pointer flex-col items-center gap-1 border-0 bg-transparent pb-3.5 pt-3 font-sans text-[11px] font-semibold ${tab === "historik" ? "text-blue" : "text-ink-soft"}`}
          onClick={() => setTab("historik")}
        >
          <ListChecks size={19} />
          Historik
        </button>
      </div>
    </div>
  );
};
