import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Selector } from "@/components/ui/Selector";
import ToggleButton from "@/components/ui/ToggleButton";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import { useActorLabel } from "@/domain/actor";
import { activeCourseId } from "@/domain/userCourses";
import type { MutationFeedback } from "@/types/log";
import type { User, UserCourseWrite } from "@/types/user";
import { useState } from "react";

type ChangeCourseCardProps = {
  setShowMoveHold: (value: boolean) => void;
};

const ChangeCourseCard = ({ setShowMoveHold }: ChangeCourseCardProps) => {
  const { selectedStudent, updateStudent: persistStudent, isSaving } =
    useStudents();
  const { courses } = useCourses();
  const actor = useActorLabel();
  const [moveTargetId, setMoveTargetId] = useState("");
  const [moveKeepAsLink, setMoveKeepAsLink] = useState(true);

  const currentCourseId = selectedStudent
    ? activeCourseId(selectedStudent)
    : null;
  if (!selectedStudent || !currentCourseId) return null;

  const currentCourse = courses[currentCourseId];

  const patchStudent = (
    coursesWrite: UserCourseWrite[],
    feedback?: MutationFeedback<User> | null,
  ) => persistStudent(selectedStudent.id, { courses: coursesWrite }, feedback);

  const moveToHold = async () => {
    if (!moveTargetId || moveTargetId === currentCourse?.key) {
      setShowMoveHold(false);
      return;
    }
    const target = Object.values(courses).find((h) => h.key === moveTargetId);
    if (!target) return;
    const oldCourseId = currentCourseId;
    const oldCourseLabel =
      currentCourse?.label || currentCourse?.key || "det tidligere hold";
    const newCourseLabel = target.label || target.key;
    const rest = selectedStudent.courses.filter(
      (course) => course.id !== oldCourseId && course.id !== target.id,
    );
    const nextCourses: UserCourseWrite[] = [
      { id: target.id, active: true, included: true },
      ...(moveKeepAsLink
        ? [{ id: oldCourseId, active: false, included: true }]
        : []),
      ...rest.map((course) => ({
        id: course.id,
        active: false,
        included: course.included,
      })),
    ];
    await patchStudent(nextCourses, {
      toastSuccessMessage: `${selectedStudent.name} flyttet til ${newCourseLabel}`,
      logArgs: {
        userId: selectedStudent.id,
        description: moveKeepAsLink
          ? `${actor} flyttede ${selectedStudent.name} fra ${oldCourseLabel} til ${newCourseLabel} (${oldCourseLabel} beholdt som tidligere hold, timer tæller fortsat med)`
          : `${actor} flyttede ${selectedStudent.name} fra ${oldCourseLabel} til ${newCourseLabel} (${oldCourseLabel} fjernet helt, fx pga. fejlregistrering)`,
      },
    });
    setShowMoveHold(false);
    setMoveTargetId("");
    setMoveKeepAsLink(true);
  };

  return (
    <div className="mt-4 mb-1.5 rounded-xl border-[1.5px] border-dashed border-border p-3.5 bg-paper">
      <ToggleButton
        label={`Behold ${currentCourse?.label || "det nuværende hold"} som tidligere hold (timer tæller stadig med)`}
        checked={moveKeepAsLink}
        onChange={setMoveKeepAsLink}
        size="sm"
        className="flex cursor-pointer items-center justify-between text-[13px] font-semibold mb-1"
      />
      {!moveKeepAsLink && (
        <p
          className="mt-1 block text-[11px] text-ink-soft"
          style={{ color: "var(--secondary)" }}
        >
          {currentCourse?.label || "Det nuværende hold"} fjernes helt fra{" "}
          {selectedStudent.name}s historik — brug kun dette, hvis tilknytningen
          var en ren fejl.
        </p>
      )}
      <Field
        label="Flyt til hold"
        hint="Fx hvis kursisten ved en fejl er blevet tilknyttet det forkerte hold."
        className="mb-0"
      >
        <Selector
          value={moveTargetId}
          onChange={(e) => setMoveTargetId(e.target.value)}
          options={Object.values(courses)
            .filter((h) => h.id !== currentCourseId)
            .map((h) => ({ value: h.key, label: h.key }))}
          placeholder="Vælg hold…"
        />
      </Field>
      <div className="flex justify-end gap-2.5">
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            setShowMoveHold(false);
            setMoveTargetId("");
            setMoveKeepAsLink(true);
          }}
        >
          Annuller
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={moveToHold}
          disabled={!moveTargetId || isSaving}
          aria-busy={isSaving}
        >
          {isSaving ? "Flytter…" : "Flyt kursisten"}
        </Button>
      </div>
    </div>
  );
};

export default ChangeCourseCard;
