import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Book,
} from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { formatTargets } from "@/domain/catalog";
import { Field } from "@/components/ui/Field";
import { Program, ProgramDraft } from "@/types/domain";
import { useActorLabel } from "@/domain/actor";
import type { MutationFeedback } from "@/types/log";
import SectionHeader from "../../components/SectionHeader";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { GhostBlock } from "@/components/ui/Ghost";
import { ProgramCategoryFields } from "@/pages/admin/courses/components/ProgramCategoryFields";

/** Builds a stable program key from a (trimmed) display name. */
export const programKeyFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9æøå]+/g, "-")
    .replace(/(^-|-$)/g, "") ||
  "uddannelse-" + Math.random().toString(36).slice(2, 7);

type ProgramsSectionProps = {
  openCourseId: string | null;
  /** Toggles a course card open/closed (owned by the page). */
  onToggleCourse: (courseId: string) => void;
};

export function ProgramsSection({
  openCourseId,
  onToggleCourse,
}: ProgramsSectionProps) {
  const actor = useActorLabel();
  const {
    CATEGORIES,
    programs,
    createProgram: createProgramApi,
    updateProgram,
    deleteProgram: deleteProgramApi,
    isSaving,
    isLoading,
  } = useCatalog({ categories: true, programs: true });
  const { courses } = useCourses();

  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [standaloneProgramName, setStandaloneProgramName] = useState("");
  const [standaloneProgramTargets, setStandaloneProgramTargets] = useState<
    Record<string, number>
  >({});
  const [createProgramError, setCreateProgramError] = useState("");
  const [confirmDeleteProgramId, setConfirmDeleteProgramId] = useState<
    string | null
  >(null);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programDraft, setProgramDraft] = useState<ProgramDraft | null>(null);
  const [programError, setProgramError] = useState("");

  const createProgramLocal = async (
    name: string,
    targets: Record<string, number>,
    feedback?: MutationFeedback<Program> | null,
  ) => {
    const trimmed = name.trim();
    const key = programKeyFromName(trimmed);
    const created = await createProgramApi(
      { key, name: trimmed, targets },
      {
        toastSuccessMessage: feedback?.toastSuccessMessage,
        logArgs: feedback?.logArgs ?? {
          description: `${actor} oprettede uddannelsen "${trimmed}" med totalmål ${formatTargets(targets, CATEGORIES)}`,
        },
      },
    );
    return created.id;
  };

  const submitNewProgram = async () => {
    if (!standaloneProgramName.trim()) {
      setCreateProgramError("Angiv et navn til uddannelsen.");
      return;
    }
    if (
      Object.values(programs).some(
        (p) =>
          p.name.toLowerCase() === standaloneProgramName.trim().toLowerCase() ||
          p.key === programKeyFromName(standaloneProgramName),
      )
    ) {
      setCreateProgramError("Der findes allerede en uddannelse med det navn.");
      return;
    }
    await createProgramLocal(standaloneProgramName, standaloneProgramTargets, {
      toastSuccessMessage: `Uddannelsen "${standaloneProgramName.trim()}" oprettet`,
    });
    setStandaloneProgramName("");
    setStandaloneProgramTargets({});
    setCreateProgramError("");
    setShowCreateProgram(false);
  };

  const startEditProgram = (p: Program) => {
    if (!p) return;
    setEditingProgramId(p.id);
    setProgramDraft({
      name: p.name,
      targets: { ...p.targets },
    });
    setProgramError("");
    setConfirmDeleteProgramId(null);
  };

  const saveProgramEdit = async (programId: string) => {
    if (!programDraft) return;
    const old = programs[programId];
    const name = programDraft.name.trim();
    if (!name) {
      setProgramError("Angiv et navn til uddannelsen.");
      return;
    }
    if (
      Object.values(programs).some(
        (p) =>
          p.id !== programId && p.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setProgramError("Der findes allerede en uddannelse med det navn.");
      return;
    }
    const nextTargets = Object.fromEntries(
      Object.entries(programDraft.targets).map(([k, v]) => [k, Number(v)]),
    );
    if (Object.values(nextTargets).some((v) => !(v >= 0))) {
      setProgramError("Totalmålene skal være 0 eller mere.");
      return;
    }
    const changes = [];
    if (old.name !== name) changes.push(`navn fra "${old.name}" til "${name}"`);
    if (
      formatTargets(old.targets, CATEGORIES) !==
      formatTargets(nextTargets, CATEGORIES)
    ) {
      changes.push(
        `totalmål fra ${formatTargets(old.targets, CATEGORIES)} til ${formatTargets(nextTargets, CATEGORIES)}`,
      );
    }
    await updateProgram(
      programId,
      { name, targets: nextTargets },
      {
        toastSuccessMessage: `Uddannelsen "${name}" gemt`,
        logArgs:
          changes.length > 0
            ? {
                description: `${actor} ændrede uddannelsen "${old.name}": ${changes.join(", ")}`,
              }
            : null,
      },
    );
    setEditingProgramId(null);
    setProgramDraft(null);
  };

  const deleteProgram = async (programId: string) => {
    const inUse = Object.values(courses).some((h) => h.programId === programId);
    if (inUse) return;
    const programBeingDeleted = programs[programId];
    await deleteProgramApi(programId, {
      toastSuccessMessage: `${programBeingDeleted.name} slettet`,
      logArgs: {
        description: `${actor} slettede uddannelsen "${programBeingDeleted.name}" (blev ikke brugt af noget hold)`,
      },
    });
    setConfirmDeleteProgramId(null);
  };

  return (
    <>
      <div className="my-2 flex items-center justify-between">
        <SectionHeader icon={<Book size={20} />} title="Uddannelser" />
        {!showCreateProgram && (
          <Button
            variant="pill"
            size="small"
            onClick={() => {
              setShowCreateProgram(true);
              setCreateProgramError("");
            }}
          >
            <PlusCircle size={14} /> Opret uddannelse
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index}>
              <GhostBlock className="h-17 w-full rounded-lg!" />
            </div>
          ))}
        </div>
      ) : (
        <div>
          {showCreateProgram && (
            <div className="mb-2.5 overflow-hidden rounded-lg border border-border bg-card">
              <div
                className="border-t border-border px-4 pb-4 pt-3.5"
                style={{ borderTop: "none", paddingTop: 16 }}
              >
                <Field
                  label="Navn på uddannelse"
                  hint="Fx Psykoterapeutuddannelsen"
                >
                  <Input
                    type="text"
                    value={standaloneProgramName}
                    onChange={(e) => setStandaloneProgramName(e.target.value)}
                    placeholder="Uddannelsens navn"
                  />
                </Field>
                <ProgramCategoryFields
                  label="Totalmål"
                  hint="Det samlede timekrav for hele uddannelsen — til reference. De enkelte hold får deres egne delmål."
                  targets={standaloneProgramTargets}
                  onChange={setStandaloneProgramTargets}
                  categories={CATEGORIES}
                />
                {createProgramError && (
                  <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
                    {createProgramError}
                  </div>
                )}
                <div className="mt-4.5 flex gap-2.5">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowCreateProgram(false)}
                    disabled={isSaving}
                    aria-busy={isSaving}
                  >
                    Annuller
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={submitNewProgram}
                    disabled={isSaving}
                    aria-busy={isSaving}
                  >
                    {isSaving ? "Opretter uddannelse…" : "Opret uddannelse"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          {Object.values(programs).map((p) => {
            const coursesUsingProgram = Object.values(courses).filter(
              (h) => h.programId === p.id,
            );
            const isBlocked = coursesUsingProgram.length > 0;
            return (
              <div
                className="mb-2.5 overflow-hidden rounded-lg border border-border bg-card"
                key={p.id}
              >
                <div
                  className="border-t border-border px-4 pb-4 pt-3.5"
                  style={{ borderTop: "none" }}
                >
                  <div
                    className="flex items-center justify-between gap-2.5 border-b border-border  last:border-b-0"
                    style={{ paddingTop: 0 }}
                  >
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="mt-px text-xs text-ink-soft">
                        Totalmål: {formatTargets(p.targets, CATEGORIES)} timer ·{" "}
                        {coursesUsingProgram.length} hold
                      </div>
                    </div>
                    {editingProgramId === p.id ? null : !isBlocked &&
                      confirmDeleteProgramId === p.id ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span>Slet?</span>
                        <button
                          className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                          onClick={() => deleteProgram(p.id)}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                          onClick={() => setConfirmDeleteProgramId(null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          variant="icon"
                          size="icon"
                          disabled={editingProgramId !== null}
                          onClick={() => startEditProgram(p)}
                          title="Redigér uddannelse"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="icon"
                          size="icon"
                          disabled={editingProgramId !== null}
                          onClick={() =>
                            setConfirmDeleteProgramId(
                              confirmDeleteProgramId === p.id ? null : p.id,
                            )
                          }
                          title="Slet uddannelse"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingProgramId === p.id && programDraft && (
                    <div className="mt-3">
                      <Field label="Navn">
                        <Input
                          type="text"
                          value={programDraft.name}
                          onChange={(e) =>
                            setProgramDraft({
                              ...programDraft,
                              name: e.target.value,
                            })
                          }
                        />
                      </Field>
                      <ProgramCategoryFields
                        label="Totalmål for hele uddannelsen"
                        targets={programDraft.targets}
                        onChange={(targets) =>
                          setProgramDraft({ ...programDraft, targets })
                        }
                        categories={CATEGORIES}
                      />
                      <div>
                        <p className="mt-2 mb-4 block text-[11px] text-ink-soft">
                          Til reference. Kursisternes regnskab regnes ud fra
                          delmålene på de hold, de går på.
                        </p>
                      </div>
                      <div
                        className="mb-1.5 block text-xs font-semibold text-ink-soft"
                        style={{ marginBottom: 6 }}
                      >
                        Hold under uddannelsen og deres delmål
                      </div>
                      {coursesUsingProgram.length === 0 ? (
                        <div
                          className="flex flex-col gap-2 rounded-sm border-[1.5px] border-border bg-card px-3 py-2.5"
                          style={{ marginBottom: 6 }}
                        >
                          <p className="mt-1 block text-md text-ink-soft">
                            Ingen hold bruger uddannelsen endnu.
                          </p>
                        </div>
                      ) : (
                        <div
                          className="flex flex-col gap-2 rounded-sm border-[1.5px] border-border bg-card px-3 py-2.5"
                          style={{ marginBottom: 6 }}
                        >
                          {[...coursesUsingProgram]
                            .sort(
                              (a, b) =>
                                a.startYear - b.startYear ||
                                a.label.localeCompare(b.label),
                            )
                            .map((h) => (
                              <div
                                key={h.id}
                                className="flex flex-wrap items-baseline justify-between gap-2.5"
                              >
                                <button
                                  className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-primary"
                                  style={{ margin: 0, textAlign: "left" }}
                                  onClick={() => {
                                    if (openCourseId !== h.id)
                                      onToggleCourse(h.id);
                                    setTimeout(
                                      () =>
                                        document
                                          .getElementById(`hold-card-${h.id}`)
                                          ?.scrollIntoView({
                                            behavior: "smooth",
                                            block: "start",
                                          }),
                                      60,
                                    );
                                  }}
                                  title="Åbn holdet for at rette delmål"
                                >
                                  {h.label}
                                </button>
                                <span className="mt-px text-xs text-ink-soft">
                                  Start {h.startYear} · delmål{" "}
                                  {formatTargets(p.targets, CATEGORIES)}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                      <p className="mt-1 block text-[11px] text-ink-soft">
                        Parallelle årgange har hver deres fulde delmål, mens
                        flerårige forløb deler totalmålet mellem årene. Klik på
                        et hold for at rette dets delmål.
                      </p>
                      {programError && (
                        <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
                          {programError}
                        </div>
                      )}
                      <div className="mt-4.5 flex w-full gap-2.5">
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={() => {
                            setEditingProgramId(null);
                            setProgramDraft(null);
                            setProgramError("");
                          }}
                        >
                          Annuller
                        </Button>
                        <Button
                          variant="primary"
                          className="flex-1"
                          onClick={() => saveProgramEdit(p.id)}
                          disabled={isSaving}
                          aria-busy={isSaving}
                        >
                          {isSaving ? "Gemmer…" : "Gem uddannelse"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {isBlocked && confirmDeleteProgramId === p.id && (
                    <div className="mb-1" style={{ marginTop: 10 }}>
                      <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                        <AlertTriangle size={14} />
                        Kan ikke slettes — bruges stadig af{" "}
                        {coursesUsingProgram.length} hold. Flyt eller slet dem
                        først:
                      </div>
                      <div
                        className="flex flex-col gap-2 rounded-sm border-[1.5px] border-border bg-card px-3 py-2.5"
                        style={{ marginTop: 8 }}
                      >
                        {coursesUsingProgram.map((h) => (
                          <button
                            className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-primary"
                            style={{ margin: 0, textAlign: "left" }}
                            onClick={() => {
                              if (openCourseId !== h.id) onToggleCourse(h.id);
                              setTimeout(
                                () =>
                                  document
                                    .getElementById(`hold-card-${h.id}`)
                                    ?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "start",
                                    }),
                                60,
                              );
                            }}
                            title="Tryk for at hoppe til holdet"
                          >
                            {h.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
