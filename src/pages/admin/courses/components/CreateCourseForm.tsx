import { useState } from "react";
import { PlusCircle, ChevronDown } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { defaultTargets, formatTargets } from "@/domain/catalog";
import { Field } from "@/components/ui/Field";
import { useActorLabel } from "@/domain/actor";
import { programIdFromName } from "@/pages/admin/courses/components/ProgramsSection";

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
  const { CATEGORIES, programs, createProgram: createProgramApi } =
    useCatalog();
  const { courses, createCourse: createCourseApi } = useCourses();

  const [showCreate, setShowCreate] = useState(false);
  const [newCourseId, setNewCourseId] = useState("");
  const [newCourseYear, setNewCourseYear] = useState(
    String(new Date().getFullYear()),
  );
  const [newCourseProgramId, setNewCourseProgramId] = useState(
    Object.keys(programs)[0] || "__new__",
  );
  const [newProgramName, setNewProgramName] = useState("");
  const [newCourseTargets, setNewCourseTargets] = useState(
    defaultTargets(CATEGORIES),
  );
  const [createError, setCreateError] = useState("");

  const createCourse = async () => {
    const id = newCourseId.trim();
    if (!id) {
      setCreateError("Angiv et holdnavn, fx 26-100.");
      return;
    }
    if (courses[id]) {
      setCreateError(`Hold ${id} findes allerede.`);
      return;
    }
    let programId = newCourseProgramId;
    if (programId === "__new__") {
      if (!newProgramName.trim()) {
        setCreateError("Angiv et navn til den nye uddannelse.");
        return;
      }
      const trimmed = newProgramName.trim();
      programId = programIdFromName(trimmed);
      await createProgramApi(
        { id: programId, name: trimmed, targets: newCourseTargets },
        {
          logArgs: {
            description: `${actor} oprettede uddannelsen "${trimmed}" med totalmål ${formatTargets(newCourseTargets, CATEGORIES)}`,
          },
        },
      );
    }
    const year = Number(newCourseYear) || new Date().getFullYear();
    await createCourseApi(
      {
        id,
        label: `Hold ${id}`,
        startYear: year,
        programId,
        targets: newCourseTargets,
      },
      {
        toastSuccessMessage: `Hold ${id} oprettet`,
        logArgs: {
          courseId: id,
          description: `${actor} oprettede hold ${id} under "${programs[programId]?.name || newProgramName}" med delmål ${formatTargets(newCourseTargets, CATEGORIES)}`,
        },
      },
    );
    setNewCourseId("");
    setNewCourseYear(String(new Date().getFullYear()));
    setNewProgramName("");
    setNewCourseTargets(defaultTargets(CATEGORIES));
    setCreateError("");
    setShowCreate(false);
    onCreated(id);
  };

  return (
    <>
      <div className="mt-5.5 flex items-center justify-between">
        <div
          className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
          style={{ margin: 0 }}
        >
          Hold
        </div>
        {!showCreate && (
          <button
            className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
            onClick={() => {
              setShowCreate(true);
              onStartCreate();
            }}
          >
            <PlusCircle size={14} /> Opret hold
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card">
          <div
            className="border-t border-border px-4 pb-4 pt-3.5"
            style={{ borderTop: "none", paddingTop: 16 }}
          >
            <div className="flex gap-3">
              <Field label="Holdnavn" hint="Fx 26-100">
                <input
                  type="text"
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  placeholder="26-100"
                />
              </Field>
              <Field label="Startår">
                <input
                  type="number"
                  value={newCourseYear}
                  onChange={(e) => setNewCourseYear(e.target.value)}
                />
              </Field>
            </div>
            <Field
              label="Uddannelse"
              hint="Vælg en eksisterende uddannelse, eller opret en ny."
            >
              <div className="relative">
                <select
                  value={newCourseProgramId}
                  onChange={(e) => setNewCourseProgramId(e.target.value)}
                >
                  {Object.values(programs).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="__new__">+ Opret ny uddannelse…</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
                />
              </div>
            </Field>
            {newCourseProgramId === "__new__" && (
              <Field label="Navn på ny uddannelse">
                <input
                  type="text"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  placeholder="Fx Psykoterapeutuddannelsen"
                />
              </Field>
            )}
            <Field
              label="Holdets delmål"
              hint="Hvor mange timer skal netop dette hold/år bidrage med i hver kategori?"
            >
              <div className="flex gap-3">
                {Object.values(CATEGORIES).map((c) => (
                  <div key={c.key} style={{ flex: 1 }}>
                    <label
                      className="mt-1 block text-[11px] text-ink-soft"
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      {c.short}
                    </label>
                    <input
                      type="number"
                      value={newCourseTargets[c.key] ?? 0}
                      onChange={(e) =>
                        setNewCourseTargets({
                          ...newCourseTargets,
                          [c.key]: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </Field>
            {createError && (
              <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
                {createError}
              </div>
            )}
            <div className="mt-4.5 flex gap-2.5">
              <button
                className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                onClick={() => {
                  setShowCreate(false);
                  setCreateError("");
                }}
              >
                Annuller
              </button>
              <button
                className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                onClick={createCourse}
              >
                Opret hold
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
