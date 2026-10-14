import SectionHeader from "@/pages/admin/students/components/SectionHeader";
import { History } from "lucide-react";
import { formatLogTime } from "@/domain/format";
import { useAuditLogs } from "@/context/AuditLogsContext";
import { useStudents } from "@/context/StudentsContext";

const ActivityLog = () => {
  const { selectedStudent } = useStudents();
  const { auditLogs } = useAuditLogs();

  if (!selectedStudent) return null;

  const studentLog = auditLogs.filter(
    (log) => log.studentId === selectedStudent.id,
  );

  return (
    <div>
      <SectionHeader icon={<History size={20} />} title="Aktivitetslog" />
      <p className="mb-3.5 text-[13px] leading-normal text-ink-soft">
        Sporer hvem der har ændret {selectedStudent.name}s timer og
        timeoverførsel, til dokumentation.
      </p>
      {studentLog.length === 0 && (
        <div className="px-2.5 py-10 text-center text-[13px] text-ink-soft">
          Ingen ændringer registreret endnu.
        </div>
      )}
      {studentLog.map((log) => (
        <div
          className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 border-b border-border py-2.5 text-xs last:border-b-0"
          key={log.id}
        >
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${log.actor === "Administrator" ? "border-secondary text-secondary" : "border-border text-ink-soft"}`}
          >
            {log.actor}
          </span>
          <span className="min-w-35 flex-1 text-ink">{log.description}</span>
          <span className="w-full font-mono text-[11px] text-ink-soft">
            {formatLogTime(log.at)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ActivityLog;
