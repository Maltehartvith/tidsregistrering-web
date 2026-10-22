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
import { categoriesForCourseIds } from "@/domain/catalog";
import { downloadCourseStudentsExcel } from "@/domain/exportStudents";
import { educationScopeId, targetsForChoice } from "@/domain/hourScope";
import { totalsForCourses, targetsForCourse } from "@/domain/totals";
import {
  activeCourseIds,
  includedCourseIds,
} from "@/domain/userCourses";
import { formatDiff } from "@/domain/format";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { GhostBlock } from "@/components/ui/Ghost";
import Input from "@/components/ui/Input";

export function StudentList() {
  const { CATEGORIES, educations } = useCatalog({
    categories: true,
    educations: true,
  });
  const { courses, isLoading: isCoursesLoading } = useCourses();
  const {
    students,
    selectedStudent,
    setSelectedStudent,
    isLoading: isStudentsLoading,
  } = useStudents();
  const [educationFilter, setEducationFilter] = useState("alle");
  const [holdFilter, setHoldFilter] = useState("alle");
  const [query, setQuery] = useState("");
  const { showToast } = useToast();

  const visibleCourses = Object.values(courses || {}).filter(
    (course) =>
      educationFilter === "alle" || course.educationId === educationFilter,
  );

  const studentMatchesEducation = (s: (typeof students)[number]) =>
    educationFilter === "alle" ||
    s.courses.some(
      (course) => courses?.[course.id]?.educationId === educationFilter,
    );

  const filtered = students
    .filter(studentMatchesEducation)
    .filter(
      (s) =>
        holdFilter === "alle" ||
        s.courses.some((course) => course.id === holdFilter),
    )
    .filter((s) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const courseLabelText = activeCourseIds(s)
        .map((id) => courses?.[id]?.label || courses?.[id]?.key || "")
        .join(" ")
        .toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        courseLabelText.includes(q)
      );
    });

  const isLoading = isCoursesLoading || isStudentsLoading;
  const exportCourseLabel = [
    educationFilter === "alle"
      ? ""
      : educations[educationFilter]?.name,
    holdFilter === "alle" ? "alle hold" : courses?.[holdFilter]?.label,
  ]
    .filter(Boolean)
    .join(" · ");
  const exportLabel = `Eksporter ${exportCourseLabel} til Excel`;
  const canExport =
    visibleCourses.length > 0 &&
    (holdFilter === "alle" ||
      visibleCourses.some((course) => course.id === holdFilter));

  const handleExport = () => {
    if (!canExport) return;
    void downloadCourseStudentsExcel({
      courseId: holdFilter,
      educationId: educationFilter,
      students: filtered,
      courses: courses || {},
      educations,
      categories: CATEGORIES,
    }).catch(() => {
      showToast("Kunne ikke lave Excel-filen.", 4000, "error");
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 pt-1">
      {isLoading ? (
        <div className="flex flex-col gap-2 pr-4">
          <GhostBlock className="h-8.5 w-64" />
          <GhostBlock className="h-9.5 w-full" />
          <div className="flex gap-2 ">
            <GhostBlock className="h-8.5 w-20 rounded-full!" />
            <GhostBlock className="h-8.5 w-16 rounded-full!" />
            <GhostBlock className="h-8.5 w-20 rounded-full!" />
            <GhostBlock className="h-8.5 w-16 rounded-full!" />
          </div>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex gap-2">
              <GhostBlock className="h-29 w-full rounded-xl!" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 pr-4">
            <span className="block min-w-0 max-w-full" title={exportLabel}>
              <Button
                variant="primary"
                size="small"
                disabled={!canExport}
                className="w-full"
                onClick={handleExport}
              >
                <FileSpreadsheet size={14} className="shrink-0" />
                <div className="flex min-w-0 items-center">
                  <span className="shrink-0">Eksporter&nbsp;</span>
                  <span className="min-w-0 truncate">{exportCourseLabel}</span>
                  <span className="shrink-0">&nbsp;til Excel</span>
                </div>
              </Button>
            </span>

            <Input
              icon={<Search size={15} />}
              type="text"
              placeholder="Søg på navn, email eller hold..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="flex flex-wrap gap-1">
              <Button
                variant={educationFilter === "alle" ? "primary" : "secondary"}
                onClick={() => {
                  setEducationFilter("alle");
                  setHoldFilter("alle");
                }}
                className="rounded-full! px-3! py-2! text-xs!"
              >
                Alle uddannelser
              </Button>
              {Object.values(educations).map((education) => (
                <Button
                  key={education.id}
                  variant={
                    educationFilter === education.id ? "primary" : "secondary"
                  }
                  className="rounded-full! px-3! py-2! text-xs!"
                  onClick={() => {
                    setEducationFilter(education.id);
                    setHoldFilter("alle");
                  }}
                >
                  {education.name}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                variant={holdFilter === "alle" ? "primary" : "secondary"}
                onClick={() => setHoldFilter("alle")}
                className="rounded-full! px-3! py-2! text-xs!"
              >
                Alle hold
              </Button>
              {visibleCourses.map((h) => (
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
          <div className="scrollbar-bottom-margin mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
            {filtered.map((s) => {
              const viewCourseIds =
                holdFilter !== "alle"
                  ? [holdFilter]
                  : educationFilter !== "alle"
                    ? s.courses
                        .filter(
                          (course) =>
                            course.included &&
                            courses?.[course.id]?.educationId === educationFilter,
                        )
                        .map((course) => course.id)
                    : includedCourseIds(s);
              const totals = totalsForCourses(s, viewCourseIds, CATEGORIES);
              const educationIds = [
                ...new Set(
                  viewCourseIds
                    .map((id) => courses?.[id]?.educationId)
                    .filter((id): id is string => Boolean(id)),
                ),
              ];
              const targets =
                viewCourseIds.length === 1
                  ? targetsForCourse(courses?.[viewCourseIds[0]], educations)
                  : educationIds.length === 1
                    ? targetsForChoice(
                        {
                          id: educationScopeId(educationIds[0]),
                          label: "Hele uddannelsen",
                          kind: "education",
                          educationId: educationIds[0],
                        },
                        courses || {},
                        educations,
                        s,
                      )
                    : {};
              const studentCategories = categoriesForCourseIds(
                viewCourseIds,
                courses || {},
                educations,
                CATEGORIES,
              );
              const courseNames = activeCourseIds(s)
                .map((id) => courses?.[id]?.label || courses?.[id]?.key)
                .filter(Boolean)
                .join(", ");
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
                      {courseNames ? ` · ${courseNames}` : ""}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {studentCategories.map((c) => {
                        const goal = targets[c.key];
                        if (typeof goal !== "number") return null;
                        const diff = totals[c.key] - goal;
                        return (
                          <span
                            key={c.key}
                            className="flex items-center gap-1 font-mono text-[11px] font-semibold"
                            style={{
                              color:
                                diff < 0 ? "var(--deficit)" : "var(--surplus)",
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
                  <div className="flex items-center gap-1">
                    {s.courses.some((course) => !course.active && course.included) && (
                      <ArrowRightLeft
                        size={14}
                        className="shrink-0 text-secondary"
                        aria-label="Timeoverførsel aktiv"
                      />
                    )}
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-ink-soft"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
