import { Button } from "@/components/ui/Button";
import { useEntries } from "@/context/EntriesContext";
import { useStudents } from "@/context/StudentsContext";
import { useActorLabel } from "@/domain/actor";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import SectionHeader from "@/pages/admin/components/SectionHeader";

const DangerZone = () => {
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(false);
  const { selectedStudent, setSelectedStudent, deleteStudent, isSaving } =
    useStudents();
  const { entries } = useEntries();
  const actor = useActorLabel();
  if (!selectedStudent) return null;

  const registrationCount = entries.filter(
    (entry) => entry.userId === selectedStudent.id,
  ).length;

  const handleDeleteStudent = async () => {
    await deleteStudent(selectedStudent.id, {
      toastSuccessMessage: "Kursist slettet",
      logArgs: {
        userId: selectedStudent.id,
        description: `${actor} slettede ${selectedStudent.name} og ${registrationCount} registreringer permanent`,
      },
    });
    setSelectedStudent(null);
  };
  return (
    <div className="p-5 bg-red-600/20 border border-red-600/30 border-dashed rounded-xl m-4">
      <SectionHeader
        icon={<AlertTriangle size={20} />}
        title="Faresone"
        className="text-red-800 mb-4"
      />
      {confirmDeleteStudent ? (
        <div className="my-6 mb-1.5 rounded-xl border-[1.5px] border-dashed border-red-600/30 p-3.5">
          <div className="font-mono uppercase tracking-[0.08em] text-black-400">
            Bekræft sletning
          </div>
          <p className="mb-3.5 text-[13px] leading-normal text-black-400">
            {selectedStudent.name} og alle {registrationCount} registreringer
            slettes permanent. Dette kan ikke fortrydes.
          </p>
          <div className="mt-4 flex justify-center gap-10 ">
            <Button
              onClick={() => setConfirmDeleteStudent(false)}
              variant="secondary"
            >
              Annuller
            </Button>
            <Button
              onClick={handleDeleteStudent}
              variant="primary"
              className="bg-red-700 text-white hover:bg-red-800"
              disabled={isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? "Sletter…" : "Ja, slet permanent"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          className="bg-red-700 text-white hover:bg-red-800"
          onClick={() => setConfirmDeleteStudent(true)}
        >
          <Trash2 size={14} /> Slet kursist permanent (GDPR)
        </Button>
      )}
    </div>
  );
};

export default DangerZone;
