import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Selector } from "@/components/ui/Selector";
import ToggleButton from "@/components/ui/ToggleButton";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import { useActorLabel } from "@/domain/actor";
import { courseLabel } from "@/domain/totals";
import { activeCourseIds } from "@/domain/userCourses";
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
  const activeIds = selectedStudent ? activeCourseIds(selectedStudent) : [];
  const [fromCourseId, setFromCourseId] = useState(
    activeIds.length === 1 ? activeIds[0] : "",
  );
  const [moveTargetId, setMoveTargetId] = useState("");
  const [moveKeepAsLink, setMoveKeepAsLink] = useState(true);

  if (!selectedStudent || activeIds.length === 0) return null;

  const source = courses[fromCourseId];
  const sourceLabel = courseLabel(fromCourseId, courses);

  const patchStudent = (
    coursesWrite: UserCourseWrite[],
    feedback?: MutationFeedback<User> | null,
  ) => persistStudent(selectedStudent.id, { courses: coursesWrite }, feedback);

  const moveToHold = async () => {
    if (!fromCourseId || !moveTargetId || moveTargetId === fromCourseId) return;
    const target = courses[moveTargetId];
    if (!target) return;
    const newCourseLabel = target.label || target.key;
    const rest = selectedStudent.courses.filter(
      (course) => course.id !== fromCourseId && course.id !== target.id,
    );
    const nextCourses: UserCourseWrite[] = [
      { id: target.id, active: true, included: true },
      ...(moveKeepAsLink
        ? [{ id: fromCourseId, active: false, included: true }]
        : []),
      ...rest.map((course) => ({
        id: course.id,
        active: course.active,
        included: course.included,
      })),
    ];
    await patchStudent(nextCourses, {
      toastSuccessMessage: `${selectedStudent.name} flyttet til ${newCourseLabel}`,
      logArgs: {
        userId: selectedStudent.id,
        description: moveKeepAsLink
          ? `${actor} flyttede ${selectedStudent.name} fra ${sourceLabel} til ${newCourseLabel} (${sourceLabel} beholdt som tidligere hold, timer tæller fortsat med)`
          : `${actor} flyttede ${selectedStudent.name} fra ${sourceLabel} til ${newCourseLabel} (${sourceLabel} fjernet helt, fx pga. fejlregistrering)`,
      },
    });
    setShowMoveHold(false);
    setMoveTargetId("");
    setMoveKeepAsLink(true);
  };

  return (
    <div className="mt-4 mb-1.5 rounded-xl border-[1.5px] border-dashed border-border p-3.5 bg-paper">
      <Field label="Flyt fra hold" className="mb-3">
        {activeIds.length === 1 ? (
          <p className="text-[13px] font-semibold">{sourceLabel}</p>
        ) : (
          <Selector
            value={fromCourseId}
            onChange={(e) => {
              setFromCourseId(e.target.value);
              if (e.target.value === moveTargetId) setMoveTargetId("");
            }}
            options={activeIds.map((id) => ({
              value: id,
              label: courseLabel(id, courses),
            }))}
            placeholder="Vælg hold…"
          />
        )}
      </Field>
      <ToggleButton
        label={`Behold ${source?.label || "det valgte hold"} som tidligere hold (timer tæller stadig med)`}
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
          {sourceLabel} fjernes helt fra {selectedStudent.name}s historik — brug
          kun dette, hvis tilknytningen var en ren fejl.
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
            .filter((course) => course.id !== fromCourseId)
            .map((course) => ({
              value: course.id,
              label: course.label || course.key,
            }))}
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
          disabled={!fromCourseId || !moveTargetId || isSaving}
          aria-busy={isSaving}
        >
          {isSaving ? "Flytter…" : "Flyt kursisten"}
        </Button>
      </div>
    </div>
  );
};

export default ChangeCourseCard;
