import { useState } from "react";
import { PlusCircle, School } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { formatTargets } from "@/domain/catalog";
import { Field } from "@/components/ui/Field";
import { useActorLabel } from "@/domain/actor";
import { programKeyFromName } from "@/pages/admin/courses/components/ProgramsSection";
import SectionHeader from "../../components/SectionHeader";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Selector } from "@/components/ui/Selector";
import { ProgramCategoryFields } from "@/pages/admin/courses/components/ProgramCategoryFields";

const NEW_PROGRAM = {
  value: "__new__",
  label: "+ Opret ny uddannelse…",
} as const;

type CreateCourseFormProps = {
  /** Called when the user starts creating a course (page closes any open card). */
  onStartCreate: () => void;
  /** Called with the new course id after it was created. */
  onCreated: (courseId: string) => void;
};

/** "Hold" section header with the "Opret hold" button and the create form. */
export function CreateCourseForm({
  onStartCreate,
  onCreated,
}: CreateCourseFormProps) {
  const actor = useActorLabel();
  const {
    CATEGORIES,
    programs,
    createProgram: createProgramApi,
    isSaving: catalogSaving,
  } = useCatalog({ categories: true, programs: true });
  const {
    courses,
    createCourse: createCourseApi,
    isSaving: courseSaving,
  } = useCourses();

  const programOptions = Object.values(programs).map((program) => ({
    value: program.id,
    label: program.name,
  }));
  const [showCreate, setShowCreate] = useState(false);
  const [newCourseId, setNewCourseId] = useState("");
  const [newCourseYear, setNewCourseYear] = useState(
    String(new Date().getFullYear()),
  );
  const [newCourseProgramId, setNewCourseProgramId] = useState(
    programOptions[0]?.value || NEW_PROGRAM.value,
  );
  const [newProgramName, setNewProgramName] = useState("");
  const [newCourseTargets, setNewCourseTargets] = useState<
    Record<string, number>
  >({});
  const [createError, setCreateError] = useState("");

  const creatingNewProgram = newCourseProgramId === NEW_PROGRAM.value;
  const selectedProgram = creatingNewProgram
    ? null
    : (programs[newCourseProgramId] ?? null);

  const resetForm = () => {
    setNewCourseId("");
    setNewCourseYear(String(new Date().getFullYear()));
    setNewCourseProgramId(programOptions[0]?.value || NEW_PROGRAM.value);
    setNewProgramName("");
    setNewCourseTargets({});
    setCreateError("");
  };

  const createCourse = async () => {
    const key = newCourseId.trim();
    if (!key) {
      setCreateError("Angiv et holdnavn, fx 26-100.");
      return;
    }
    if (Object.values(courses).some((course) => course.key === key)) {
      setCreateError(`Hold ${key} findes allerede.`);
      return;
    }

    let programId = selectedProgram?.id ?? null;
    let programLabel = selectedProgram?.name ?? "";

    if (creatingNewProgram || !programId) {
      const trimmed = newProgramName.trim();
      if (!trimmed) {
        setCreateError("Angiv et navn til den nye uddannelse.");
        return;
      }
      const programKey = programKeyFromName(trimmed);
      if (
        Object.values(programs).some(
          (program) =>
            program.key === programKey ||
            program.name.toLowerCase() === trimmed.toLowerCase(),
        )
      ) {
        setCreateError("Der findes allerede en uddannelse med det navn.");
        return;
      }
      const createdProgram = await createProgramApi(
        { key: programKey, name: trimmed, targets: newCourseTargets },
        {
          logArgs: {
            description: `${actor} oprettede uddannelsen "${trimmed}" med totalmål ${formatTargets(newCourseTargets, CATEGORIES)}`,
          },
        },
      );
      programId = createdProgram.id;
      programLabel = createdProgram.name;
    }

    const year = Number(newCourseYear) || new Date().getFullYear();
    const createdCourse = await createCourseApi(
      {
        key,
        label: `Hold ${key}`,
        startYear: year,
        programId,
      },
      {
        toastSuccessMessage: `Hold ${key} oprettet`,
        logArgs: (course) => ({
          courseId: course.id,
          description: creatingNewProgram
            ? `${actor} oprettede hold ${key} under "${programLabel}" med totalmål ${formatTargets(newCourseTargets, CATEGORIES)}`
            : `${actor} oprettede hold ${key} under "${programLabel}"`,
        }),
      },
    );
    resetForm();
    setShowCreate(false);
    onCreated(createdCourse.id);
  };

  return (
    <>
      <div className="my-2 flex items-center justify-between">
        <SectionHeader icon={<School size={20} />} title="Hold" />
        {!showCreate && (
          <Button
            variant="pill"
            size="small"
            onClick={() => {
              setShowCreate(true);
              onStartCreate();
            }}
          >
            <PlusCircle size={14} /> Opret hold
          </Button>
        )}
      </div>

      {showCreate && (
        <div className="mb-2.5 overflow-hidden rounded-lg border border-border bg-card">
          <div className="px-4 pb-4 pt-3.5">
            <div className="flex gap-3">
              <Field label="Holdnavn">
                <Input
                  type="text"
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  placeholder="26-100"
                />
              </Field>
              <Field label="Startår">
                <NumberInput
                  value={Number(newCourseYear)}
                  onChange={(e) => setNewCourseYear(String(e.target.value))}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  step={1}
                  inputMode="numeric"
                  placeholder="Fx 2026"
                />
              </Field>
            </div>
            <Field
              label="Uddannelse"
              hint="Vælg en eksisterende uddannelse, eller opret en ny."
            >
              <Selector
                options={[...programOptions, NEW_PROGRAM]}
                value={newCourseProgramId}
                onChange={(e) => {
                  const next = e.target.value;
                  setNewCourseProgramId(next);
                  setCreateError("");
                  if (next === NEW_PROGRAM.value) {
                    setNewCourseTargets({});
                  } else {
                    setNewProgramName("");
                    setNewCourseTargets({});
                  }
                }}
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
            {creatingNewProgram && (
              <ProgramCategoryFields
                label="Totalmål for den nye uddannelse"
                hint="Holdet bruger uddannelsens totalmål. Delmål sættes her ved oprettelse."
                targets={newCourseTargets}
                onChange={setNewCourseTargets}
                categories={CATEGORIES}
              />
            )}
            {createError && (
              <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
                {createError}
              </div>
            )}
            <div className="mt-4.5 flex gap-2.5">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                Annuller
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={createCourse}
                disabled={catalogSaving || courseSaving}
                aria-busy={catalogSaving || courseSaving}
              >
                {catalogSaving || courseSaving ? "Opretter…" : "Opret hold"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
