import { CategoryCard } from "@/components/ui/CategoryCard";
import {
  CategoryCardGhost,
  EntryRowGhost,
  GhostBlock,
} from "@/components/ui/Ghost";
import { ScopeBar } from "@/components/ui/ScopeBar";
import { useBranding } from "@/context/BrandingContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { categoriesForCourseIds, categoryOf } from "@/domain/catalog";
import {
  choiceById,
  courseIdsForChoice,
  scopeChoices,
  targetsForChoice,
  totalsForChoice,
} from "@/domain/hourScope";
import {
  courseLabel,
  educationName,
  educationPlace,
} from "@/domain/totals";
import { activeCourseIds, hasCourses } from "@/domain/userCourses";
import { useEntryPage } from "@/hooks/entries";
import { useState } from "react";
import { useStudentOutlet } from "./StudentLayout";

export const OverviewTab = () => {
  const { student } = useStudentOutlet();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { contactEmail } = useBranding();
  const {
    CATEGORIES,
    ALL_CATEGORIES,
    educations,
    isLoading: catalogLoading,
  } = useCatalog({ categories: true, educations: true });
  const loggingCourses = activeCourseIds(student)
    .map((id) => courses[id])
    .filter((course) => Boolean(course));
  const choices = scopeChoices(student, courses, educations);
  const [scope, setScope] = useState("");
  const selectedId = choices.some((choice) => choice.id === scope)
    ? scope
    : (choices[0]?.id ?? "");
  const choice = choiceById(choices, selectedId);
  const recent = useEntryPage({
    userId: student.id,
    page: 1,
    pageSize: 3,
    courseId: choice?.kind === "course" ? choice.courseId : undefined,
  });
  const totals = totalsForChoice(student, choice, courses, CATEGORIES);
  const targets = targetsForChoice(choice, courses, educations);
  const scopeCourseIds = courseIdsForChoice(student, choice, courses);
  const categoriesList = categoriesForCourseIds(
    scopeCourseIds,
    courses,
    educations,
    CATEGORIES,
  );
  const cardsLoading =
    (catalogLoading || coursesLoading) && categoriesList.length === 0;
  const courseNames = loggingCourses
    .map((course) => courseLabel(course.id, courses))
    .join(", ");
  const contactHref = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(`Henvendelse fra ${student.name} (${courseNames || "intet hold"})`)}&body=${encodeURIComponent(
        `Hej\n\n[Skriv din besked her]\n\n---\nNavn: ${student.name}\nEmail: ${student.email}\nHold: ${courseNames || "-"}\n`,
      )}`
    : "";

  return (
    <>
      <div className="mb-4 rounded-md border border-border bg-card px-4.5 py-3.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="mb-1.5 block text-xs font-semibold text-ink-soft">
              {loggingCourses.length > 1 ? "Mine hold" : "Mit hold"}
            </div>
            {coursesLoading && loggingCourses.length === 0 && hasCourses(student) ? (
              <>
                <GhostBlock className="mb-1 h-4 w-40" />
                <GhostBlock className="h-3 w-28" />
              </>
            ) : loggingCourses.length > 0 ? (
              <div className="flex flex-col gap-2">
                {loggingCourses.map((course) => (
                  <div key={course.id}>
                    <div className="text-sm font-semibold">
                      {course.label} · {course.startYear}
                    </div>
                    {(educationName(course, educations) ||
                      educationPlace(course, educations)) && (
                      <div className="mt-px text-xs text-ink-soft">
                        {[
                          educationName(course, educations),
                          educationPlace(course, educations),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
        {contactEmail && hasCourses(student) && (
          <a
            className="mt-2.5 inline-block text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
            href={contactHref}
          >
            Er noget forkert? Kontakt os
          </a>
        )}
      </div>

      <ScopeBar choices={choices} value={selectedId} onChange={setScope} />
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
      {recent.isLoading && recent.data.items.length === 0 ? (
        [0, 1, 2].map((i) => <EntryRowGhost key={i} />)
      ) : recent.data.items.length === 0 ? (
        <div className="px-2.5 py-10 text-center text-[13px] text-ink-soft">
          Ingen registreringer endnu.
        </div>
      ) : (
        recent.data.items.map((e) => {
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
              <span className="shrink-0 text-xs text-ink-soft">
                {courseLabel(e.courseId, courses)}
              </span>
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
