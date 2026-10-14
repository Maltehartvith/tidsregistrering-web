import { useStudents } from "@/context/StudentsContext";
import CourseHistory from "./components/CourseHistory";
import Registrations from "./components/Registrations";
import ActivityLog from "./components/ActivityLog";
import DangerZone from "./components/DangerZone";
import PersonalInfo from "./components/PersonalInfo";

export function StudentDetails() {
  const { selectedStudent } = useStudents();

  if (!selectedStudent) {
    return <div>Kursist ikke fundet</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <PersonalInfo />
      <CourseHistory />
      <Registrations />
      <ActivityLog />

      <div className="mt-4 flex items-center gap-2">
        <span className="stitch-line" />
      </div>

      <DangerZone />
    </div>
  );
}
