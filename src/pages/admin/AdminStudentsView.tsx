import { useParams } from "react-router-dom";
import { AdminKursisterView } from "./AdminKursisterView";
import { AuditEvent } from "@/types/domain";
import { LogEventArgs } from "@/types/log";

type AdminStudentsViewProps = {
  auditLog: AuditEvent[];
  onLog: (args: LogEventArgs) => void;
};
export const AdminStudentsView = ({
  auditLog,
  onLog,
}: AdminStudentsViewProps) => {
  const { studentId } = useParams<{ studentId?: string }>();
  return (
    <AdminKursisterView
      auditLog={auditLog}
      onLog={onLog}
      selectedStudentId={studentId ?? null}
    />
  );
};
