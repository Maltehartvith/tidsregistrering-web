import { EntryForm } from "@/components/ui/EntryForm";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useEntries } from "@/context/EntriesContext";
import { categoryOf } from "@/domain/catalog";
import { emptyForm } from "@/domain/entryForm";
import { activeCourseIds } from "@/domain/userCourses";
import { routes } from "@/routes";
import type { Course } from "@/types/course";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentOutlet } from "./StudentLayout";

export const CreateEntryTab = () => {
  const { student } = useStudentOutlet();
  const navigate = useNavigate();
  const { courses } = useCourses();
  const { ALL_CATEGORIES, LEARNING_GOALS } = useCatalog({
    categories: true,
    goals: true,
  });
  const courseOptions = activeCourseIds(student)
    .map((id) => courses[id])
    .filter((course): course is Course => Boolean(course));
  const defaultCourseId = courseOptions[0]?.id ?? "";
  const [form, setForm] = useState(() =>
    emptyForm(defaultCourseId, {}, LEARNING_GOALS),
  );
  const { createEntry, isSaving } = useEntries();

  const handleAdd = async () => {
    if (!form.hours || Number(form.hours) <= 0 || !form.courseId) return;
    await createEntry(
      {
        ...form,
        userId: student.id,
        courseId: form.courseId,
        hours: Number(form.hours),
      },
      {
        toastSuccessMessage: "Registrering gemt",
        logArgs: {
          userId: student.id,
          courseId: form.courseId,
          description: `${student.name} registrerede ${form.hours} timer (${categoryOf(ALL_CATEGORIES, form.category).label})`,
        },
      },
    );
    setForm(emptyForm(form.courseId, {}, LEARNING_GOALS));
    navigate(routes.studentOverview);
  };

  return (
    <>
      <div className="mb-2.5 font-display text-[15px] font-semibold text-ink">
        Registrér timer
      </div>
      {courseOptions.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Du er ikke tilknyttet et hold endnu, så du kan ikke registrere timer.
        </p>
      ) : (
        <EntryForm
          values={form}
          onChange={setForm}
          onSubmit={handleAdd}
          submitLabel={isSaving ? "Gemmer…" : "Gem registrering"}
          submitting={isSaving}
          showHoldField
          holdOptions={courseOptions}
        />
      )}
    </>
  );
};
