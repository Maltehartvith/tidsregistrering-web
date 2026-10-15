import { EntryForm } from "@/components/ui/EntryForm";
import { useCatalog } from "@/context/CatalogContext";
import { useEntries } from "@/context/EntriesContext";
import { categoryOf } from "@/domain/catalog";
import { emptyForm } from "@/domain/entryForm";
import { activeCourseId } from "@/domain/userCourses";
import { routes } from "@/routes";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentOutlet } from "./StudentLayout";

export const CreateEntryTab = () => {
  const { student } = useStudentOutlet();
  const navigate = useNavigate();
  const { CATEGORIES, ALL_CATEGORIES, LEARNING_GOALS } = useCatalog({
    categories: true,
    goals: true,
  });
  const homeCourseId = activeCourseId(student);
  const [form, setForm] = useState(
    emptyForm(homeCourseId, CATEGORIES, LEARNING_GOALS),
  );
  const { createEntry, isSaving } = useEntries({ list: false });

  const handleAdd = async () => {
    if (!form.hours || Number(form.hours) <= 0) return;
    await createEntry(
      {
        ...form,
        userId: student.id,
        courseId: homeCourseId ?? "",
        hours: Number(form.hours),
      },
      {
        toastSuccessMessage: "Registrering gemt",
        logArgs: {
          userId: student.id,
          description: `${student.name} registrerede ${form.hours} timer (${categoryOf(ALL_CATEGORIES, form.category).label})`,
        },
      },
    );
    setForm(emptyForm(homeCourseId, CATEGORIES, LEARNING_GOALS));
    navigate(routes.studentOverview);
  };

  return (
    <>
      <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
        Registrér timer
      </div>
      <EntryForm
        values={form}
        onChange={setForm}
        onSubmit={handleAdd}
        submitLabel={isSaving ? "Gemmer…" : "Gem registrering"}
        submitting={isSaving}
      />
    </>
  );
};
