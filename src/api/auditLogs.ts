import type { AuditEvent } from "@/types/domain";
import type { LogEventArgs } from "@/types/log";
import { request } from "./request";

type AuditLogDto = {
  id: string;
  at: string;
  actor: string;
  studentId?: string;
  courseId?: string;
  description: string;
};

function mapAuditLog(log: AuditLogDto): AuditEvent {
  return {
    id: log.id,
    at: new Date(log.at),
    actor: log.actor,
    studentId: log.studentId ?? null,
    courseId: log.courseId ?? null,
    description: log.description,
  };
}

export async function listAuditLogs(): Promise<AuditEvent[]> {
  const logs = await request<AuditLogDto[]>("/audit-logs");
  return logs.map(mapAuditLog);
}

export async function createAuditLog(
  body: LogEventArgs,
): Promise<AuditEvent> {
  const created = await request<AuditLogDto>("/audit-logs", {
    method: "POST",
    body: JSON.stringify({
      actor: body.actor,
      description: body.description,
      studentId: body.studentId || undefined,
      courseId: body.courseId || undefined,
    }),
  });
  return mapAuditLog(created);
}
