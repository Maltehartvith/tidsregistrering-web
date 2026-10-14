import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Selector } from "@/components/ui/Selector";
import ToggleButton from "@/components/ui/ToggleButton";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import { useActorLabel } from "@/domain/actor";
import { MutationFeedback } from "@/types/log";
import { Student } from "@/types/user";
import { useState } from "react";

type ChangeCourseCardProps = {
  setShowMoveHold: (value: boolean) => void;
};

const ChangeCourseCard = ({ setShowMoveHold }: ChangeCourseCardProps) => {
  const { selectedStudent, updateStudent: persistStudent } = useStudents();
  const { courses } = useCourses();
  const actor = useActorLabel();
  const [moveTargetId, setMoveTargetId] = useState("");
  const [moveKeepAsLink, setMoveKeepAsLink] = useState(true);

  if (!selectedStudent) return null;

  const patchStudent = (
    patch: Partial<Student>,
    feedback?: MutationFeedback<Student> | null,
  ) => persistStudent(selectedStudent.id, patch, feedback);

  const moveToHold = async () => {
    if (!moveTargetId || moveTargetId === selectedStudent.courseId) {
      setShowMoveHold(false);
      return;
    }
    const oldcourseId = selectedStudent.courseId;
    const oldHoldLabel = courses[oldcourseId]?.label || oldcourseId;
    const newHoldLabel = courses[moveTargetId]?.label || moveTargetId;
    const restOfLinks = (selectedStudent.courseLinks || []).filter(
      (l) => l.courseId !== oldcourseId && l.courseId !== moveTargetId,
    );
    const newLinks = moveKeepAsLink
      ? [...restOfLinks, { courseId: oldcourseId, included: true }]
      : restOfLinks;
    await patchStudent(
      { courseLinks: newLinks },
      {
        toastSuccessMessage: `${selectedStudent.name} flyttet til ${newHoldLabel}`,
        logArgs: {
          studentId: selectedStudent.id,
          description: moveKeepAsLink
            ? `${actor} flyttede ${selectedStudent.name} fra ${oldHoldLabel} til ${newHoldLabel} (${oldHoldLabel} beholdt som tidligere hold, timer tæller fortsat med)`
            : `${actor} flyttede ${selectedStudent.name} fra ${oldHoldLabel} til ${newHoldLabel} (${oldHoldLabel} fjernet helt, fx pga. fejlregistrering)`,
        },
      },
    );
    setShowMoveHold(false);
    setMoveTargetId("");
    setMoveKeepAsLink(true);
  };

  return (
    <div className="mt-4 mb-1.5 rounded-xl border-[1.5px] border-dashed border-border p-3.5 bg-paper">
      <ToggleButton
        label={`Behold ${courses[selectedStudent.courseId].label} som tidligere hold (timer tæller stadig med)`}
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
          {courses[selectedStudent.courseId].label} fjernes helt fra{" "}
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
            .filter((h) => h.id !== selectedStudent.courseId)
            .map((h) => h.id)}
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
          disabled={!moveTargetId}
        >
          Flyt kursisten
        </Button>
      </div>
    </div>
  );
};

export default ChangeCourseCard;
