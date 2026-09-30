import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  ChevronRight,
  ArrowRightLeft,
  Users2,
  FileSpreadsheet,
} from "lucide-react";
import { useCatalog } from "../../context/CatalogContext";
import { useCourses } from "../../context/CoursesContext";
import { useStudents } from "../../context/StudentsContext";
import { useEntries } from "../../context/EntriesContext";

import {
  totalsForStudent,
  targetsForStudent,
  programName,
} from "../../domain/totals";
import { formatDiff } from "../../domain/format";
import { BrandLogo } from "../../components/brand/Brand";

import { AdminTabs } from "./AdminTabs";
import { routes } from "@/routes";
import { useNavigate } from "react-router-dom";

type AdminListViewProps = {
  onSelect: (id: string) => void;
  embedded: boolean;
  selectedId: string | null;
};
export const AdminListView = ({
  onSelect,
  embedded,
  selectedId,
}: AdminListViewProps) => {
  const navigate = useNavigate();
  const { CATEGORIES, LEARNING_GOALS, programs } = useCatalog();
  const { courses } = useCourses();
  const { students } = useStudents();
  const { entries } = useEntries();
  const [holdFilter, setHoldFilter] = useState("alle");
  const [query, setQuery] = useState("");

  const filtered = students
    .filter((s) => holdFilter === "alle" || s.courseId === holdFilter)
    .filter((s) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const courseLabel = (
        courses?.[s.courseId]?.label ||
        s.courseId ||
        ""
      ).toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        courseLabel.includes(q)
      );
    });

  // TODO: Export to Excel
  /*   const exportToExcel = () => {
    const cats = Object.values(CATEGORIES);
    const rows = filtered.map((s) => {
      const totals = totalsForStudent(s, entries, CATEGORIES);
      const targets = targetsForStudent(s, courses, CATEGORIES);
      const row = {
        Navn: s.name,
        Email: s.email,
        Hold: courses[s.courseId]?.label || s.courseId,
        Uddannelse: programName(courses[s.courseId], programs),
      };
      cats.forEach((c) => {
        const diff = totals[c.key] - targets[c.key];
        row[`${c.label} - registreret` as keyof typeof row] = totals[c.key];
        row[`${c.label} - mål (hele uddannelsen)` as keyof typeof row] = targets[c.key];
        row[`${c.label} - status` as keyof typeof row] = formatDiff(diff);
      });
      return row;
    });
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Timestatus");
    const holdLabel =
      holdFilter === "alle"
        ? "alle-hold"
        : (courses[holdFilter]?.label || holdFilter).replace(/\s+/g, "-");
    const filename = `Timeregnskab_${holdLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(book, filename);
    onLog?.({
      actor: "Administrator",
      courseId: holdFilter === "alle" ? undefined : holdFilter,
      description: `Administrator eksporterede timestatus til Excel for ${holdFilter === "alle" ? "alle hold" : courses[holdFilter]?.label || holdFilter} (${filtered.length} kursister)`,
    });
  }; */

  const listBody = (
    <>
      {!embedded && <AdminTabs />}

      <div className="mb-3.5 flex flex-wrap gap-2">
        <button
          className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
          style={{
            background: holdFilter === "alle" ? "var(--ink)" : "var(--card)",
            color: holdFilter === "alle" ? "var(--card)" : "var(--ink)",
            borderColor: "var(--border)",
          }}
          onClick={() => setHoldFilter("alle")}
        >
          Alle hold
        </button>
        {Object.values(courses || {}).map((h) => (
          <button
            key={h.id}
            className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
            style={{
              background: holdFilter === h.id ? "var(--ink)" : "var(--card)",
              color: holdFilter === h.id ? "var(--card)" : "var(--ink)",
              borderColor: "var(--border)",
            }}
            onClick={() => setHoldFilter(h.id)}
          >
            {h.id}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--ink-soft)]">
        <Search size={15} />
        <input
          type="text"
          placeholder="Søg på navn, email eller hold..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 10,
        }}
      >
        <button
          className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-[var(--blue-soft)] px-3 py-1.5 font-sans text-xs font-semibold text-[var(--blue)]"
      /* TODO: Implement export to Excel    onClick={exportToExcel} */
          //disabled={filtered.length === 0}
          disabled={true}
        >
          <FileSpreadsheet size={14} /> Eksporter{" "}
          {holdFilter === "alle" ? "alle hold" : courses?.[holdFilter]?.label} til
          Excel
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="px-2.5 py-10 text-center text-[13px] text-[var(--ink-soft)]">
          Ingen kursister fundet.
        </div>
      )}

      {filtered.map((s) => {
        const totals = totalsForStudent(s, entries, CATEGORIES);
        const targets = targetsForStudent(s, courses || {}, CATEGORIES);
        return (
          <button
            key={s.id}
            className={`mb-2.5 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-left font-sans hover:border-[var(--blue)] ${embedded && selectedId === s.id ? "rounded-xl bg-[var(--blue-soft)]" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{s.name}</div>
              <div className="mt-px text-xs text-[var(--ink-soft)]">
                {s.email} · {courses?.[s.courseId]?.label || s.courseId}
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {Object.values(CATEGORIES).map((c) => {
                  const diff = totals[c.key] - targets[c.key];
                  return (
                    <span
                      key={c.key}
                      className="flex items-center gap-1 font-[family-name:var(--font-mono)] text-[11px] font-semibold"
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
            {(s.courseLinks || []).some((l) => l.included) && (
              <ArrowRightLeft
                size={14}
                className="shrink-0 text-[var(--terracotta)]"
                aria-label="Timeoverførsel aktiv"
              />
            )}
            <ChevronRight
              size={18}
              className="shrink-0 text-[var(--ink-soft)]"
            />
          </button>
        );
      })}
    </>
  );

  if (embedded) {
    return (
      <div className="w-[360px] shrink-0 overflow-y-auto border-r border-[var(--border)] px-4 pb-10 pt-1 -body">
        {listBody}
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[430px] flex-col bg-[var(--paper)] font-sans text-[var(--ink)] md:my-10 md:min-h-[calc(100vh-80px)] md:max-w-[900px] md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="px-5 pb-[18px] pt-[26px]">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-[26px] w-auto max-w-[140px] shrink-0 object-contain" />
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
            Administrator
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <div className="mb-0.5 font-[family-name:var(--font-display)] text-[28px] font-semibold">
              Kursister
            </div>
            <div className="text-[13px] text-[var(--ink-soft)]">
              {students.length} kursister på tværs af holdene
            </div>
          </div>
          <button
            className="flex cursor-pointer rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--paper)] p-1.5 text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:cursor-default disabled:opacity-35"
            onClick={() => navigate(routes.adminStudents)}
            title="Kursistvisning"
          >
            <Users2 size={16} />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="h-3 w-0.5 shrink-0 rounded-sm bg-[var(--surplus)]" />
          <span className="stitch-line" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-25 pt-1">{listBody}</div>
    </div>
  );
};

