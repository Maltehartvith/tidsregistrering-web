import { Check, ClockCheck, Pencil, PlusCircle, Trash2, X } from "lucide-react";
import SectionHeader from "@/pages/admin/components/SectionHeader";
import { Button } from "@/components/ui/Button";
import { TimeEntry } from "@/types/entry";
import { useState } from "react";
import { emptyForm } from "@/domain/entryForm";
import { categoryOf } from "@/domain/catalog";
import { EntryForm } from "@/components/ui/EntryForm";
import { courseLabel } from "@/domain/totals";
import { activeCourseId } from "@/domain/userCourses";
import { useActorLabel } from "@/domain/actor";
import { useEntries } from "@/context/EntriesContext";
import { useStudents } from "@/context/StudentsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";

const Registrations = () => {
  const { selectedStudent } = useStudents();
  const { entries, createEntry, updateEntry, deleteEntry, isSaving } =
    useEntries();
  const { ALL_CATEGORIES: allCategories, LEARNING_GOALS: learningGoals } =
    useCatalog({ categories: true, goals: true });
  const { courses } = useCourses();
  const actor = useActorLabel();
  const homeCourseId = selectedStudent
    ? activeCourseId(selectedStudent)
    : null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(() =>
    emptyForm(homeCourseId || "", {}, learningGoals),
  );
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState(() =>
    emptyForm(homeCourseId || "", {}, learningGoals),
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!selectedStudent) return null;

  const studentEntries = entries
    .filter((e) => e.userId === selectedStudent.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const courseOptions = [
    ...(homeCourseId && courses[homeCourseId] ? [courses[homeCourseId]] : []),
    ...Object.values(courses).filter((h) => h.id !== homeCourseId),
  ];

  const startEdit = (entry: TimeEntry) => {
    setEditingId(entry.id as string);
    setEditForm({ ...entry, hours: String(entry.hours) });
    setConfirmId(null);
    setAddingNew(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateEntry(
      editingId,
      {
        ...editForm,
        hours: Number(editForm.hours),
      },
      {
        toastSuccessMessage: "Registrering opdateret",
        logArgs: {
          userId: selectedStudent.id,
          description: `${actor} rettede en registrering for ${selectedStudent.name} (${categoryOf(allCategories, editForm.category).label})`,
        },
      },
    );
    setEditingId(null);
  };

  const removeEntry = async (id: string) => {
    const removed = studentEntries.find((e) => e.id === id);
    await deleteEntry(id, {
      toastSuccessMessage: "Registrering slettet",
      logArgs: removed
        ? {
            userId: selectedStudent.id,
            description: `${actor} slettede en registrering på ${removed.hours} timer for ${selectedStudent.name} (${categoryOf(allCategories, removed.category).label})`,
          }
        : null,
    });
    setConfirmId(null);
  };

  const addEntry = async () => {
    if (!newForm.hours || Number(newForm.hours) <= 0) return;
    await createEntry(
      {
        userId: selectedStudent.id,
        ...newForm,
        hours: Number(newForm.hours),
      },
      {
        toastSuccessMessage: "Registrering tilføjet",
        logArgs: {
          userId: selectedStudent.id,
          description: `${actor} tilføjede ${newForm.hours} timer for ${selectedStudent.name} (${categoryOf(allCategories, newForm.category).label})`,
        },
      },
    );
    setNewForm(emptyForm(homeCourseId, {}, learningGoals));
    setAddingNew(false);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <SectionHeader icon={<ClockCheck size={20} />} title="Registreringer" />
        {!addingNew && (
          <Button
            variant="ghost"
            size="small"
            onClick={() => {
              setAddingNew(true);
              setEditingId(null);
              setNewForm(emptyForm(homeCourseId, {}, learningGoals));
            }}
          >
            <PlusCircle size={14} /> Tilføj
          </Button>
        )}
      </div>

      {addingNew && (
        <div className="mb-2.5 rounded-xl border border-border bg-card px-3.5 py-3">
          <EntryForm
            values={newForm}
            onChange={setNewForm}
            onSubmit={addEntry}
            onCancel={() => setAddingNew(false)}
            submitLabel="Tilføj registrering"
            submitting={isSaving}
            showHoldField
            holdOptions={courseOptions}
          />
        </div>
      )}

      {studentEntries.length === 0 && !addingNew && (
        <div className="px-2.5 py-10 text-center text-[13px] text-ink-soft">
          Ingen registreringer endnu.
        </div>
      )}

      {studentEntries.map((e) => {
        const cat = categoryOf(allCategories, e.category);
        if (editingId === e.id) {
          return (
            <div
              className="mb-2.5 rounded-lg border border-border bg-card px-3.5 py-3"
              key={e.id}
            >
              <EntryForm
                values={editForm}
                onChange={setEditForm}
                onSubmit={saveEdit}
                onCancel={() => setEditingId(null)}
                submitLabel="Gem ændring"
                submitting={isSaving}
                showHoldField
                holdOptions={courseOptions}
              />
            </div>
          );
        }
        return (
          <div
            className="mb-2.5 rounded-xl border border-border bg-card px-3.5 py-3"
            key={e.id}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: cat.color }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: cat.color }}
              >
                {cat.label}
              </span>
              <span className="ml-auto font-mono text-[11px] text-ink-soft">
                {e.date}
              </span>
            </div>
            <div className="mt-1.5 flex items-end justify-between">
              <div>
                <div className="font-mono text-xl font-semibold">
                  {e.hours} timer
                </div>
                {e.therapist && (
                  <div className="mt-0.5 text-xs text-ink-soft">
                    Terapeut: {e.therapist}
                  </div>
                )}
                <div className="mt-0.5 text-xs text-ink-soft">
                  Hold: {courseLabel(e.courseId, courses)}
                </div>
              </div>
              {confirmId === e.id ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <span>Slet?</span>
                  <Button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => removeEntry(e.id ?? "")}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => setConfirmId(null)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <Button variant="primary" onClick={() => startEdit(e)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setConfirmId(e.id ?? "")}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-1.5 text-xs leading-snug text-ink-soft">
              {e.learningGoal}
            </div>
            {e.notes && (
              <div className="mt-1.5 text-xs leading-snug text-ink-soft">
                {e.notes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Registrations;
