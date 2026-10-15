import { useState } from "react";
import {
  Search,
  ChevronRight,
  ArrowRightLeft,
  FileSpreadsheet,
} from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import { useEntries } from "@/context/EntriesContext";
import { totalsForStudent, targetsForStudent } from "@/domain/totals";
import { activeCourseId, previousCourses } from "@/domain/userCourses";
import { formatDiff } from "@/domain/format";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export function StudentList() {
  const { CATEGORIES, programs } = useCatalog({
    categories: true,
    programs: true,
  });
  const { courses } = useCourses();
  const { students, selectedStudent, setSelectedStudent } = useStudents();
  const { entries } = useEntries();
  const [holdFilter, setHoldFilter] = useState("alle");
  const [query, setQuery] = useState("");

  const filtered = students
    .filter(
      (s) =>
        holdFilter === "alle" ||
        s.courses.some((course) => course.id === holdFilter),
    )
    .filter((s) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const homeId = activeCourseId(s);
      const courseLabelText = (
        (homeId && courses?.[homeId]?.label) ||
        (homeId && courses?.[homeId]?.key) ||
        ""
      ).toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        courseLabelText.includes(q)
      );
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 pt-1">
      <div className="flex flex-col gap-2 pr-4">
        <Button variant="primary" size="small" disabled>
          <FileSpreadsheet size={14} /> Eksporter{" "}
          {holdFilter === "alle" ? "alle hold" : courses?.[holdFilter]?.label}{" "}
          til Excel
        </Button>

        <Input
          icon={<Search size={15} />}
          type="text"
          placeholder="Søg på navn, email eller hold..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex flex-wrap gap-1">
          <Button
            variant={holdFilter === "alle" ? "primary" : "secondary"}
            onClick={() => setHoldFilter("alle")}
            className="rounded-full! px-3! py-2! text-xs!"
          >
            Alle hold
          </Button>
          {Object.values(courses || {}).map((h) => (
            <Button
              key={h.id}
              variant={holdFilter === h.id ? "primary" : "secondary"}
              className="rounded-full! px-3! py-2! text-xs!"
              onClick={() => setHoldFilter(h.id)}
            >
              {h.key}
            </Button>
          ))}
        </div>
      </div>
      {filtered.length === 0 && (
        <div className="px-2 py-10 text-center text-[13px] text-ink-soft">
          Ingen kursister fundet.
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 mr-1 scrollbar-bottom-margin">
        {filtered.map((s) => {
          const homeId = activeCourseId(s);
          const totals = totalsForStudent(s, entries, CATEGORIES);
          const targets = targetsForStudent(
            s,
            courses || {},
            programs,
            CATEGORIES,
          );
          return (
            <button
              key={s.id}
              className={`mb-2.5 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left font-sans hover:border-primary ${selectedStudent?.id === s.id ? "rounded-xl bg-primary-soft" : ""}`}
              onClick={() => setSelectedStudent(s)}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="mt-px text-xs text-ink-soft">
                  {s.email}
                  {homeId
                    ? ` · ${courses?.[homeId]?.label || courses?.[homeId]?.key || ""}`
                    : ""}
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {Object.values(CATEGORIES).map((c) => {
                    const diff = totals[c.key] - targets[c.key];
                    return (
                      <span
                        key={c.key}
                        className="flex items-center gap-1 font-mono text-[11px] font-semibold"
                        style={{
                          color: diff < 0 ? "var(--deficit)" : "var(--surplus)",
                        }}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: c.color }}
                        />
                        {formatDiff(diff)}
                      </span>
                    );
                  })}
                </div>
              </div>
              {previousCourses(s).some((course) => course.included) && (
                <ArrowRightLeft
                  size={14}
                  className="shrink-0 text-secondary"
                  aria-label="Timeoverførsel aktiv"
                />
              )}
              <ChevronRight size={18} className="shrink-0 text-ink-soft" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
