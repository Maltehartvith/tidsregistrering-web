import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useEntries } from "@/context/EntriesContext";
import { useActorLabel } from "@/domain/actor";

export default function LearningGoalsSection() {
  const actor = useActorLabel();
  const {
    LEARNING_GOALS,
    createLearningGoal,
    renameLearningGoal,
    reorderLearningGoals,
    deleteLearningGoal,
  } = useCatalog();
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
        Kursisten vælger ét læringsmål pr. registrering. Retter I teksten på et
        læringsmål, opdateres eksisterende registreringer med. Fjerner I et,
        beholder gamle registreringer deres tekst.
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
                <div className="mt-4.5 flex gap-2.5" style={{ marginTop: 8 }}>
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
                <div className="text-[13px] leading-snug text-ink">{g}</div>
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
    </>
  );
}
