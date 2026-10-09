import { CategoryCard } from "@/components/ui/CategoryCard";
import {
  CategoryCardGhost,
  EntryRowGhost,
  GhostBlock,
} from "@/components/ui/Ghost";
import { useBranding } from "@/context/BrandingContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useEntries } from "@/context/EntriesContext";
import { categoryOf } from "@/domain/catalog";
import {
  programName,
  holdLabel,
  totalsForStudentOnHold,
  targetsForStudent,
  totalsForStudent,
} from "@/domain/totals";
import { useState } from "react";
import { useStudentOutlet } from "./StudentLayout";

export const OverviewTab = () => {
  const { student } = useStudentOutlet();
  const { courses } = useCourses();
  const { contactEmail } = useBranding();
  const { entries, isLoading: entriesLoading } = useEntries();

  const {
    CATEGORIES,
    ALL_CATEGORIES,
    programs,
    isLoading: catalogLoading,
  } = useCatalog();
  const includedLinks = (student.courseLinks || []).filter((l) => l.included);

  const [scope, setScope] = useState("uddannelse");
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

  const myEntries = entries.filter((e) => e.studentId === student.id);

  const recentEntries = [...myEntries]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  const course = courses[student.courseId];
  const contactHref = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(`Henvendelse fra ${student.name} (${holdLabel(student.courseId, courses)})`)}&body=${encodeURIComponent(
        `Hej\n\n[Skriv din besked her]\n\n---\nNavn: ${student.name}\nEmail: ${student.email}\nHold: ${holdLabel(student.courseId, courses)}\nUddannelse: ${programName(course, programs) || "-"}\n`,
      )}`
    : "";

  const categoriesList = Object.values(CATEGORIES);

  return (
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
            {course ? (
              <>
                <div className="text-sm font-semibold" style={{ fontSize: 15 }}>
                  {course.label} · {course.startYear}
                </div>
                {programName(course, programs) && (
                  <div className="mt-px text-xs text-ink-soft">
                    {programName(course, programs)}
                  </div>
                )}
              </>
            ) : (
              <>
                <GhostBlock className="mb-1 h-4 w-40" />
                <GhostBlock className="h-3 w-28" />
              </>
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
        {contactEmail && (
          <a
            className="mt-2.5 inline-block text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
            href={contactHref}
          >
            Er noget forkert? Kontakt os
          </a>
        )}
      </div>

      {includedLinks.length > 0 && (
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
          <button
            className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
            style={{
              background: scope === "uddannelse" ? "var(--ink)" : "var(--card)",
              color: scope === "uddannelse" ? "var(--card)" : "var(--ink)",
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

      {catalogLoading && categoriesList.length === 0
        ? [0, 1, 2].map((i) => <CategoryCardGhost key={i} />)
        : categoriesList.map((cat) => (
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
      {entriesLoading && recentEntries.length === 0 ? (
        [0, 1, 2].map((i) => <EntryRowGhost key={i} />)
      ) : recentEntries.length === 0 ? (
        <div className="px-2.5 py-10 text-center text-[13px] text-ink-soft">
          Ingen registreringer endnu.
        </div>
      ) : (
        recentEntries.map((e) => {
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
              <span className="ml-auto font-mono font-semibold">{e.hours}t</span>
            </div>
          );
        })
      )}
    </>
  );
};
