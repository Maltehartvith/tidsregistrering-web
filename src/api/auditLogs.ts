import type { AuditEvent } from "@/types/domain";
import { request } from "./request";

type AuditLogDto = {
  id: string;
  at: string;
  actor: string;
  userId?: string;
  courseId?: string;
  description: string;
};

function mapAuditLog(log: AuditLogDto): AuditEvent {
  return {
    id: log.id,
    at: new Date(log.at),
    actor: log.actor,
    userId: log.userId ?? null,
    courseId: log.courseId ?? null,
    description: log.description,
  };
}

export async function listAuditLogs(): Promise<AuditEvent[]> {
  const logs = await request<AuditLogDto[]>("/audit-logs");
  return logs.map(mapAuditLog);
}
