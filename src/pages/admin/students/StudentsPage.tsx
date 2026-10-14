import { useStudents } from "@/context/StudentsContext";
import AdminPageWrapper from "@/pages/admin/components/AdminPageWrapper";
import { StudentList } from "./StudentList";
import { StudentDetails } from "./StudentDetails";

export function StudentsPage() {
  const { students, selectedStudent } = useStudents();
  const showDetail = Boolean(selectedStudent);

  return (
    <AdminPageWrapper
      title="Kursister"
      subtitle={`${students.length} kursister på tværs af holdene`}
      wrapContent={false}
    >
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`flex h-full min-h-0 w-full shrink-0 flex-col pl-5 transition-transform duration-300 ease-out motion-reduce:transition-none md:w-90 md:translate-x-0 ${
            showDetail ? "-translate-x-full md:translate-x-0" : "translate-x-0"
          }`}
        >
          <StudentList />
        </div>

        <div className="hidden shrink-0 border-r border-border md:block" />

        <div
          className={`scrollbar-bottom-margin absolute inset-0 md:mr-1 min-h-0 overflow-y-auto bg-paper transition-transform duration-300 ease-out motion-reduce:transition-none md:static md:min-w-0 md:flex-1 md:translate-x-0 md:pointer-events-auto ${
            showDetail
              ? "translate-x-0"
              : "pointer-events-none translate-x-full md:translate-x-0"
          }`}
        >
          {selectedStudent ? (
            <div className="min-h-full px-5 md:px-0 md:pr-2 md:pl-5 pb-10 pt-1">
              <StudentDetails />
            </div>
          ) : (
            <div className="hidden min-h-full items-center justify-center px-6 p-10 text-center text-sm text-ink-soft md:flex">
              Vælg en kursist i listen til venstre for at se og redigere
              detaljer.
            </div>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  );
}
