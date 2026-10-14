import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import { useActorLabel } from "@/domain/actor";
import { MutationFeedback } from "@/types/log";
import { Student } from "@/types/user";
import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";

const PersonalInfo = () => {
  const {
    students,
    selectedStudent,
    updateStudent: persistStudent,
    setSelectedStudent,
  } = useStudents();
  const { courses } = useCourses();
  const actor = useActorLabel();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(selectedStudent?.name || "");
  const [editEmail, setEditEmail] = useState(selectedStudent?.email || "");
  const [profileError, setProfileError] = useState("");

  if (!selectedStudent) {
    return null;
  }

  const startEditProfile = () => {
    setEditName(selectedStudent.name);
    setEditEmail(selectedStudent.email);
    setProfileError("");
    setEditingProfile(true);
  };

  const patchStudent = (
    patch: Partial<Student>,
    feedback?: MutationFeedback<Student> | null,
  ) => persistStudent(selectedStudent.id, patch, feedback);

  const saveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    if (!trimmedName || !trimmedEmail) {
      setProfileError("Udfyld både navn og email.");
      return;
    }
    if (
      students.some(
        (s) =>
          s.id !== selectedStudent.id &&
          s.email.toLowerCase() === trimmedEmail.toLowerCase(),
      )
    ) {
      setProfileError("En anden kursist bruger allerede denne email.");
      return;
    }
    const oldName = selectedStudent.name;
    const oldEmail = selectedStudent.email;
    const changes = [];
    if (trimmedName !== oldName)
      changes.push(`navn fra "${oldName}" til "${trimmedName}"`);
    if (trimmedEmail !== oldEmail)
      changes.push(`email fra "${oldEmail}" til "${trimmedEmail}"`);
    await patchStudent(
      { name: trimmedName, email: trimmedEmail },
      changes.length > 0
        ? {
            toastSuccessMessage: "Oplysninger opdateret",
            logArgs: {
              studentId: selectedStudent.id,
              description: `${actor} ændrede ${changes.join(" og ")}`,
            },
          }
        : null,
    );
    setEditingProfile(false);
  };

  return (
    <div>
      <button
        type="button"
        className="mb-2 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-sans text-[13px] font-semibold text-ink-soft md:hidden"
        onClick={() => setSelectedStudent(null)}
      >
        <ArrowLeft size={15} /> Kursister
      </button>
      <div
        className="mt-2 flex items-start justify-between"
        style={{ marginTop: 10 }}
      >
        {editingProfile ? (
          <div style={{ flex: 1 }}>
            <div className="flex gap-3">
              <Field label="Navn">
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </Field>
            </div>
            {profileError && (
              <div className="-mt-1.5 mb-3 text-xs text-secondary">
                {profileError}
              </div>
            )}
            <div className="mt-6 flex gap-2.5">
              <Button
                variant="secondary"
                onClick={() => setEditingProfile(false)}
              >
                Annuller
              </Button>
              <Button
                onClick={saveProfile}
                variant="primary"
              >
                Gem
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div
                className="mb-0.5 font-display text-[28px] font-semibold"
                style={{ fontSize: 22 }}
              >
                {selectedStudent.name}
              </div>
              <div className="text-[13px] text-ink-soft">
                {selectedStudent.email} ·{" "}
                {courses[selectedStudent.courseId].label}
              </div>
            </div>
            <Button
              variant="primaryIcon"
              onClick={startEditProfile}
              title="Ret navn eller email"
            >
              <Pencil size={16} />
            </Button>
          </>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
        <span className="stitch-line" />
      </div>
    </div>
  );
};

export default PersonalInfo;
