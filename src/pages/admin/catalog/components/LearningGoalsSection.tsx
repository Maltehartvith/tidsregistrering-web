import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  BookOpen,
} from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useEntries } from "@/context/EntriesContext";
import { useActorLabel } from "@/domain/actor";
import SectionHeader from "../../components/SectionHeader";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LearningGoalsSection() {
  const actor = useActorLabel();
  const {
    LEARNING_GOALS,
    createLearningGoal,
    renameLearningGoal,
    reorderLearningGoals,
    deleteLearningGoal,
    isSaving,
  } = useCatalog({ goals: true });
  const { entries } = useEntries();
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [goalError, setGoalError] = useState("");
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<number | null>(
    null,
  );

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
    await createLearningGoal(text, {
      toastSuccessMessage: "Læringsmål tilføjet",
      logArgs: {
        description: `${actor} tilføjede læringsmålet "${text}"`,
      },
    });
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
      await renameLearningGoal(old, text, {
        toastSuccessMessage:
          affected > 0
            ? `Læringsmål rettet — ${affected} registreringer opdateret`
            : "Læringsmål rettet",
        logArgs: {
          description: `${actor} rettede læringsmålet "${old}" til "${text}"${affected > 0 ? ` (${affected} registreringer opdateret)` : ""}`,
        },
      });
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
    await deleteLearningGoal(text, {
      toastSuccessMessage: "Læringsmål fjernet",
      logArgs: {
        description: `${actor} fjernede læringsmålet "${text}"${affected > 0 ? ` (${affected} eksisterende registreringer beholder teksten)` : ""}`,
      },
    });
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
    <>
      <SectionHeader
        icon={<BookOpen size={20} />}
        title="Læringsmål"
        className="mb-2"
      />
      <p className="mb-3.5 text-sm leading-normal text-ink-soft">
        Kursisten vælger ét læringsmål pr. registrering. Retter I teksten på et
        læringsmål, opdateres eksisterende registreringer med. Fjerner I et,
        beholder gamle registreringer deres tekst.
      </p>

      {LEARNING_GOALS.map((g, i) => (
        <div
          className="mb-2.5 overflow-hidden rounded-md border border-border bg-card"
          key={g}
        >
          <div className="p-4">
            {editingGoalIndex === i ? (
              <>
                <TextArea
                  rows={2}
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                />
                <div className="mt-2 flex gap-2.5">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setEditingGoalIndex(null);
                      setGoalError("");
                    }}
                  >
                    Annuller
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => saveGoal(i)}
                    disabled={isSaving}
                    aria-busy={isSaving}
                  >
                    {isSaving ? "Gemmer…" : "Gem"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-2.5">
                <div className="text-sm leading-snug text-ink">{g}</div>
                {confirmDeleteGoal === i ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span>Slet?</span>
                    <Button
                      variant="icon"
                      size="icon"
                      onClick={() => deleteGoal(i)}
                    >
                      <Check size={14} />
                    </Button>
                    <Button
                      variant="icon"
                      size="icon"
                      onClick={() => setConfirmDeleteGoal(null)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="icon"
                      size="icon"
                      disabled={i === 0}
                      onClick={() => moveGoal(i, -1)}
                      title="Flyt op"
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      variant="icon"
                      size="icon"
                      disabled={i === LEARNING_GOALS.length - 1}
                      onClick={() => moveGoal(i, 1)}
                      title="Flyt ned"
                    >
                      <ArrowDown size={14} />
                    </Button>
                    <Button
                      variant="icon"
                      size="icon"
                      onClick={() => startEditGoal(i)}
                      title="Ret tekst"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="icon"
                      size="icon"
                      onClick={() => {
                        setConfirmDeleteGoal(i);
                        setEditingGoalIndex(null);
                      }}
                      title="Fjern"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="mt-2.5 flex items-center gap-2 pt-2">
        <div className="min-w-0 flex-1">
          <Input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addGoal();
            }}
            placeholder="Nyt læringsmål, fx Vidensmål - ..."
          />
        </div>
        <Button variant="primary" size="small" onClick={addGoal}>
          <PlusCircle size={14} /> Tilføj
        </Button>
      </div>
      {goalError && (
        <div
          className="-mt-1.5 mb-3 text-xs text-[#a14b36]"
          style={{ marginTop: 8 }}
        >
          {goalError}
        </div>
      )}
    </>
  );
}
