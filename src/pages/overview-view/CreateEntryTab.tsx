import { EntryForm } from "@/components/ui/EntryForm";
import { useToast } from "@/components/ui/Toast";
import { useAuditLogs } from "@/context/AuditLogsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useEntries } from "@/context/EntriesContext";
import { categoryOf } from "@/domain/catalog";
import { emptyForm } from "@/domain/entryForm";
import { routes } from "@/routes";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentOutlet } from "./StudentLayout";

export const CreateEntryTab = () => {
  const { student } = useStudentOutlet();
  const navigate = useNavigate();
  const { CATEGORIES, ALL_CATEGORIES, LEARNING_GOALS } = useCatalog();
  const [form, setForm] = useState(
    emptyForm(student.courseId, CATEGORIES, LEARNING_GOALS),
  );
  const { showToast } = useToast();
  const { createEntry } = useEntries();
  const { logEvent } = useAuditLogs();

  const handleAdd = async () => {
    if (!form.hours || Number(form.hours) <= 0) return;
    await createEntry({
      ...form,
      studentId: student.id,
      courseId: student.courseId,
      hours: Number(form.hours),
    });
    void logEvent({
      actor: "Kursist",
      studentId: student.id,
      description: `${student.name} registrerede ${form.hours} timer (${categoryOf(ALL_CATEGORIES, form.category).label})`,
    });
    setForm(emptyForm(student.courseId, CATEGORIES, LEARNING_GOALS));
    showToast("Registrering gemt", 2200, "success");
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
        submitLabel="Gem registrering"
      />
    </>
  );
};
