import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Archive,
  ArchiveRestore,
  Calendar,
} from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useEntries } from "@/context/EntriesContext";
import { categoryKeyFromLabel } from "@/domain/catalog";
import { CATEGORY_PALETTE } from "@/data/constants";
import { Field } from "@/components/ui/Field";
import ToggleButton from "@/components/ui/ToggleButton";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { Category } from "@/types/domain";
import { useActorLabel } from "@/domain/actor";
import Input from "@/components/ui/Input";
import SectionHeader from "../../components/SectionHeader";
import { Button } from "@/components/ui/Button";
import { NumberInput } from "@/components/ui/NumberInput";

export default function CategoriesSection() {
  const actor = useActorLabel();
  const {
    ALL_CATEGORIES: CATEGORIES,
    programs,
    createCategory,
    updateCategory,
    reorderCategories,
    deleteCategory,
    isSaving,
  } = useCatalog({ categories: true, programs: true });
  const { entries } = useEntries();
  const [editingCatKey, setEditingCatKey] = useState<string | null>(null); // en kategori-nøgle, "__new__" eller null
  const [categoryDraft, setCategoryDraft] = useState<Category | null>(null);
  const [catError, setCatError] = useState("");
  const [confirmCatAction, setConfirmCatAction] = useState<{
    key: string;
    type: "delete" | "archive";
  } | null>(null); // { key, type: "delete" | "archive" }

  const catList = Object.values(CATEGORIES);
  const activeCats = catList.filter((c) => !c.archived);
  const archivedCats = catList.filter((c) => c.archived);
  const countFor = (key: string) =>
    entries.filter((e) => e.category === key).length;

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
      id: "",
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

    const fields: Omit<Category, "key" | "id"> = {
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
      for (const x of Object.values(programs)) {
        for (const k of Object.keys(x.targets || {})) {
          taken[k] = true;
        }
      }
      const key = categoryKeyFromLabel(label, taken);
      await createCategory(
        { key, ...fields },
        {
          toastSuccessMessage: `Kategorien "${label}" oprettet`,
          logArgs: {
            description: `${actor} oprettede kategorien "${label}" (standard-delmål ${defaultTarget} timer${fields.requiresTherapist ? ", kræver terapeut" : ""})`,
          },
        },
      );
    } else {
      const old = CATEGORIES[editingCatKey];
      if (!old) return;
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
      await updateCategory(editingCatKey, fields, {
        toastSuccessMessage: `Kategorien "${label}" gemt`,
        logArgs:
          changes.length > 0
            ? {
                description: `${actor} ændrede kategorien "${old.label}": ${changes.join(", ")}`,
              }
            : null,
      });
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
    await deleteCategory(key, {
      toastSuccessMessage: `Kategorien "${c.label}" slettet`,
      logArgs: {
        description: `${actor} slettede kategorien "${c.label}" (havde ingen registreringer)`,
      },
    });
    setConfirmCatAction(null);
  };

  const setArchived = async (key: string, archived: boolean) => {
    const c = CATEGORIES[key];
    if (!c) return;
    if (archived && activeCats.length <= 1) {
      setConfirmCatAction(null);
      return;
    }
    await updateCategory(
      key,
      { archived },
      {
        toastSuccessMessage: archived
          ? `Kategorien "${c.label}" arkiveret`
          : `Kategorien "${c.label}" genaktiveret`,
        logArgs: {
          description: archived
            ? `${actor} arkiverede kategorien "${c.label}" (${countFor(key)} registreringer bevares, men tæller ikke med i regnskabet)`
            : `${actor} genaktiverede kategorien "${c.label}"`,
        },
      },
    );
    setConfirmCatAction(null);
  };

  const catForm = categoryDraft && (
    <div
      className="border-t border-border px-4 pb-4 pt-3.5"
      style={{ borderTop: "none", paddingTop: 16 }}
    >
      <div className="flex justify-around flex-wrap gap-4 mb-4 md:mb-0">
        <Field label="Navn" className="flex-1">
          <Input
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
          className="flex-1"
        >
          <Input
            type="text"
            value={categoryDraft.short}
            onChange={(e) =>
              setCategoryDraft({ ...categoryDraft, short: e.target.value })
            }
            placeholder="Fx Supervision"
          />
        </Field>
        <Field
          label="Foreslået timekrav"
          hint="Bruges som forslag, når kategorien tilføjes til en uddannelse. Kategorien vises ikke, før den er tilføjet."
          className="flex-1"
        >
          <NumberInput
            min={0}
            value={categoryDraft.defaultTarget}
            onChange={(e) =>
              setCategoryDraft({
                ...categoryDraft,
                defaultTarget: Number(e.target.value),
              })
            }
          />
        </Field>
      </div>

      <div className="mb-3.5 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-20">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Farve
          </span>
          <div className="grid grid-cols-4 gap-2">
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
        <div>
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
        <ToggleButton
          label='Kræver "Navn på terapeut" ved registrering'
          checked={categoryDraft.requiresTherapist}
          onChange={(requiresTherapist) =>
            setCategoryDraft({ ...categoryDraft, requiresTherapist })
          }
          className="flex text-md gap-4"
        />
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
        <Button variant="secondary" className="w-full" onClick={cancelCat}>
          Annuller
        </Button>
        <Button
          variant="primary"
          className="w-full"
          onClick={saveCat}
          disabled={isSaving}
          aria-busy={isSaving}
        >
          {isSaving
            ? "Gemmer…"
            : editingCatKey === "__new__"
              ? "Opret kategori"
              : "Gem kategori"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <SectionHeader icon={<Calendar size={20} />} title="Timekategorier" />

        {editingCatKey === null && (
          <Button variant="pill" size="xsmall" onClick={startNewCat}>
            <PlusCircle size={14} /> Tilføj kategori
          </Button>
        )}
      </div>
      <p className="mb-3.5 text-sm leading-normal text-ink-soft">
        Kategorierne er de timetyper, kursisterne registrerer, og som hvert hold
        har delmål for. Rækkefølgen her er også rækkefølgen i appen. En kategori
        uden registreringer kan slettes; har den registreringer, kan den
        arkiveres, så timerne bevares i historikken.
      </p>

      {editingCatKey === "__new__" && (
        <div className="mb-2.5 overflow-hidden rounded-lg border border-border bg-card">
          {catForm}
        </div>
      )}

      {activeCats.map((c, idx) => {
        const count = countFor(c.key);
        const confirming =
          confirmCatAction && confirmCatAction.key === c.key
            ? confirmCatAction.type
            : null;
        return (
          <div
            className="mb-2.5 overflow-hidden rounded-lg border border-border bg-card"
            key={c.key}
          >
            {editingCatKey === c.key ? (
              catForm
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-between gap-2.5 ">
                  <div className="flex gap-2">
                    <span
                      className="size-2.5 mt-1 rounded-full"
                      style={{ background: c.color }}
                    />
                    <div>
                      <div className="text-sm font-semibold">{c.label}</div>
                      <div className="mt-px text-xs text-ink-soft">
                        Kort navn: {c.short} · Standard-delmål {c.defaultTarget}{" "}
                        t{c.requiresTherapist ? " · Kræver terapeut" : ""} ·{" "}
                        {count} registreringer
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="icon"
                      size="icon"
                      disabled={idx === 0 || editingCatKey !== null}
                      onClick={() => moveCat(c.key, -1)}
                      title="Flyt op"
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      variant="icon"
                      size="icon"
                      disabled={
                        idx === activeCats.length - 1 || editingCatKey !== null
                      }
                      onClick={() => moveCat(c.key, 1)}
                      title="Flyt ned"
                    >
                      <ArrowDown size={14} />
                    </Button>
                    <Button
                      variant="icon"
                      size="icon"
                      disabled={editingCatKey !== null}
                      onClick={() => startEditCat(c)}
                      title="Redigér"
                    >
                      <Pencil size={14} />
                    </Button>
                    {count === 0 ? (
                      <Button
                        variant="icon"
                        size="icon"
                        disabled={
                          editingCatKey !== null || activeCats.length <= 1
                        }
                        onClick={() =>
                          setConfirmCatAction({
                            key: c.key,
                            type: "delete",
                          })
                        }
                        title="Slet"
                      >
                        <Trash2 size={14} />
                      </Button>
                    ) : (
                      <Button
                        variant="icon"
                        size="icon"
                        disabled={
                          editingCatKey !== null || activeCats.length <= 1
                        }
                        onClick={() =>
                          setConfirmCatAction({
                            key: c.key,
                            type: "archive",
                          })
                        }
                        title="Arkivér"
                      >
                        <Archive size={14} />
                      </Button>
                    )}
                  </div>
                </div>
                {confirming && (
                  <div className="my-2">
                    <div className="flex items-start gap-1.5 text-xs leading-normal text-secondary">
                      <AlertTriangle size={14} />
                      {confirming === "delete" ? (
                        <span>
                          "{c.label}" har ingen registreringer og slettes helt.
                        </span>
                      ) : (
                        <span>
                          "{c.label}" har {count} registreringer. Kategorien
                          skjules fra registrering, kategorikort, regnskab og
                          Excel-eksport. Registreringerne bevares og vises
                          stadig i historikken, og I kan genaktivere kategorien
                          når som helst.
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2.5">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setConfirmCatAction(null)}
                      >
                        Annuller
                      </Button>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() =>
                          confirming === "delete"
                            ? deleteCat(c.key)
                            : setArchived(c.key, true)
                        }
                      >
                        {confirming === "delete" ? "Ja, slet" : "Ja, arkivér"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {archivedCats.length > 0 && (
        <>
          <div className="mb-1.5 mt-4 block text-xs font-semibold text-ink-soft">
            Arkiverede kategorier
          </div>
          {archivedCats.map((c) => (
            <div
              className="mb-2.5 overflow-hidden rounded-lg border border-border bg-card opacity-85"
              key={c.key}
            >
              <div className="p-4">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex gap-2 items-start min-w-0">
                    <span
                      className="size-2.5 mt-1 rounded-full"
                      style={{ background: c.color }}
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
    </>
  );
}
