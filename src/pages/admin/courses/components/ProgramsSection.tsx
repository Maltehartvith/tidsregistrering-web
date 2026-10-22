import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Book,
  ChevronDown,
} from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { formatTargets } from "@/domain/catalog";
import { Field } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/NumberInput";
import { Education, EducationDraft } from "@/types/domain";
import { useActorLabel } from "@/domain/actor";
import { useAuth } from "@/context/AuthContext";
import { isAdministrator } from "@/api/queryKeys";
import type { MutationFeedback } from "@/types/log";
import SectionHeader from "../../components/SectionHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import Input from "@/components/ui/Input";
import { GhostBlock } from "@/components/ui/Ghost";
import { ProgramCategoryFields } from "@/pages/admin/courses/components/ProgramCategoryFields";

/** Builds a stable education key from a (trimmed) display name. */
export const educationKeyFromName = (name: string) =>
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
  const { user } = useAuth();
  const {
    CATEGORIES,
    educations,
    createEducation: createEducationApi,
    updateEducation,
    deleteEducation: deleteEducationApi,
    isSaving,
    isLoading,
  } = useCatalog({ categories: true, educations: true });
  const { courses } = useCourses();

  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [standaloneProgramName, setStandaloneProgramName] = useState("");
  const [standaloneLocation, setStandaloneLocation] = useState("");
  const [standaloneYear, setStandaloneYear] = useState("");
  const [standaloneProgramTargets, setStandaloneProgramTargets] = useState<
    Record<string, number>
  >({});
  const [createProgramError, setCreateProgramError] = useState("");
  const [confirmDeleteProgramId, setConfirmDeleteProgramId] = useState<
    string | null
  >(null);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programDraft, setProgramDraft] = useState<EducationDraft | null>(null);
  const [programError, setProgramError] = useState("");
  const [openEducationId, setOpenEducationId] = useState<string | null>(null);

  const createProgramLocal = async (
    name: string,
    targets: Record<string, number>,
    location = "",
    year = "",
    feedback?: MutationFeedback<Education> | null,
  ) => {
    const trimmed = name.trim();
    const key = educationKeyFromName(trimmed);
    const parsedYear = year.trim() ? Number(year) : null;
    const created = await createEducationApi(
      {
        key,
        name: trimmed,
        targets,
        location: location.trim() || null,
        year: parsedYear,
      },
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
      Object.values(educations).some(
        (p) =>
          p.name.toLowerCase() === standaloneProgramName.trim().toLowerCase() ||
          p.key === educationKeyFromName(standaloneProgramName),
      )
    ) {
      setCreateProgramError("Der findes allerede en uddannelse med det navn.");
      return;
    }
    if (standaloneYear.trim() && !Number(standaloneYear)) {
      setCreateProgramError("År skal være et tal, fx 2026.");
      return;
    }
    await createProgramLocal(
      standaloneProgramName,
      standaloneProgramTargets,
      standaloneLocation,
      standaloneYear,
      {
        toastSuccessMessage: `Uddannelsen "${standaloneProgramName.trim()}" oprettet`,
      },
    );
    setStandaloneProgramName("");
    setStandaloneLocation("");
    setStandaloneYear("");
    setStandaloneProgramTargets({});
    setCreateProgramError("");
    setShowCreateProgram(false);
  };

  const startEditProgram = (p: Education) => {
    if (!p) return;
    setEditingProgramId(p.id);
    setProgramDraft({
      name: p.name,
      location: p.location ?? "",
      year: p.year ? String(p.year) : "",
      targets: { ...p.targets },
    });
    setProgramError("");
    setConfirmDeleteProgramId(null);
  };

  const saveProgramEdit = async (programId: string) => {
    if (!programDraft) return;
    const old = educations[programId];
    const name = programDraft.name.trim();
    if (!name) {
      setProgramError("Angiv et navn til uddannelsen.");
      return;
    }
    if (
      Object.values(educations).some(
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
    const parsedYear = programDraft.year.trim() ? Number(programDraft.year) : null;
    if (programDraft.year.trim() && !parsedYear) {
      setProgramError("År skal være et tal, fx 2026.");
      return;
    }
    const changes = [];
    if (old.name !== name) changes.push(`navn fra "${old.name}" til "${name}"`);
    if ((old.location ?? "") !== programDraft.location.trim())
      changes.push("sted");
    if ((old.year ?? null) !== parsedYear) changes.push("år");
    if (
      formatTargets(old.targets, CATEGORIES) !==
      formatTargets(nextTargets, CATEGORIES)
    ) {
      changes.push(
        `totalmål fra ${formatTargets(old.targets, CATEGORIES)} til ${formatTargets(nextTargets, CATEGORIES)}`,
      );
    }
    await updateEducation(
      programId,
      {
        name,
        targets: nextTargets,
        location: programDraft.location.trim() || null,
        year: parsedYear,
        locationSpecified: true,
        yearSpecified: true,
      },
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
    const inUse = Object.values(courses).some((h) => h.educationId === programId);
    if (inUse) return;
    const programBeingDeleted = educations[programId];
    await deleteEducationApi(programId, {
      toastSuccessMessage: `${programBeingDeleted.name} slettet`,
      logArgs: {
        description: `${actor} slettede uddannelsen "${programBeingDeleted.name}" (blev ikke brugt af noget hold)`,
      },
    });
    setConfirmDeleteProgramId(null);
  };

  const programPendingDelete = confirmDeleteProgramId
    ? educations[confirmDeleteProgramId]
    : undefined;
  const coursesUsingPendingDelete = confirmDeleteProgramId
    ? Object.values(courses).filter(
        (h) => h.educationId === confirmDeleteProgramId,
      )
    : [];

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
                <div className="flex gap-3">
                  <Field label="Sted" hint="Valgfrit. Hvor uddannelsen foregår.">
                    <Input
                      type="text"
                      value={standaloneLocation}
                      onChange={(e) => setStandaloneLocation(e.target.value)}
                      placeholder="Fx Aarhus"
                    />
                  </Field>
                  <Field label="År" hint="Valgfrit. Kun årstallet.">
                    <NumberInput
                      value={standaloneYear}
                      onChange={(e) => setStandaloneYear(e.target.value)}
                      min={2000}
                      max={2100}
                      step={1}
                      inputMode="numeric"
                      placeholder="2026"
                    />
                  </Field>
                </div>
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
          {Object.values(educations).map((p) => {
            const coursesUsingProgram = Object.values(courses).filter(
              (h) => h.educationId === p.id,
            );
            const isOpen = openEducationId === p.id;
            const canManage =
              isAdministrator(user?.role) || p.createdByUserId === user?.id;
            return (
              <div
                className="mb-2.5 overflow-hidden rounded-lg border border-border bg-card"
                key={p.id}
              >
                <div className="flex items-center gap-1 pr-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2.5 border-0 bg-transparent px-4 py-3.5 text-left font-sans"
                    onClick={() =>
                      setOpenEducationId(isOpen ? null : p.id)
                    }
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="mt-px text-xs text-ink-soft">
                        Totalmål: {formatTargets(p.targets, CATEGORIES)} timer ·{" "}
                        {coursesUsingProgram.length} hold
                        {[p.location, p.year].filter(Boolean).length > 0
                          ? ` · ${[p.location, p.year].filter(Boolean).join(" · ")}`
                          : ""}
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-ink-soft transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {canManage && (
                    <Button
                      variant="icon"
                      size="icon"
                      className="shrink-0 text-red-700 hover:border-red-700 hover:text-red-700"
                      title="Slet uddannelse"
                      aria-label={`Slet ${p.name}`}
                      onClick={() => setConfirmDeleteProgramId(p.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                {isOpen && (
                <div className="border-t border-border px-4 pb-4 pt-3.5">
                  {canManage && editingProgramId !== p.id && (
                    <div className="mb-3 flex justify-end">
                      <Button
                        variant="icon"
                        size="icon"
                        disabled={editingProgramId !== null}
                        onClick={() => startEditProgram(p)}
                        title="Redigér uddannelse"
                      >
                        <Pencil size={14} />
                      </Button>
                    </div>
                  )}
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
                      <div className="flex gap-3">
                        <Field label="Sted">
                          <Input
                            type="text"
                            value={programDraft.location}
                            onChange={(e) =>
                              setProgramDraft({
                                ...programDraft,
                                location: e.target.value,
                              })
                            }
                            placeholder="Fx Aarhus"
                          />
                        </Field>
                        <Field label="År">
                          <NumberInput
                            value={programDraft.year}
                            onChange={(e) =>
                              setProgramDraft({
                                ...programDraft,
                                year: e.target.value,
                              })
                            }
                            min={2000}
                            max={2100}
                            step={1}
                            inputMode="numeric"
                            placeholder="2026"
                          />
                        </Field>
                      </div>
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
                                  {formatTargets(h.targets, CATEGORIES)}
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
                  {editingProgramId !== p.id && (
                    <div className="flex flex-col gap-2">
                      {coursesUsingProgram.length === 0 ? (
                        <p className="text-[13px] text-ink-soft">
                          Ingen hold bruger uddannelsen endnu.
                        </p>
                      ) : (
                        coursesUsingProgram
                          .slice()
                          .sort(
                            (a, b) =>
                              a.startYear - b.startYear ||
                              a.label.localeCompare(b.label),
                          )
                          .map((h) => (
                            <button
                              key={h.id}
                              type="button"
                              className="flex cursor-pointer items-baseline justify-between gap-2 border-0 bg-transparent p-0 text-left font-sans"
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
                            >
                              <span className="text-[13px] font-semibold text-primary">
                                {h.label}
                              </span>
                              <span className="text-xs text-ink-soft">
                                Start {h.startYear} · delmål{" "}
                                {formatTargets(h.targets, CATEGORIES)}
                              </span>
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {programPendingDelete && (
        <ConfirmDeleteModal
          title="Slet uddannelse"
          name={programPendingDelete.name}
          description={
            <>
              Uddannelsen "{programPendingDelete.name}" slettes permanent. Dette
              kan ikke fortrydes.
            </>
          }
          blockedReason={
            coursesUsingPendingDelete.length > 0
              ? `Kan ikke slettes — bruges stadig af ${coursesUsingPendingDelete.length} hold. Flyt eller slet dem først.`
              : undefined
          }
          isSaving={isSaving}
          onConfirm={() => deleteProgram(programPendingDelete.id)}
          onClose={() => setConfirmDeleteProgramId(null)}
        />
      )}
    </>
  );
}
