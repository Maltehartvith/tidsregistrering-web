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
import { categoriesForCourseIds, categoryOf } from "@/domain/catalog";
import {
  programName,
  courseLabel,
  totalsForStudentOnHold,
  targetsForStudent,
  targetsForCourse,
  totalsForStudent,
} from "@/domain/totals";
import {
  activeCourseId,
  hasCourses,
  previousCourses,
} from "@/domain/userCourses";
import { useState } from "react";
import { useStudentOutlet } from "./StudentLayout";
import { Button } from "@/components/ui/Button";

export const OverviewTab = () => {
  const { student } = useStudentOutlet();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { contactEmail } = useBranding();
  const { entries, isLoading: entriesLoading } = useEntries();

  const {
    CATEGORIES,
    ALL_CATEGORIES,
    programs,
    isLoading: catalogLoading,
  } = useCatalog({ categories: true, programs: true });
  const homeCourseId = activeCourseId(student);
  const includedPrevious = previousCourses(student).filter(
    (course) => course.included,
  );

  const [scope, setScope] = useState("uddannelse");
  const totalsWholeProgram = totalsForStudent(student, entries, CATEGORIES);
  const targetsWholeProgram = targetsForStudent(
    student,
    courses,
    programs,
    CATEGORIES,
  );
  const homeCourse = homeCourseId ? courses[homeCourseId] : undefined;
  const includedCourses = [
    ...(homeCourseId
      ? student.courses.filter(
          (row) => row.id === homeCourseId && row.included,
        )
      : []),
    ...includedPrevious,
  ];
  const selectedCourseId = includedCourses.some((row) => row.id === scope)
    ? scope
    : null;
  const totals = selectedCourseId
    ? totalsForStudentOnHold(student, entries, selectedCourseId, CATEGORIES)
    : totalsWholeProgram;
  const targets = selectedCourseId
    ? targetsForCourse(courses[selectedCourseId], programs)
    : targetsWholeProgram;

  const myEntries = entries.filter((e) => e.userId === student.id);

  const recentEntries = [...myEntries]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  const course = homeCourse;
  const contactHref = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(`Henvendelse fra ${student.name} (${courseLabel(homeCourseId, courses)})`)}&body=${encodeURIComponent(
        `Hej\n\n[Skriv din besked her]\n\n---\nNavn: ${student.name}\nEmail: ${student.email}\nHold: ${courseLabel(homeCourseId, courses)}\nUddannelse: ${programName(course, programs) || "-"}\n`,
      )}`
    : "";

  const scopeCourseIds = selectedCourseId
    ? [selectedCourseId]
    : includedCourses.map((row) => row.id);
  const categoriesList = categoriesForCourseIds(
    scopeCourseIds,
    courses,
    programs,
    CATEGORIES,
  );
  const cardsLoading =
    (catalogLoading || coursesLoading) && categoriesList.length === 0;

  return (
    <>
      <div className="mb-4 rounded-md border border-border bg-card px-4.5 py-3.5">
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <div
              className="mb-1.5 block text-xs font-semibold text-ink-soft"
              style={{ marginBottom: 4 }}
            >
              Mit hold
            </div>
            {homeCourseId && coursesLoading && !course ? (
              <>
                <GhostBlock className="mb-1 h-4 w-40" />
                <GhostBlock className="h-3 w-28" />
              </>
            ) : course ? (
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
            ) : !hasCourses(student) ? (
              <p className="text-sm leading-normal text-ink-soft">
                Du er endnu ikke blevet tilskrevet et hold. Hvis dette er en
                fejl, bedes du kontakte din administrator
                {contactEmail ? (
                  <>
                    :{" "}
                    <a
                      className="underline underline-offset-2 hover:text-ink"
                      href={`mailto:${contactEmail}`}
                    >
                      {contactEmail}
                    </a>
                  </>
                ) : (
                  "."
                )}
              </p>
            ) : null}
          </div>
        </div>
        {includedPrevious.length > 0 && (
          <div className="mt-2.5 text-xs leading-normal text-ink-soft">
            Timer fra{" "}
            {includedPrevious
              .map((row) => courseLabel(row.id, courses))
              .join(", ")}{" "}
            tæller også med i dit regnskab.
          </div>
        )}
        {contactEmail && hasCourses(student) && (
          <a
            className="mt-2.5 inline-block text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
            href={contactHref}
          >
            Er noget forkert? Kontakt os
          </a>
        )}
      </div>

      {includedCourses.length > 1 && (
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
          <Button
            variant="pill"
            style={{
              background: selectedCourseId ? "var(--card)" : "var(--ink)",
              color: selectedCourseId ? "var(--ink)" : "var(--card)",
            }}
            onClick={() => setScope("uddannelse")}
          >
            Hele uddannelsen
          </Button>
          {includedCourses.map((row) => (
            <Button
              key={row.id}
              variant="pill"
              style={{
                background: scope === row.id ? "var(--ink)" : "var(--card)",
                color: scope === row.id ? "var(--card)" : "var(--ink)",
              }}
              onClick={() => setScope(row.id)}
            >
              {courseLabel(row.id, courses)}
            </Button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {cardsLoading ? (
          [0, 1, 2].map((i) => <CategoryCardGhost key={i} />)
        ) : categoriesList.length === 0 ? (
          <p className="col-span-full px-1 py-2 text-[13px] text-ink-soft">
            Ingen kategorier på de valgte hold.
          </p>
        ) : (
          categoriesList.map((cat) => (
            <CategoryCard
              key={cat.key}
              label={cat.label}
              registered={totals[cat.key]}
              target={targets[cat.key]}
              color={cat.color}
            />
          ))
        )}
      </div>
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
              <span className="min-w-0 flex-1 truncate">{cat.short}</span>
              <span className="shrink-0 font-mono text-[11px] text-ink-soft">
                {e.date}
              </span>
              <span className="shrink-0 font-mono font-semibold">
                {e.hours}t
              </span>
            </div>
          );
        })
      )}
    </>
  );
};
