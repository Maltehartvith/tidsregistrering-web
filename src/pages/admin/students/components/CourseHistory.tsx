import { useActorLabel } from "@/domain/actor";
import { MutationFeedback } from "@/types/log";
import {
  coursesWithinTransferWindow,
  courseLabel,
  programName,
  targetsForStudent,
  totalsForStudent,
  totalsForStudentOnHold,
} from "@/domain/totals";
import { Student } from "@/types/user";
import { Check, Clock3, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import ChangeCourseCard from "./ChangeCourseCard";
import { Button } from "@/components/ui/Button";
import ToggleButton from "@/components/ui/ToggleButton";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { Selector } from "@/components/ui/Selector";
import SectionHeader from "@/pages/admin/students/components/SectionHeader";
import { useStudents } from "@/context/StudentsContext";
import { useCourses } from "@/context/CoursesContext";
import { useCatalog } from "@/context/CatalogContext";
import { useEntries } from "@/context/EntriesContext";

const CourseHistory = () => {
  const { selectedStudent, updateStudent: persistStudent } = useStudents();
  const { courses } = useCourses();
  const { CATEGORIES: categories, programs } = useCatalog();
  const { entries } = useEntries();
  const actor = useActorLabel();

  const [scope, setScope] = useState("uddannelse");
  const [confirmRemoveCourseId, setConfirmRemoveCourseId] = useState<
    string | null
  >(null);
  const [showMoveHold, setShowMoveHold] = useState(false);
  const [addcourseId, setAddcourseId] = useState("");

  if (!selectedStudent) return null;

  const studentEntries = entries.filter(
    (e) => e.studentId === selectedStudent.id,
  );

  const totalsWholeProgram = totalsForStudent(
    selectedStudent,
    studentEntries,
    categories,
  );
  const targetsWholeProgram = targetsForStudent(
    selectedStudent,
    courses,
    categories,
  );
  const totalsThisHold = totalsForStudentOnHold(
    selectedStudent,
    studentEntries,
    selectedStudent.courseId || "",
    categories,
  );
  const targetsThisHold =
    courses[selectedStudent.courseId || ""]?.targets || {};

  const includedLinks = (selectedStudent.courseLinks || []).filter(
    (l) => l.included,
  );
  const totals = scope === "hold" ? totalsThisHold : totalsWholeProgram;
  const targets = scope === "hold" ? targetsThisHold : targetsWholeProgram;
  const availableHoldsToAdd = coursesWithinTransferWindow(
    selectedStudent.courseId,
    courses,
  ).filter(
    (h) =>
      !(selectedStudent.courseLinks || []).some((l) => l.courseId === h.id),
  );

  const patchStudent = (
    patch: Partial<Student>,
    feedback?: MutationFeedback<Student> | null,
  ) => persistStudent(selectedStudent.id, patch, feedback);

  const addHoldLink = async () => {
    if (!addcourseId) return;
    const label = courses[addcourseId]?.label || addcourseId;
    await patchStudent(
      {
        courseLinks: [
          ...(selectedStudent.courseLinks || []),
          { courseId: addcourseId, included: true },
        ],
      },
      {
        toastSuccessMessage: `${label} tilføjet`,
        logArgs: {
          studentId: selectedStudent.id,
          description: `${actor} tilføjede ${label} til ${selectedStudent.name}s holdhistorik`,
        },
      },
    );
  };

  const removeCourseLink = async (courseId: string) => {
    const wasIncluded = (selectedStudent.courseLinks || []).some(
      (l) => l.courseId === courseId && l.included,
    );
    const hoursFromHold = wasIncluded
      ? studentEntries
          .filter((e) => e.courseId === courseId)
          .reduce((sum, e) => sum + Number(e.hours), 0)
      : 0;
    const label = courses[courseId]?.label || courseId;
    await patchStudent(
      {
        courseLinks: (selectedStudent.courseLinks || []).filter(
          (l) => l.courseId !== courseId,
        ),
      },
      {
        toastSuccessMessage: wasIncluded
          ? `Overførsel fjernet — ${hoursFromHold} timer trukket tilbage`
          : `${label} fjernet fra holdhistorik`,
        logArgs: {
          studentId: selectedStudent.id,
          description: wasIncluded
            ? `${actor} fjernede overførslen fra ${label} for ${selectedStudent.name} — ${hoursFromHold} timer blev trukket ud af regnskabet igen`
            : `${actor} fjernede ${label} fra ${selectedStudent.name}s holdhistorik`,
        },
      },
    );
    setConfirmRemoveCourseId(null);
  };

  const toggleCourseLink = async (courseId: string) => {
    const link = (selectedStudent.courseLinks || []).find(
      (l) => l.courseId === courseId,
    );
    const nowIncluded = !link?.included;
    const label = courses[courseId]?.label || courseId;
    await patchStudent(
      {
        courseLinks: (selectedStudent.courseLinks || []).map((l) =>
          l.courseId === courseId ? { ...l, included: nowIncluded } : l,
        ),
      },
      {
        logArgs: {
          studentId: selectedStudent.id,
          description: nowIncluded
            ? `${actor} lod timer fra ${label} tælle med for ${selectedStudent.name}`
            : `${actor} udelod timer fra ${label} for ${selectedStudent.name}`,
        },
      },
    );
  };

  return (
    <div>
      <SectionHeader icon={<Clock3 size={20} />} title="Holdhistorik" />
      <div className="mb-4 rounded-[14px] border border-border bg-card px-4.5 py-4">
        <p className="mb-3.5 text-[13px] leading-normal text-ink-soft">
          Kursister kan have gået på et andet hold eller kursus tidligere i
          uddannelsen. Her ses alle hold {selectedStudent.name} har været
          tilknyttet, og I kan bestemme hvilke af dem der skal tælle med i
          timeregnskabet. Kun hold oprettet inden for 5 år af{" "}
          {courses[selectedStudent.courseId].label} kan tilføjes, da uddannelsen
          forløber over op til 5 år.
        </p>

        <div className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0">
          <div>
            <div className="text-sm font-semibold" style={{ fontSize: 13 }}>
              {courses[selectedStudent.courseId].label} ·{" "}
              {courses[selectedStudent.courseId].startYear}
            </div>
            <div className="mt-px text-xs text-ink-soft">
              {programName(courses[selectedStudent.courseId], programs)
                ? `${programName(courses[selectedStudent.courseId], programs)} · `
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

        {(selectedStudent.courseLinks || []).map((link) => (
          <div
            className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0"
            key={link.courseId}
          >
            <div>
              <div className="text-sm font-semibold" style={{ fontSize: 13 }}>
                {courseLabel(link.courseId, courses)} ·{" "}
                {courses[link.courseId]?.startYear || ""}
              </div>
              <div className="mt-px text-xs text-ink-soft">
                {programName(courses[link.courseId], programs)
                  ? `${programName(courses[link.courseId], programs)} · `
                  : ""}
                {link.included
                  ? "Tæller med i regnskabet"
                  : "Vises i historik, tæller ikke med"}
              </div>
            </div>
            {confirmRemoveCourseId === link.courseId ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span>Fjern helt?</span>
                <Button
                  className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                  onClick={() => removeCourseLink(link.courseId)}
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
                  checked={link.included}
                  onChange={() => toggleCourseLink(link.courseId)}
                  size="sm"
                />
                <Button
                  onClick={() => setConfirmRemoveCourseId(link.courseId)}
                  variant="primaryIcon"
                  size="icon"
                  title="Fjern hold helt (fx hvis forkert hold blev tilknyttet)"
                >
                  <X size={14} />
                </Button>
              </div>
            )}
          </div>
        ))}

        {availableHoldsToAdd.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <div className="min-w-40">
              <Selector
                value={addcourseId}
                onChange={(e) => setAddcourseId(e.target.value)}
                options={availableHoldsToAdd.map(
                  (h) => `${h.label} · ${h.startYear}`,
                )}
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

      {includedLinks.length > 0 && (
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
          <Button
            variant={scope === "uddannelse" ? "primary" : "secondary"}
            size="small"
            onClick={() => setScope("uddannelse")}
          >
            Hele uddannelsen
          </Button>
          <Button
            variant={scope === "hold" ? "primary" : "secondary"}
            size="small"
            onClick={() => setScope("hold")}
          >
            Dette hold
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3 md:gap-3">
        {Object.values(categories).map((cat) => (
          <CategoryCard
            key={cat.key}
            label={cat.label}
            registered={totals[cat.key]}
            target={targets[cat.key]}
            color={cat.color}
          />
        ))}
      </div>
    </div>
  );
};

export default CourseHistory;
