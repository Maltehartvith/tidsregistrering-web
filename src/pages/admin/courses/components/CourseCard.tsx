import { useLayoutEffect, useState } from "react";
import { readRosterFile } from "@/domain/readRosterFile";
import {
  PlusCircle,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ArrowRightLeft,
  Upload,
  Plus,
} from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import { useUsers } from "@/context/UsersContext";
import { formatTargets } from "@/domain/catalog";
import {
  coursesWithinTransferWindow,
  educationName,
  hoursOnCourse,
  targetsForCourse,
} from "@/domain/totals";
import {
  isActiveOnCourse,
  isEnrolledOnCourse,
  previousCourses,
  staffCourseIds,
  staffCoursesWrite,
  staffHasCourseAccess,
} from "@/domain/userCourses";
import { ADMIN_ROLES } from "@/data/constants";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import ToggleButton from "@/components/ui/ToggleButton";
import type { User as AppUser, UserCourseWrite } from "@/types/user";
import { useActorLabel } from "@/domain/actor";
import { useAuth } from "@/context/AuthContext";
import { isAdministrator } from "@/api/queryKeys";
import { useApplyRoster, usePreviewRoster } from "@/hooks/courses";
import { withFeedback } from "@/hooks/queryHelpers";
import { useActionFeedback } from "@/hooks/queryHelpers";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import type { RosterPersonInput, RosterPlan } from "@/api/courses";
import { Selector } from "@/components/ui/Selector";
import { educationKeyFromName } from "@/pages/admin/courses/components/ProgramsSection";
import {
  CourseGoalFields,
  ProgramCategoryFields,
} from "@/pages/admin/courses/components/ProgramCategoryFields";

const NEW_PROGRAM = {
  value: "__new__",
  label: "+ Opret ny uddannelse…",
} as const;

type CourseCardProps = {
  courseId: string;
  isOpen: boolean;
  onToggle: () => void;
};

type NewStudentRow = { name: string; email: string };

export function CourseCard({ courseId, isOpen, onToggle }: CourseCardProps) {
  const actor = useActorLabel();
  const { user } = useAuth();
  const recordFeedback = useActionFeedback();
  const {
    CATEGORIES,
    educations,
    createEducation: createEducationApi,
    isSaving: catalogSaving,
  } = useCatalog({
    categories: true,
    educations: true,
  });
  const {
    courses,
    updateCourse,
    deleteCourse: deleteCourseApi,
    isSaving: courseSaving,
  } = useCourses();
  const isSaving = catalogSaving || courseSaving;
  const { students, updateStudent } = useStudents();
  const { adminUsers, updateUser } = useUsers();

  const [draftOn, setDraftOn] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const previewRoster = usePreviewRoster();
  const applyRoster = useApplyRoster();
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [newStudentRows, setNewStudentRows] = useState<NewStudentRow[]>([
    { name: "", email: "" },
  ]);
  const [addError, setAddError] = useState("");
  const [importPlan, setImportPlan] = useState<RosterPlan | null>(null);
  const [importPeople, setImportPeople] = useState<RosterPersonInput[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<
    string | null
  >(null);
  const [confirmRemoveCourseId, setConfirmRemoveCourseId] = useState<
    string | null
  >(null);
  const [editProgramId, setEditProgramId] = useState("");
  const [newProgramName, setNewProgramName] = useState("");
  const [programError, setProgramError] = useState("");
  const [transferSourceId, setTransferSourceId] = useState("");
  const [editTargets, setEditTargets] = useState<Record<string, number>>({});
  const [addUserId, setAddUserId] = useState<string | null>(null);
  const [confirmTransferRoster, setConfirmTransferRoster] = useState(false);

  // Reset the panel's local state every time the card is opened.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const course = courses[courseId];
    setDraftOn(false);
    setDraftFrom(coursesWithinTransferWindow(courseId, courses)[0]?.id || "");
    setEditProgramId(
      course?.educationId || Object.values(educations)[0]?.id || NEW_PROGRAM.value,
    );
    setNewProgramName("");
    setProgramError("");
    setEditTargets({ ...targetsForCourse(course, educations) });
    setAddUserId("");
    setTransferSourceId("");
    setConfirmTransferRoster(false);
    // Only on open/close — not on every catalog/course change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const h = courses[courseId];
  if (!h) return null;
  const canEditCourse =
    isAdministrator(user?.role) || h.createdByUserId === user?.id;

  const programOptions = Object.values(educations).map((education) => ({
    value: education.id,
    label: education.name,
  }));
  const creatingNewProgram = editProgramId === NEW_PROGRAM.value;
  const selectedProgram = creatingNewProgram
    ? null
    : (educations[editProgramId] ?? null);

  const coursesToWrite = (rows: AppUser["courses"]): UserCourseWrite[] =>
    rows.map((course) => ({
      id: course.id,
      active: course.active,
      included: course.included,
    }));

  const saveCourseProgram = async () => {
    const course = courses[courseId];
    if (!course) return;

    let programId = selectedProgram?.id ?? null;
    let programLabel = selectedProgram?.name ?? "";
    let createdEducation = false;

    if (creatingNewProgram || !programId) {
      createdEducation = true;
      const trimmed = newProgramName.trim();
      if (!trimmed) {
        setProgramError("Angiv et navn til den nye uddannelse.");
        return;
      }
      const programKey = educationKeyFromName(trimmed);
      if (
        Object.values(educations).some(
          (education) =>
            education.key === programKey ||
            education.name.toLowerCase() === trimmed.toLowerCase(),
        )
      ) {
        setProgramError("Der findes allerede en uddannelse med det navn.");
        return;
      }
      const createdProgram = await createEducationApi(
        { key: programKey, name: trimmed, targets: editTargets },
        {
          logArgs: {
            description: `${actor} oprettede uddannelsen "${trimmed}" med totalmål ${formatTargets(editTargets, CATEGORIES)}`,
          },
        },
      );
      programId = createdProgram.id;
      programLabel = createdProgram.name;
      setEditProgramId(createdProgram.id);
      setNewProgramName("");
    }

    setProgramError("");
    await updateCourse(
      courseId,
      { educationId: programId, targets: editTargets },
      {
        toastSuccessMessage: createdEducation
          ? `Uddannelse oprettet, og delmål gemt for ${course.label}`
          : `Holdets delmål gemt for ${course.label}`,
        logArgs: {
          courseId,
          description: createdEducation
            ? `${actor} satte ${course.label} til den nye uddannelse "${programLabel}" med delmål ${formatTargets(editTargets, CATEGORIES)}`
            : `${actor} satte ${course.label}s delmål under "${programLabel}" til ${formatTargets(editTargets, CATEGORIES)}`,
        },
      },
    );
  };

  const transferRoster = async () => {
    if (!transferSourceId) return;
    const sourceCourseId = transferSourceId;
    const targetCourseId = courseId;
    const sourceLabel = courses[sourceCourseId].label;
    const targetLabel = courses[targetCourseId].label;
    const moved = students.filter((s) => isActiveOnCourse(s, sourceCourseId));
    await Promise.all(
      moved.map((s) => {
        const rest = s.courses.filter(
          (course) =>
            course.id !== sourceCourseId && course.id !== targetCourseId,
        );
        return updateStudent(s.id, {
          courses: [
            { id: targetCourseId, active: true, included: true },
            { id: sourceCourseId, active: false, included: true },
            ...rest.map((course) => ({
              id: course.id,
              active: course.active,
              included: course.included,
            })),
          ],
        });
      }),
    );
    recordFeedback({
      toastSuccessMessage: `${moved.length} kursister overført til ${targetLabel}`,
      logArgs: {
        courseId: targetCourseId,
        description: `${actor} overførte ${moved.length} kursister fra ${sourceLabel} til ${targetLabel} (timer fra ${sourceLabel} tæller fortsat med)`,
      },
    });
    setTransferSourceId("");
    setConfirmTransferRoster(false);
  };

  const addUserToCourse = async () => {
    if (!addUserId) return;
    const user = adminUsers.find((u) => u.id === addUserId);
    if (!user || staffHasCourseAccess(user, courseId)) {
      setAddUserId("");
      return;
    }
    await updateUser(
      user.id,
      {
        courses: staffCoursesWrite([...staffCourseIds(user), courseId]),
      },
      {
        toastSuccessMessage: `${user.name} har nu adgang til ${courses[courseId].label}`,
        logArgs: {
          courseId,
          description: `${actor} gav ${user.name} (${ADMIN_ROLES[user.role]?.label || user.role}) adgang til ${courses[courseId].label}`,
        },
      },
    );
    setAddUserId("");
  };

  const removeUserFromCourse = async (userId: string) => {
    const user = adminUsers.find((u) => u.id === userId);
    await updateUser(
      userId,
      {
        courses: staffCoursesWrite(
          (user ? staffCourseIds(user) : []).filter((id) => id !== courseId),
        ),
      },
      {
        toastSuccessMessage: `${user?.name} har ikke længere adgang til ${courses[courseId].label}`,
        logArgs: {
          courseId,
          description: `${actor} fjernede ${user?.name}s adgang til ${courses[courseId].label}`,
        },
      },
    );
  };

  const deleteCourse = async () => {
    const currentMembers = students.filter(
      (s) => isEnrolledOnCourse(s, courseId),
    );
    if (currentMembers.length > 0) return;
    const holdBeingDeleted = courses[courseId];
    const linkedElsewhere = students.filter((s) =>
      s.courses.some((course) => course.id === courseId),
    ).length;
    await deleteCourseApi(courseId);
    await Promise.all(
      adminUsers
        .filter((u) => !u.allCourses && staffHasCourseAccess(u, courseId))
        .map((u) =>
          updateUser(u.id, {
            courses: staffCoursesWrite(
              staffCourseIds(u).filter((id) => id !== courseId),
            ),
          }),
        ),
    );
    recordFeedback({
      toastSuccessMessage: `${holdBeingDeleted.label} slettet`,
      logArgs: {
        description: `${actor} slettede ${holdBeingDeleted.label} permanent — jf. GDPR${
          linkedElsewhere > 0
            ? `. ${linkedElsewhere} kursist(er) på andre hold har fortsat gyldige timer herfra; holdnavnet vises nu som "(slettet)" i deres historik`
            : ""
        }`,
      },
    });
    onToggle();
    setConfirmDeleteCourseId(null);
  };

  const applyToCourse = async () => {
    const members = students.filter((s) => isActiveOnCourse(s, courseId));
    await Promise.all(
      members.map((s) => {
        const existing = s.courses;
        if (draftOn) {
          const already = existing.some((course) => course.id === draftFrom);
          const updated = already
            ? existing.map((course) =>
                course.id === draftFrom
                  ? { ...course, included: true }
                  : course,
              )
            : [
                ...existing,
                {
                  id: draftFrom,
                  active: false,
                  included: true,
                  categories: [],
                },
              ];
          return updateStudent(s.id, { courses: coursesToWrite(updated) });
        }
        return updateStudent(s.id, {
          courses: coursesToWrite(
            existing.map((course) =>
              course.id === draftFrom ? { ...course, included: false } : course,
            ),
          ),
        });
      }),
    );
    recordFeedback({
      toastSuccessMessage: draftOn
        ? `Anvendt på ${members.length} kursister i ${courses[courseId].label}`
        : `Slået fra for ${members.length} kursister i ${courses[courseId].label}`,
      logArgs: {
        courseId,
        description: draftOn
          ? `${actor} anvendte timeoverførsel fra ${courses[draftFrom]?.label || courses[draftFrom]?.key || "et hold"} på hele ${courses[courseId].label} (${members.length} kursister)`
          : `${actor} slog timeoverførsel fra ${courses[draftFrom]?.label || courses[draftFrom]?.key || "et hold"} fra for hele ${courses[courseId].label} (${members.length} kursister)`,
      },
    });
    onToggle();
  };

  const removeFromCourse = async (fromCourseId: string) => {
    let hoursWithdrawnTotal = 0;
    let affectedCount = 0;
    const members = students.filter((s) => isActiveOnCourse(s, courseId));
    await Promise.all(
      members.map((s) => {
        const existing = s.courses;
        const link = existing.find((course) => course.id === fromCourseId);
        if (!link) return Promise.resolve();
        affectedCount += 1;
        if (link.included) {
          hoursWithdrawnTotal += hoursOnCourse(s, fromCourseId);
        }
        return updateStudent(s.id, {
          courses: coursesToWrite(
            existing.filter((course) => course.id !== fromCourseId),
          ),
        });
      }),
    );
    recordFeedback({
      toastSuccessMessage: `Overførsel fjernet helt — ${hoursWithdrawnTotal} timer trukket tilbage for ${affectedCount} kursister`,
      logArgs: {
        courseId,
        description: `${actor} fjernede timeoverførslen fra ${courses[fromCourseId]?.label || courses[fromCourseId]?.key || "et hold"} helt for ${courses[courseId].label} (${affectedCount} kursister berørt, ${hoursWithdrawnTotal} timer trukket ud af regnskabet igen)`,
      },
    });
    setConfirmRemoveCourseId(null);
    onToggle();
  };

  const closeAddStudents = () => {
    setShowAddStudents(false);
    setStudentSearch("");
    setSelectedStudentIds([]);
    setNewStudentRows([{ name: "", email: "" }]);
    setAddError("");
  };

  const submitAddedStudents = async () => {
    const people: RosterPersonInput[] = [
      ...selectedStudentIds.map((userId) => ({ userId })),
      ...newStudentRows
        .map((row) => ({ name: row.name.trim(), email: row.email.trim() }))
        .filter((row) => row.name || row.email),
    ];
    if (people.length === 0) {
      setAddError("Vælg mindst én kursist, eller udfyld navn og email.");
      return;
    }
    const incomplete = people.some(
      (person) => !person.userId && (!person.name || !person.email),
    );
    if (incomplete) {
      setAddError("Nye kursister skal have både navn og email.");
      return;
    }
    setAddError("");
    try {
      const plan = await applyRoster.mutateAsync(
        withFeedback(
          { courseId, people },
          {
            toastSuccessMessage: `Kursister tilføjet til ${courses[courseId].label}`,
            logArgs: {
              courseId,
              description: `${actor} tilføjede kursister til ${courses[courseId].label}`,
            },
          },
        ),
      );
      if (plan.invalid.length > 0 || plan.notStudents.length > 0) {
        const problems = [...plan.invalid, ...plan.notStudents]
          .map((person) => person.email || person.name)
          .filter(Boolean)
          .join(", ");
        setAddError(
          problems
            ? `Disse blev ikke tilføjet: ${problems}`
            : "Nogle rækker kunne ikke tilføjes.",
        );
        return;
      }
      closeAddStudents();
    } catch {
      /* mutationen viser allerede fejl-toast */
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0];
    event.target.value = "";
    if (!file) return;
    void (async () => {
      try {
        const people = await readRosterFile(file);
        const plan = await previewRoster.mutateAsync(
          withFeedback({ courseId, people }),
        );
        setImportPeople(people);
        setImportFileName(file.name);
        setImportPlan(plan);
      } catch {
        setImportFileName(file.name);
        setImportPeople([]);
        setImportPlan({
          existing: [],
          invite: [],
          alreadyOnCourse: [],
          notStudents: [],
          invalid: [{ name: file.name, email: "", userId: null, note: "Kunne ikke læse filen." }],
        });
      }
    })();
  };

  const confirmImport = async () => {
    if (importPeople.length === 0) return;
    try {
      await applyRoster.mutateAsync(
        withFeedback(
          { courseId, people: importPeople },
          {
            toastSuccessMessage: `Import bekræftet for ${courses[courseId].label}`,
            logArgs: {
              courseId,
              description: `${actor} importerede kursister til ${courses[courseId].label} fra Excel`,
            },
          },
        ),
      );
      setImportPlan(null);
      setImportPeople([]);
    } catch {
      /* mutationen viser allerede fejl-toast */
    }
  };

  const members = students.filter((s) => isActiveOnCourse(s, h.id));
  const onCount = members.filter((s) =>
    previousCourses(s).some((course) => course.included),
  ).length;
  const windowCourses = coursesWithinTransferWindow(h.id, courses);

  return (
    <div
      className="mb-2.5 overflow-hidden rounded-lg border border-border bg-card"
      key={h.id}
      id={`hold-card-${h.id}`}
    >
      <div className="flex items-center gap-1 pr-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2.5 border-0 bg-transparent px-4 py-3.5 text-left font-sans"
          onClick={onToggle}
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold">{h.label}</div>
            <div className="mt-px text-xs text-ink-soft">
              {educationName(h, educations)
                ? `${educationName(h, educations)} · `
                : ""}
              Oprettet {h.startYear} · {members.length} kursister
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onCount > 0 && (
              <span
                className="flex items-center gap-1 font-mono text-[11px] font-semibold"
                style={{ color: "var(--secondary)" }}
              >
                <ArrowRightLeft size={12} /> {onCount}/{members.length} overfører
              </span>
            )}
            <ChevronDown
              size={16}
              className={`shrink-0 text-ink-soft transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>
        {isAdministrator(user?.role) && (
          <Button
            variant="icon"
            size="icon"
            className="shrink-0 text-red-700 hover:border-red-700 hover:text-red-700"
            title="Slet hold"
            aria-label={`Slet ${h.label}`}
            onClick={() => setConfirmDeleteCourseId(h.id)}
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="border-t border-border px-4 pb-4 pt-3.5">
          {canEditCourse && (
            <>
          <Field
            label="Uddannelse"
            hint="Vælg en eksisterende uddannelse, eller opret en ny."
          >
            <Selector
              value={editProgramId}
              onChange={(e) => {
                const next = e.target.value;
                setEditProgramId(next);
                setProgramError("");
                if (next === NEW_PROGRAM.value) {
                  setNewProgramName("");
                  setEditTargets({});
                } else {
                  setNewProgramName("");
                  const education = educations[next];
                  const sameEducation = next === courses[courseId]?.educationId;
                  setEditTargets(
                    sameEducation
                      ? { ...targetsForCourse(courses[courseId], educations) }
                      : { ...(education?.targets ?? {}) },
                  );
                }
              }}
              options={[...programOptions, NEW_PROGRAM]}
            />
          </Field>
          {creatingNewProgram && (
            <Field label="Navn på ny uddannelse">
              <Input
                type="text"
                value={newProgramName}
                onChange={(e) => setNewProgramName(e.target.value)}
                placeholder="Fx Psykoterapeutuddannelsen"
              />
            </Field>
          )}
          {programError && (
            <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
              {programError}
            </div>
          )}
          {creatingNewProgram ? (
            <ProgramCategoryFields
              label="Totalmål for den nye uddannelse"
              hint="Uddannelsens mål er loftet. Dette hold starter med de samme tal."
              targets={editTargets}
              onChange={setEditTargets}
              categories={CATEGORIES}
            />
          ) : (
            <CourseGoalFields
              targets={editTargets}
              ceilings={selectedProgram?.targets ?? {}}
              onChange={setEditTargets}
              categories={CATEGORIES}
            />
          )}
          <div className="mb-4 flex gap-2.5">
            <Button
              variant="primary"
              className="flex-1"
              onClick={saveCourseProgram}
              disabled={isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? "Gemmer…" : "Gem holdets delmål"}
            </Button>
          </div>
            </>
          )}
          <div className="my-8 flex items-center gap-2">
            <span className="stitch-line" />
          </div>
          <div
            className="mb-1.5 block text-xs font-semibold text-ink-soft"
            style={{ marginBottom: 8 }}
          >
            Administratorer og undervisere på dette hold
          </div>
          {adminUsers
            .filter((u) => staffHasCourseAccess(u, h.id))
            .map((u) => (
              <div
                className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0"
                key={u.id}
              >
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{ fontSize: 13 }}
                  >
                    {u.name}
                  </div>
                  <div className="mt-px text-xs text-ink-soft">
                    {ADMIN_ROLES[u.role]?.label || u.role}
                    {u.allCourses ? " · Alle hold" : ""}
                  </div>
                </div>
                {u.allCourses ? (
                  <span className="shrink-0 rounded-full border border-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-primary">
                    Alle hold
                  </span>
                ) : (
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => removeUserFromCourse(u.id)}
                    title="Fjern adgang til dette hold"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          {adminUsers.filter((u) => staffHasCourseAccess(u, h.id)).length ===
            0 && (
            <p
              className="mt-1 block text-[11px] text-ink-soft"
              style={{ marginBottom: 10 }}
            >
              Ingen administratorer eller undervisere har adgang til dette hold
              endnu.
            </p>
          )}
          {adminUsers.filter((u) => !staffHasCourseAccess(u, h.id)).length >
            0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <div className="relative" style={{ flex: 1 }}>
                <Selector
                  value={addUserId ?? ""}
                  onChange={(e) => setAddUserId(e.target.value)}
                  options={[
                    {
                      value: "",
                      label: "Vælg administrator eller underviser…",
                    },
                    ...adminUsers
                      .filter((u) => !staffHasCourseAccess(u, h.id))
                      .map((u) => ({
                        value: u.id,
                        label: `${u.name} · ${ADMIN_ROLES[u.role]?.label || u.role}`,
                      })),
                  ]}
                />
              </div>
              <button
                className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
                onClick={addUserToCourse}
              >
                <PlusCircle size={14} /> Giv adgang
              </button>
            </div>
          )}
          <div className="my-8 flex items-center gap-2">
            <span className="stitch-line" />
          </div>

          <div
            className="mb-1.5 block text-xs font-semibold text-ink-soft"
            style={{ marginBottom: 4 }}
          >
            Overfør kursister fra et andet hold
          </div>
          <p
            className="mt-1 block text-[11px] text-ink-soft"
            style={{ marginBottom: 10 }}
          >
            Til når en hel årgang rykker videre til dette hold (fx fra år 1 til
            år 2). Flytter kursisterne hertil og viderefører automatisk deres
            optjente timer fra kildeholdet.
          </p>

          <Selector
            value={transferSourceId}
            onChange={(e) => {
              setTransferSourceId(e.target.value);
              setConfirmTransferRoster(false);
            }}
            options={[
              ...Object.values(courses)
                .filter((src) => src.id !== h.id)
                .map((src) => ({ value: src.id, label: src.label })),
              { value: "", label: "Vælg kildehold…" },
            ]}
          />

          {transferSourceId &&
            (confirmTransferRoster ? (
              <div className="mb-1">
                <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                  <AlertTriangle size={14} />
                  {
                    students.filter(
                      (s) => isActiveOnCourse(s, transferSourceId),
                    ).length
                  }{" "}
                  {students.filter(
                    (s) => isActiveOnCourse(s, transferSourceId),
                  ).length > 1
                    ? "kursister"
                    : "kursist"}{" "}
                  flyttes fra {courses[transferSourceId].label} til {h.label},
                  og {courses[transferSourceId].label} beholdes som tidligere
                  hold, så deres timer fortsætter med at tælle.
                </div>
                <div className="mt-4.5 flex gap-2.5" style={{ marginTop: 10 }}>
                  <button
                    className="flex-1 cursor-pointer rounded-md border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                    onClick={() => setConfirmTransferRoster(false)}
                  >
                    Annuller
                  </button>
                  <button
                    className="flex-1 cursor-pointer rounded-md border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                    onClick={transferRoster}
                  >
                    Ja, overfør{" "}
                    {students.filter(
                      (s) => isActiveOnCourse(s, transferSourceId),
                    ).length > 1
                      ? "kursisterne"
                      : "kursisten"}
                  </button>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                className="flex-1 mt-2 mx-auto"
                onClick={() => setConfirmTransferRoster(true)}
                disabled={
                  students.filter((s) => isActiveOnCourse(s, transferSourceId))
                    .length === 0
                }
              >
                <ArrowRightLeft size={14} /> Overfør{" "}
                {
                  students.filter((s) => isActiveOnCourse(s, transferSourceId))
                    .length
                }{" "}
                {students.filter((s) => isActiveOnCourse(s, transferSourceId))
                  .length > 1
                  ? "kursister"
                  : "kursist"}{" "}
                til {h.label}
              </Button>
            ))}

          <div className="my-8 flex items-center gap-2">
            <span className="stitch-line" />
          </div>
          <div className="text-sm font-semibold mb-4">
            Tilføjning af kursister
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="small" onClick={() => setShowAddStudents(true)}>
              <Plus size={14} /> Tilføj kursister
            </Button>
            <label className="inline-flex w-auto flex-none cursor-pointer items-center gap-2 rounded-md border-[1.5px] border-border bg-transparent px-3 py-2 font-sans text-sm font-semibold text-ink-soft">
              <Upload size={14} />
              {previewRoster.isPending ? "Læser fil…" : "Importér fra Excel"}
              <input
                type="file"
                accept=".xlsx,.csv"
                style={{ display: "none" }}
                onChange={handleImportFile}
              />
            </label>
          </div>
          <p className="mt-2 max-w-130 text-xs text-ink-soft">
            Filen skal være .xlsx eller .csv med kolonnerne "Navn" og "Email".
            Ingenting oprettes, før importen er bekræftet.
          </p>
          <div className="my-8 flex items-center gap-2">
            <span className="stitch-line" />
          </div>

          <ToggleButton
            label="Overfør timer fra andet hold for hele holdet"
            checked={draftOn}
            onChange={setDraftOn}
          />
          {draftOn && (
            <Field
              label="Overfør fra hold"
              hint={
                windowCourses.length === 0
                  ? "Ingen hold inden for 5-års-vinduet."
                  : undefined
              }
            >
              <Selector
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                options={windowCourses.map((oh) => ({
                  value: oh.id,
                  label: oh.label + " · " + oh.startYear,
                }))}
              />
            </Field>
          )}
          <p className="mb-3.5 text-[13px] leading-normal text-ink-soft">
            Denne indstilling anvendes på alle {members.length} kursister i{" "}
            {h.label}.
          </p>
          <Button variant="primary" className="w-full" onClick={applyToCourse}>
            Anvend på hele holdet
          </Button>

          {draftFrom &&
            members.some((s) =>
              s.courses.some((course) => course.id === draftFrom),
            ) &&
            (confirmRemoveCourseId === draftFrom ? (
              <div className="mb-1">
                <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                  <AlertTriangle size={14} />
                  Sikker på at overførslen fra{" "}
                  {courses[draftFrom]?.label ||
                    courses[draftFrom]?.key ||
                    "holdet"}{" "}
                  skal fjernes helt for hele {h.label}? Timerne trækkes
                  automatisk ud af regnskabet igen for alle berørte kursister.
                </div>
                <div className="mt-4.5 flex gap-2.5" style={{ marginTop: 10 }}>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setConfirmRemoveCourseId(null)}
                  >
                    Annuller
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => removeFromCourse(draftFrom)}
                  >
                    Ja, fjern helt
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                className="w-full border-red-700 text-red-700 hover:bg-red-700/10 mt-2"
                onClick={() => setConfirmRemoveCourseId(draftFrom as string)}
                title="Brug denne hvis overførslen ved en fejl blev sat op med det forkerte hold"
              >
                <Trash2 size={14} /> Fjern denne overførsel helt for hele holdet
              </Button>
            ))}

        </div>
      )}
      {confirmDeleteCourseId === h.id && (
        <ConfirmDeleteModal
          title="Slet hold"
          name={h.label}
          description={
            <>
              {h.label} slettes permanent. Kursister, der historisk har fået
              overført timer herfra til et andet, aktivt hold, beholder deres
              timer — holdnavnet vises blot som "(slettet)" i deres historik.
            </>
          }
          blockedReason={
            members.length > 0
              ? `Holdet kan ikke slettes, så længe der er ${members.length} kursister tilknyttet. Flyt dem til et andet hold, eller slet dem permanent fra deres kursistdetalje.`
              : undefined
          }
          isSaving={isSaving}
          onConfirm={deleteCourse}
          onClose={() => setConfirmDeleteCourseId(null)}
        />
      )}
      {showAddStudents && (
        <Modal title={`Tilføj kursister til ${h.label}`} onClose={closeAddStudents}>
          <Field label="Søg">
            <Input
              type="search"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Navn eller email"
            />
          </Field>
          <div className="mb-4 max-h-52 overflow-y-auto rounded-md border border-border">
            {students
              .filter((student) => {
                const q = studentSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  student.name.toLowerCase().includes(q) ||
                  student.email.toLowerCase().includes(q)
                );
              })
              .map((student) => {
                const onCourse = isActiveOnCourse(student, h.id);
                const checked =
                  onCourse || selectedStudentIds.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-2 text-[13px] last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={onCourse}
                      onChange={() =>
                        setSelectedStudentIds((current) =>
                          current.includes(student.id)
                            ? current.filter((id) => id !== student.id)
                            : [...current, student.id],
                        )
                      }
                    />
                    <span>
                      <span className="font-semibold">{student.name}</span>
                      <span className="text-ink-soft"> · {student.email}</span>
                      {onCourse && (
                        <span className="text-ink-soft"> · allerede på holdet</span>
                      )}
                    </span>
                  </label>
                );
              })}
          </div>
          <div className="mb-2 text-xs font-semibold text-ink-soft">
            Nye kursister, som ikke findes endnu
          </div>
          {newStudentRows.map((row, index) => (
            <div key={index} className="mb-2 flex gap-2">
              <Input
                type="text"
                value={row.name}
                placeholder="Fulde navn"
                onChange={(e) =>
                  setNewStudentRows((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, name: e.target.value } : item,
                    ),
                  )
                }
              />
              <Input
                type="email"
                value={row.email}
                placeholder="navn@email.dk"
                onChange={(e) =>
                  setNewStudentRows((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, email: e.target.value }
                        : item,
                    ),
                  )
                }
              />
            </div>
          ))}
          <Button
            variant="secondary"
            size="small"
            className="mb-3"
            onClick={() =>
              setNewStudentRows((current) => [...current, { name: "", email: "" }])
            }
          >
            <Plus size={14} /> Tilføj endnu en
          </Button>
          {addError && (
            <div className="mb-3 flex items-start gap-1.5 text-xs text-secondary">
              <AlertTriangle size={14} /> {addError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="small" onClick={closeAddStudents}>
              Annuller
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={submitAddedStudents}
              disabled={applyRoster.isPending}
            >
              {applyRoster.isPending ? "Tilføjer…" : "Tilføj valgte"}
            </Button>
          </div>
        </Modal>
      )}
      {importPlan && (
        <Modal
          title={`Bekræft import fra ${importFileName || "Excel"}`}
          onClose={() => setImportPlan(null)}
        >
          <RosterLines
            title="Nye kursister, som inviteres og oprettes"
            people={importPlan.invite}
          />
          <RosterLines
            title="Findes allerede og tilføjes holdet"
            people={importPlan.existing}
          />
          <RosterLines
            title="Allerede på holdet"
            people={importPlan.alreadyOnCourse}
          />
          <RosterLines
            title="Findes, men er ikke kursister"
            people={importPlan.notStudents}
          />
          <RosterLines title="Springer over" people={importPlan.invalid} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="small" onClick={() => setImportPlan(null)}>
              Annuller
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={confirmImport}
              disabled={
                applyRoster.isPending ||
                (importPlan.existing.length === 0 && importPlan.invite.length === 0)
              }
            >
              {applyRoster.isPending ? "Tilføjer…" : "Bekræft"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RosterLines({
  title,
  people,
}: {
  title: string;
  people: { name: string; email: string; note?: string | null }[];
}) {
  if (people.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-semibold text-ink-soft">
        {title} ({people.length})
      </div>
      <ul className="text-[13px]">
        {people.map((person, index) => (
          <li key={`${person.email}-${index}`}>
            {person.name || "Uden navn"}
            {person.email ? ` · ${person.email}` : ""}
            {person.note ? ` · ${person.note}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
