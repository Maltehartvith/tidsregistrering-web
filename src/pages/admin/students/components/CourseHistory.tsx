import { useActorLabel } from "@/domain/actor";
import { categoriesForCourseIds } from "@/domain/catalog";
import type { MutationFeedback } from "@/types/log";
import {
  coursesWithinTransferWindow,
  courseLabel,
  programName,
  targetsForCourse,
  targetsForStudent,
  totalsForStudent,
  totalsForStudentOnHold,
} from "@/domain/totals";
import { activeCourseId, previousCourses } from "@/domain/userCourses";
import type { User, UserCourseWrite } from "@/types/user";
import { Check, Clock3, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import ChangeCourseCard from "./ChangeCourseCard";
import { Button } from "@/components/ui/Button";
import ToggleButton from "@/components/ui/ToggleButton";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { CategoryCardGhost } from "@/components/ui/Ghost";
import { Selector } from "@/components/ui/Selector";
import SectionHeader from "@/pages/admin/components/SectionHeader";
import { useStudents } from "@/context/StudentsContext";
import { useCourses } from "@/context/CoursesContext";
import { useCatalog } from "@/context/CatalogContext";
import { useEntries } from "@/context/EntriesContext";

const CourseHistory = () => {
  const { selectedStudent, updateStudent: persistStudent } = useStudents();
  const { courses, isLoading: coursesLoading } = useCourses();
  const {
    CATEGORIES: categories,
    programs,
    isLoading: catalogLoading,
  } = useCatalog({
    categories: true,
    programs: true,
  });
  const { entries } = useEntries();
  const actor = useActorLabel();

  const [scope, setScope] = useState("uddannelse");
  const [confirmRemoveCourseId, setConfirmRemoveCourseId] = useState<
    string | null
  >(null);
  const [showMoveHold, setShowMoveHold] = useState(false);
  const [addCourseId, setAddCourseId] = useState("");
  const [toggling, setToggling] = useState<{
    id: string;
    included: boolean;
  } | null>(null);

  if (!selectedStudent) return null;

  const homeCourseId = activeCourseId(selectedStudent);
  const currentCourse = homeCourseId ? courses[homeCourseId] : undefined;
  const previous = previousCourses(selectedStudent);

  const studentEntries = entries.filter((e) => e.userId === selectedStudent.id);

  const totalsWholeProgram = totalsForStudent(
    selectedStudent,
    studentEntries,
    categories,
  );
  const targetsWholeProgram = targetsForStudent(
    selectedStudent,
    courses,
    programs,
    categories,
  );
  const includedPrevious = previous.filter((course) => course.included);
  const includedCourses = [
    ...(homeCourseId
      ? selectedStudent.courses.filter(
          (course) => course.id === homeCourseId && course.included,
        )
      : []),
    ...includedPrevious,
  ];
  const selectedCourseId = includedCourses.some((course) => course.id === scope)
    ? scope
    : null;
  const totals = selectedCourseId
    ? totalsForStudentOnHold(
        selectedStudent,
        studentEntries,
        selectedCourseId,
        categories,
      )
    : totalsWholeProgram;
  const targets = selectedCourseId
    ? targetsForCourse(courses[selectedCourseId], programs)
    : targetsWholeProgram;
  const scopeCourseIds = selectedCourseId
    ? [selectedCourseId]
    : includedCourses.map((course) => course.id);
  const categoriesList = categoriesForCourseIds(
    scopeCourseIds,
    courses,
    programs,
    categories,
  );
  const cardsLoading =
    (catalogLoading || coursesLoading) && categoriesList.length === 0;
  const availableCoursesToAdd = coursesWithinTransferWindow(
    homeCourseId,
    courses,
  ).filter(
    (h) => !selectedStudent.courses.some((course) => course.id === h.id),
  );

  const patchCourses = (
    coursesWrite: UserCourseWrite[],
    feedback?: MutationFeedback<User> | null,
  ) => persistStudent(selectedStudent.id, { courses: coursesWrite }, feedback);

  const toWrite = (rows: typeof selectedStudent.courses): UserCourseWrite[] =>
    rows.map((course) => ({
      id: course.id,
      active: course.active,
      included: course.included,
    }));

  const addHoldLink = async () => {
    const hold = availableCoursesToAdd.find((h) => h.id === addCourseId);
    if (!hold) return;
    const label = hold.label;
    await patchCourses(
      [
        ...toWrite(selectedStudent.courses),
        { id: hold.id, active: false, included: true },
      ],
      {
        toastSuccessMessage: `${label} tilføjet`,
        logArgs: {
          userId: selectedStudent.id,
          description: `${actor} tilføjede ${label} til ${selectedStudent.name}s holdhistorik`,
        },
      },
    );
    setAddCourseId("");
  };

  const removeCourseLink = async (courseId: string) => {
    const row = previous.find((course) => course.id === courseId);
    const wasIncluded = Boolean(row?.included);
    const hoursFromHold = wasIncluded
      ? studentEntries
          .filter((e) => e.courseId === courseId)
          .reduce((sum, e) => sum + Number(e.hours), 0)
      : 0;
    const label = courses[courseId]?.label || courses[courseId]?.key || "Hold";
    await patchCourses(
      toWrite(
        selectedStudent.courses.filter((course) => course.id !== courseId),
      ),
      {
        toastSuccessMessage: wasIncluded
          ? `Overførsel fjernet — ${hoursFromHold} timer trukket tilbage`
          : `${label} fjernet fra holdhistorik`,
        logArgs: {
          userId: selectedStudent.id,
          description: wasIncluded
            ? `${actor} fjernede overførslen fra ${label} for ${selectedStudent.name} — ${hoursFromHold} timer blev trukket ud af regnskabet igen`
            : `${actor} fjernede ${label} fra ${selectedStudent.name}s holdhistorik`,
        },
      },
    );
    setConfirmRemoveCourseId(null);
  };

  const toggleCourseLink = async (courseId: string) => {
    if (toggling) return;
    const row = previous.find((course) => course.id === courseId);
    const nowIncluded = !row?.included;
    const label = courses[courseId]?.label || courses[courseId]?.key || "Hold";
    setToggling({ id: courseId, included: nowIncluded });
    try {
      await patchCourses(
        toWrite(
          selectedStudent.courses.map((course) =>
            course.id === courseId
              ? { ...course, included: nowIncluded }
              : course,
          ),
        ),
        {
          logArgs: {
            userId: selectedStudent.id,
            description: nowIncluded
              ? `${actor} lod timer fra ${label} tælle med for ${selectedStudent.name}`
              : `${actor} udelod timer fra ${label} for ${selectedStudent.name}`,
          },
        },
      );
    } finally {
      setToggling(null);
    }
  };

  return (
    <div>
      <SectionHeader
        icon={<Clock3 size={20} />}
        title="Holdhistorik"
        className="mb-2"
      />
      <div className="mb-4 rounded-lg border border-border bg-card px-4.5 py-4">
        <p className="mb-3.5 text-[13px] leading-normal text-ink-soft">
          Kursister kan have gået på et andet hold eller kursus tidligere i
          uddannelsen. Her ses alle hold {selectedStudent.name} har været
          tilknyttet, og I kan bestemme hvilke af dem der skal tælle med i
          timeregnskabet. Kun hold oprettet inden for 5 år af{" "}
          {currentCourse?.label || "Intet hold"} kan tilføjes, da uddannelsen
          forløber over op til 5 år.
        </p>

        <div className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0">
          <div>
            <div className="text-sm font-semibold" style={{ fontSize: 13 }}>
              {currentCourse?.label || "Intet hold"} ·{" "}
              {currentCourse?.startYear ?? ""}
            </div>
            <div className="mt-px text-xs text-ink-soft">
              {programName(currentCourse, programs)
                ? `${programName(currentCourse, programs)} · `
                : ""}
              Nuværende hold · tæller altid med
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-primary">
            Nuværende
          </span>
        </div>

        {showMoveHold ? (
          <ChangeCourseCard setShowMoveHold={setShowMoveHold} />
        ) : (
          <Button
            variant="link"
            className="mt-1"
            onClick={() => setShowMoveHold(true)}
          >
            Forkert hold tilknyttet? Flyt kursisten til et andet hold
          </Button>
        )}

        {previous.map((link) => {
          const included =
            toggling?.id === link.id ? toggling.included : link.included;
          const isToggling = toggling?.id === link.id;

          return (
            <div
              className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0"
              key={link.id}
            >
              <div>
                <div className="text-sm font-semibold" style={{ fontSize: 13 }}>
                  {courseLabel(link.id, courses)} ·{" "}
                  {courses[link.id]?.startYear || ""}
                </div>
                <div className="mt-px text-xs text-ink-soft">
                  {programName(courses[link.id], programs)
                    ? `${programName(courses[link.id], programs)} · `
                    : ""}
                  {included
                    ? "Tæller med i regnskabet"
                    : "Vises i historik, tæller ikke med"}
                </div>
              </div>
              {confirmRemoveCourseId === link.id ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <span>Fjern helt?</span>
                  <Button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => removeCourseLink(link.id)}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => setConfirmRemoveCourseId(null)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ToggleButton
                    checked={included}
                    loading={isToggling}
                    onChange={() => toggleCourseLink(link.id)}
                    size="sm"
                  />
                  <Button
                    onClick={() => setConfirmRemoveCourseId(link.id)}
                    variant="primaryIcon"
                    size="icon"
                    title="Fjern hold helt (fx hvis forkert hold blev tilknyttet)"
                    disabled={isToggling}
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {availableCoursesToAdd.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <div className="min-w-40">
              <Selector
                value={addCourseId}
                onChange={(e) => setAddCourseId(e.target.value)}
                options={availableCoursesToAdd.map((h) => ({
                  value: h.id,
                  label: `${h.label} · ${h.startYear}`,
                }))}
                position="left"
              />
            </div>

            <Button variant="primary" size="small" onClick={addHoldLink}>
              <PlusCircle size={14} /> Tilføj eksisterende hold
            </Button>
          </div>
        ) : (
          <p
            className="mt-1 block text-[11px] text-ink-soft"
            style={{ marginTop: 10 }}
          >
            Ingen flere hold inden for 5-års-vinduet at tilføje.
          </p>
        )}
      </div>

      {includedCourses.length > 1 && (
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
          <Button
            variant={selectedCourseId ? "secondary" : "primary"}
            size="small"
            onClick={() => setScope("uddannelse")}
          >
            Hele uddannelsen
          </Button>
          {includedCourses.map((course) => (
            <Button
              key={course.id}
              variant={scope === course.id ? "primary" : "secondary"}
              size="small"
              onClick={() => setScope(course.id)}
            >
              {courseLabel(course.id, courses)}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3 md:gap-3">
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
    </div>
  );
};

export default CourseHistory;
