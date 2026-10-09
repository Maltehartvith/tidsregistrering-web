import { useState, useEffect } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  Users2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { useCatalog } from "../../context/CatalogContext";
import { useCourses } from "../../context/CoursesContext";
import { useEntries } from "../../context/EntriesContext";
import { categoryKeyFromLabel } from "../../domain/catalog";
import { CATEGORY_PALETTE } from "@/data/constants";
import { Field } from "../../components/ui/Field";
import ToggleButton from "../../components/ui/ToggleButton";
import { CategoryPill } from "../../components/ui/CategoryPill";
import { BrandLogo } from "../../components/brand/Brand";

import { AdminTabs } from "@/components/nav/AdminTabs";
import { Category } from "@/types/domain";
import { routes } from "@/routes";
import { useNavigate } from "react-router-dom";
import { useAuditLogs } from "@/context/AuditLogsContext";
import { useToast } from "@/components/ui/Toast";

export const AdminCatalogView = () => {
  const navigate = useNavigate();
  const { logEvent: onLog } = useAuditLogs();
  const { showToast } = useToast();
  const {
    ALL_CATEGORIES: CATEGORIES,
    LEARNING_GOALS,
    programs,
    createCategory,
    updateCategory,
    reorderCategories,
    deleteCategory,
    createLearningGoal,
    renameLearningGoal,
    reorderLearningGoals,
    deleteLearningGoal,
  } = useCatalog();
  const { courses } = useCourses();
  const { entries } = useEntries();
  const [editingCatKey, setEditingCatKey] = useState<string | null>(null); // en kategori-nøgle, "__new__" eller null
  const [categoryDraft, setCategoryDraft] = useState<Category | null>(null);
  const [catError, setCatError] = useState("");
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [goalError, setGoalError] = useState("");
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<number | null>(
    null,
  );
  const [confirmCatAction, setConfirmCatAction] = useState<{
    key: string;
    type: "delete" | "archive";
  } | null>(null); // { key, type: "delete" | "archive" }

  const catList = Object.values(CATEGORIES);
  const activeCats = catList.filter((c) => !c.archived);
  const archivedCats = catList.filter((c) => c.archived);
  const countFor = (key: string) =>
    entries.filter((e) => e.category === key).length;

  /* ---------- kategorier ---------- */

  const startEditCat = (c: Category) => {
    setEditingCatKey(c.key);
    setCategoryDraft({ ...c });
    setCatError("");
  };

  const startNewCat = () => {
    const unused =
      CATEGORY_PALETTE.find((p) => !catList.some((c) => c.color === p.color)) ||
      CATEGORY_PALETTE[0];
    setEditingCatKey("__new__");
    setCategoryDraft({
      key: "",
      label: "",
      short: "",
      defaultTarget: 0,
      requiresTherapist: false,
      color: unused?.color || "",
      soft: unused?.soft || "",
    });
    setCatError("");
  };

  const cancelCat = () => {
    setEditingCatKey(null);
    setCategoryDraft(null);
    setCatError("");
  };

  const saveCat = async () => {
    if (!categoryDraft || !editingCatKey) return;

    const label = categoryDraft.label.trim();
    const short = (categoryDraft.short || "").trim() || label;
    const defaultTarget = Number(categoryDraft.defaultTarget);
    if (!label) {
      setCatError("Angiv et navn til kategorien.");
      return;
    }
    if (
      catList.some(
        (c) =>
          c.key !== editingCatKey &&
          c.label.toLowerCase() === label.toLowerCase(),
      )
    ) {
      setCatError("Der findes allerede en kategori med det navn.");
      return;
    }
    if (!(defaultTarget >= 0)) {
      setCatError("Standard-delmålet skal være 0 eller mere.");
      return;
    }

    const fields: Omit<Category, "key"> = {
      label,
      short,
      defaultTarget,
      requiresTherapist: !!categoryDraft.requiresTherapist,
      color: categoryDraft.color,
      soft: categoryDraft.soft,
      archived: categoryDraft.archived,
    };

    if (editingCatKey === "__new__") {
      const taken: Record<string, unknown> = { ...CATEGORIES };
      for (const x of [...Object.values(courses), ...Object.values(programs)]) {
        for (const k of Object.keys(x.targets || {})) {
          taken[k] = true;
        }
      }
      const key = categoryKeyFromLabel(label, taken);
      await createCategory({ key, ...fields });
      onLog({
        actor: "Administrator",
        description: `Administrator oprettede kategorien "${label}" (standard-delmål ${defaultTarget} timer${fields.requiresTherapist ? ", kræver terapeut" : ""})`,
      });
      showToast(`Kategorien "${label}" oprettet`);
    } else {
      const old = CATEGORIES[editingCatKey];
      if (!old) return;
      await updateCategory(editingCatKey, fields);
      const changes: string[] = [];
      if (old.label !== label)
        changes.push(`navn fra "${old.label}" til "${label}"`);
      if (old.short !== short) changes.push(`kort navn til "${short}"`);
      if (old.defaultTarget !== defaultTarget)
        changes.push(
          `standard-delmål fra ${old.defaultTarget} til ${defaultTarget}`,
        );
      if (!!old.requiresTherapist !== fields.requiresTherapist)
        changes.push(
          fields.requiresTherapist
            ? "kræver nu terapeut"
            : "kræver ikke længere terapeut",
        );
      if (old.color !== fields.color) changes.push("farve");
      if (changes.length > 0) {
        onLog({
          actor: "Administrator",
          description: `Administrator ændrede kategorien "${old.label}": ${changes.join(", ")}`,
        });
      }
      showToast(`Kategorien "${label}" gemt`);
    }
    cancelCat();
  };

  const moveCat = async (key: string, dir: number) => {
    const arr = Object.entries(CATEGORIES);
    const activeIdx = arr
      .map(([, c], idx) => (c.archived ? -1 : idx))
      .filter((idx) => idx >= 0);
    const pos = activeIdx.findIndex((idx) => arr[idx][0] === key);
    const other = activeIdx[pos + dir];
    if (pos < 0 || other === undefined) return;
    const i = activeIdx[pos];
    [arr[i], arr[other]] = [arr[other], arr[i]];
    await reorderCategories(arr.map(([k]) => k));
  };

  const deleteCat = async (key: string) => {
    const c = CATEGORIES[key];
    if (!c || countFor(key) > 0 || activeCats.length <= 1) {
      setConfirmCatAction(null);
      return;
    }
    await deleteCategory(key);
    onLog({
      actor: "Administrator",
      description: `Administrator slettede kategorien "${c.label}" (havde ingen registreringer)`,
    });
    showToast(`Kategorien "${c.label}" slettet`);
    setConfirmCatAction(null);
  };

  const setArchived = async (key: string, archived: boolean) => {
    const c = CATEGORIES[key];
    if (!c) return;
    if (archived && activeCats.length <= 1) {
      setConfirmCatAction(null);
      return;
    }
    await updateCategory(key, { archived });
    onLog({
      actor: "Administrator",
      description: archived
        ? `Administrator arkiverede kategorien "${c.label}" (${countFor(key)} registreringer bevares, men tæller ikke med i regnskabet)`
        : `Administrator genaktiverede kategorien "${c.label}"`,
    });
    showToast(
      archived
        ? `Kategorien "${c.label}" arkiveret`
        : `Kategorien "${c.label}" genaktiveret`,
    );
    setConfirmCatAction(null);
  };

  const catForm = categoryDraft && (
    <div
      className="border-t border-border px-4 pb-4 pt-3.5"
      style={{ borderTop: "none", paddingTop: 16 }}
    >
      <div className="flex gap-3">
        <Field label="Navn">
          <input
            type="text"
            value={categoryDraft.label}
            onChange={(e) =>
              setCategoryDraft({ ...categoryDraft, label: e.target.value })
            }
            placeholder="Fx Supervision"
          />
        </Field>
        <Field
          label="Kort navn"
          hint="Vises på knapperne, når kursisten registrerer."
        >
          <input
            type="text"
            value={categoryDraft.short}
            onChange={(e) =>
              setCategoryDraft({ ...categoryDraft, short: e.target.value })
            }
            placeholder="Fx Supervision"
          />
        </Field>
      </div>
      <Field
        label="Standard-delmål for nye hold"
        hint="Foreslås, når der oprettes nye hold og uddannelser. Ændrer ikke eksisterende hold."
      >
        <input
          type="number"
          min="0"
          value={categoryDraft.defaultTarget}
          onChange={(e) =>
            setCategoryDraft({
              ...categoryDraft,
              defaultTarget: Number(e.target.value),
            })
          }
        />
      </Field>
      <div className="mb-3.5 block">
        <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
          Farve
        </span>
        <div className="swatch-row">
          {CATEGORY_PALETTE.map((p) => (
            <button
              key={p.color}
              type="button"
              className={`swatch ${categoryDraft.color === p.color ? "active" : ""}`}
              style={{ background: p.color }}
              title={p.color}
              onClick={() =>
                setCategoryDraft({
                  ...categoryDraft,
                  color: p.color,
                  soft: p.soft,
                })
              }
            />
          ))}
        </div>
      </div>
      <ToggleButton
        label='Kræver "Navn på terapeut" ved registrering'
        checked={categoryDraft.requiresTherapist}
        onChange={(requiresTherapist) =>
          setCategoryDraft({ ...categoryDraft, requiresTherapist })
        }
      />
      <div className="mb-3.5 block" style={{ marginTop: 12 }}>
        <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
          Sådan ser knappen ud for kursisten
        </span>
        <div className="flex flex-wrap gap-2" style={{ marginTop: 6 }}>
          <CategoryPill
            cat={{
              ...categoryDraft,
              short:
                (categoryDraft.short || "").trim() ||
                categoryDraft.label ||
                "Kategori",
            }}
            active
            onClick={() => {}}
          />
          <CategoryPill
            cat={{
              ...categoryDraft,
              short:
                (categoryDraft.short || "").trim() ||
                categoryDraft.label ||
                "Kategori",
            }}
            active={false}
            onClick={() => {}}
          />
        </div>
      </div>
      {editingCatKey === "__new__" && (
        <p
          className="mt-1 block text-[11px] text-ink-soft"
          style={{ marginTop: 10 }}
        >
          Eksisterende hold og uddannelser får delmål 0 i den nye kategori,
          indtil I sætter et tal under Hold-administration.
        </p>
      )}
      {catError && (
        <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{catError}</div>
      )}
      <div className="mt-4.5 flex gap-2.5">
        <button
          className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
          onClick={cancelCat}
        >
          Annuller
        </button>
        <button
          className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
          onClick={saveCat}
        >
          {editingCatKey === "__new__" ? "Opret kategori" : "Gem kategori"}
        </button>
      </div>
    </div>
  );

  /* ---------- læringsmål ---------- */

  const addGoal = async () => {
    const text = newGoal.trim();
    if (!text) {
      setGoalError("Skriv teksten til læringsmålet.");
      return;
    }
    if (LEARNING_GOALS.includes(text)) {
      setGoalError("Det læringsmål findes allerede.");
      return;
    }
    await createLearningGoal(text);
    onLog({
      actor: "Administrator",
      description: `Administrator tilføjede læringsmålet "${text}"`,
    });
    showToast("Læringsmål tilføjet");
    setNewGoal("");
    setGoalError("");
  };

  const startEditGoal = (i: number) => {
    setEditingGoalIndex(i);
    setGoalDraft(LEARNING_GOALS[i]);
    setGoalError("");
    setConfirmDeleteGoal(null);
  };

  const saveGoal = async (i: number) => {
    const text = goalDraft.trim();
    const old = LEARNING_GOALS[i];
    if (!text) {
      setGoalError("Læringsmålet kan ikke være tomt.");
      return;
    }
    if (text !== old && LEARNING_GOALS.includes(text)) {
      setGoalError("Det læringsmål findes allerede.");
      return;
    }
    if (text !== old) {
      const affected = entries.filter((e) => e.learningGoal === old).length;
      await renameLearningGoal(old, text);
      onLog({
        actor: "Administrator",
        description: `Administrator rettede læringsmålet "${old}" til "${text}"${affected > 0 ? ` (${affected} registreringer opdateret)` : ""}`,
      });
      showToast(
        affected > 0
          ? `Læringsmål rettet — ${affected} registreringer opdateret`
          : "Læringsmål rettet",
      );
    }
    setEditingGoalIndex(null);
    setGoalError("");
  };

  const deleteGoal = async (i: number) => {
    if (LEARNING_GOALS.length <= 1) {
      setGoalError("Der skal være mindst ét læringsmål.");
      setConfirmDeleteGoal(null);
      return;
    }
    const text = LEARNING_GOALS[i];
    const affected = entries.filter((e) => e.learningGoal === text).length;
    await deleteLearningGoal(text);
    onLog({
      actor: "Administrator",
      description: `Administrator fjernede læringsmålet "${text}"${affected > 0 ? ` (${affected} eksisterende registreringer beholder teksten)` : ""}`,
    });
    showToast("Læringsmål fjernet");
    setConfirmDeleteGoal(null);
  };

  const moveGoal = async (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= LEARNING_GOALS.length) return;
    const next = [...LEARNING_GOALS];
    [next[i], next[j]] = [next[j], next[i]];
    await reorderLearningGoals(next);
    setEditingGoalIndex(null);
    setConfirmDeleteGoal(null);
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100vh-80px)] md:max-w-225 md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="px-5 pb-4.5 pt-6.5">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-6.5 w-auto max-w-35 shrink-0 object-contain" />
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
            Administrator
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <div className="mb-0.5 font-display text-[28px] font-semibold">
              Kategorier &amp; læringsmål
            </div>
            <div className="text-[13px] text-ink-soft">
              Tilpas timekategorier og læringsmål til jeres uddannelser
            </div>
          </div>
          <button
            className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
            onClick={() => navigate(routes.adminStudents)}
            title="Kursistvisning"
          >
            <Users2 size={16} />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
          <span className="stitch-line" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-25 pt-1">
        <AdminTabs />

        <div
          className="mt-5.5 flex items-center justify-between"
          style={{ marginTop: 0 }}
        >
          <div
            className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
            style={{ margin: 0 }}
          >
            Timekategorier
          </div>
          {editingCatKey === null && (
            <button
              className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
              onClick={startNewCat}
            >
              <PlusCircle size={14} /> Tilføj kategori
            </button>
          )}
        </div>
        <p
          className="mb-3.5 text-[13px] leading-normal text-ink-soft"
          style={{ marginTop: 0 }}
        >
          Kategorierne er de timetyper, kursisterne registrerer, og som hvert
          hold har delmål for. Rækkefølgen her er også rækkefølgen i appen. En
          kategori uden registreringer kan slettes; har den registreringer, kan
          den arkiveres, så timerne bevares i historikken.
        </p>

        {activeCats.map((c, idx) => {
          const count = countFor(c.key);
          const confirming =
            confirmCatAction && confirmCatAction.key === c.key
              ? confirmCatAction.type
              : null;
          return (
            <div
              className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card"
              key={c.key}
            >
              {editingCatKey === c.key ? (
                catForm
              ) : (
                <div
                  className="border-t border-border px-4 pb-4 pt-3.5"
                  style={{ borderTop: "none" }}
                >
                  <div
                    className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0"
                    style={{ paddingTop: 0 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: c.color,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                      <div>
                        <div className="text-sm font-semibold">{c.label}</div>
                        <div className="mt-px text-xs text-ink-soft">
                          Kort navn: {c.short} · Standard-delmål{" "}
                          {c.defaultTarget} t
                          {c.requiresTherapist ? " · Kræver terapeut" : ""} ·{" "}
                          {count} registreringer
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        disabled={idx === 0 || editingCatKey !== null}
                        onClick={() => moveCat(c.key, -1)}
                        title="Flyt op"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        disabled={
                          idx === activeCats.length - 1 ||
                          editingCatKey !== null
                        }
                        onClick={() => moveCat(c.key, 1)}
                        title="Flyt ned"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        disabled={editingCatKey !== null}
                        onClick={() => startEditCat(c)}
                        title="Redigér"
                      >
                        <Pencil size={14} />
                      </button>
                      {count === 0 ? (
                        <button
                          className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                          disabled={
                            editingCatKey !== null || activeCats.length <= 1
                          }
                          onClick={() =>
                            setConfirmCatAction({ key: c.key, type: "delete" })
                          }
                          title="Slet"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <button
                          className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                          disabled={
                            editingCatKey !== null || activeCats.length <= 1
                          }
                          onClick={() =>
                            setConfirmCatAction({ key: c.key, type: "archive" })
                          }
                          title="Arkivér"
                        >
                          <Archive size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {confirming && (
                    <div className="mb-1" style={{ marginTop: 10 }}>
                      <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                        <AlertTriangle size={14} />
                        {confirming === "delete" ? (
                          <span>
                            "{c.label}" har ingen registreringer og slettes
                            helt.
                          </span>
                        ) : (
                          <span>
                            "{c.label}" har {count} registreringer. Kategorien
                            skjules fra registrering, kategorikort, regnskab og
                            Excel-eksport. Registreringerne bevares og vises
                            stadig i historikken, og I kan genaktivere
                            kategorien når som helst.
                          </span>
                        )}
                      </div>
                      <div
                        className="mt-4.5 flex gap-2.5"
                        style={{ marginTop: 10 }}
                      >
                        <button
                          className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                          onClick={() => setConfirmCatAction(null)}
                        >
                          Annuller
                        </button>
                        <button
                          className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                          onClick={() =>
                            confirming === "delete"
                              ? deleteCat(c.key)
                              : setArchived(c.key, true)
                          }
                        >
                          {confirming === "delete" ? "Ja, slet" : "Ja, arkivér"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {editingCatKey === "__new__" && (
          <div className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card">
            {catForm}
          </div>
        )}

        {archivedCats.length > 0 && (
          <>
            <div
              className="mb-1.5 block text-xs font-semibold text-ink-soft"
              style={{ margin: "18px 0 8px" }}
            >
              Arkiverede kategorier
            </div>
            {archivedCats.map((c) => (
              <div
                className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card"
                key={c.key}
                style={{ opacity: 0.85 }}
              >
                <div
                  className="border-t border-border px-4 pb-4 pt-3.5"
                  style={{ borderTop: "none" }}
                >
                  <div
                    className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0"
                    style={{ paddingTop: 0 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: c.color,
                          flexShrink: 0,
                          marginTop: 4,
                          opacity: 0.6,
                        }}
                      />
                      <div>
                        <div className="text-sm font-semibold">{c.label}</div>
                        <div className="mt-px text-xs text-ink-soft">
                          {countFor(c.key)} registreringer bevares · tæller ikke
                          med i regnskabet
                        </div>
                      </div>
                    </div>
                    <button
                      className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
                      disabled={editingCatKey !== null}
                      onClick={() => setArchived(c.key, false)}
                    >
                      <ArchiveRestore size={14} /> Genaktivér
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <div
          className="mt-4 flex items-center gap-2"
          style={{ margin: "20px 0" }}
        >
          <span className="stitch-line" />
        </div>

        <div
          className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
          style={{ marginTop: 0 }}
        >
          Læringsmål
        </div>
        <p
          className="mb-3.5 text-[13px] leading-normal text-ink-soft"
          style={{ marginTop: 0 }}
        >
          Kursisten vælger ét læringsmål pr. registrering. Retter I teksten på
          et læringsmål, opdateres eksisterende registreringer med. Fjerner I
          et, beholder gamle registreringer deres tekst.
        </p>

        {LEARNING_GOALS.map((g, i) => (
          <div
            className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card"
            key={g}
          >
            <div
              className="border-t border-border px-4 pb-4 pt-3.5"
              style={{ borderTop: "none" }}
            >
              {editingGoalIndex === i ? (
                <>
                  <textarea
                    rows={2}
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <div
                    className="mt-4.5 flex gap-2.5"
                    style={{ marginTop: 8 }}
                  >
                    <button
                      className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                      onClick={() => {
                        setEditingGoalIndex(null);
                        setGoalError("");
                      }}
                    >
                      Annuller
                    </button>
                    <button
                      className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                      onClick={() => saveGoal(i)}
                    >
                      Gem
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0"
                  style={{ paddingTop: 0 }}
                >
                  <div className="text-[13px] leading-snug text-ink">
                    {g}
                  </div>
                  {confirmDeleteGoal === i ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>Fjern?</span>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        onClick={() => deleteGoal(i)}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        onClick={() => setConfirmDeleteGoal(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        disabled={i === 0}
                        onClick={() => moveGoal(i, -1)}
                        title="Flyt op"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        disabled={i === LEARNING_GOALS.length - 1}
                        onClick={() => moveGoal(i, 1)}
                        title="Flyt ned"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        onClick={() => startEditGoal(i)}
                        title="Ret tekst"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        onClick={() => {
                          setConfirmDeleteGoal(i);
                          setEditingGoalIndex(null);
                        }}
                        title="Fjern"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <div
          className="mt-3.5 flex flex-wrap items-center gap-2"
          style={{ marginTop: 8 }}
        >
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addGoal();
            }}
            placeholder="Nyt læringsmål, fx Vidensmål - ..."
            style={{ flex: 1 }}
          />
          <button
            className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
            onClick={addGoal}
          >
            <PlusCircle size={14} /> Tilføj
          </button>
        </div>
        {goalError && (
          <div
            className="-mt-1.5 mb-3 text-xs text-[#a14b36]"
            style={{ marginTop: 8 }}
          >
            {goalError}
          </div>
        )}
      </div>

    </div>
  );
};
