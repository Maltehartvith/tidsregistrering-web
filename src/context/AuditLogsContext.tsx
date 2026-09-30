import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuditEvent } from "../types/domain";
import type { LogEventArgs } from "../types/log";
import { isStaffRole } from "../api/queryKeys";
import { useAuth } from "./AuthContext";
import * as auditLogsApi from "../api/auditLogs";

export interface AuditLogsContextValue {
  auditLogs: AuditEvent[];
  refreshAuditLogs: () => Promise<void>;
  logEvent: (args: LogEventArgs) => Promise<void>;
}

const AuditLogsContext = createContext<AuditLogsContextValue | null>(null);

export function AuditLogsProvider({ children }: { children: ReactNode }) {
  const { demoMode, user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const canReadLogs = demoMode || isStaffRole(user?.role);

  const refreshAuditLogs = useCallback(async () => {
    if (demoMode) return;
    if (!isStaffRole(user?.role)) return;
    const logs = await auditLogsApi.listAuditLogs();
    setAuditLogs(logs);
  }, [demoMode, user?.role]);

  useEffect(() => {
    if (!canReadLogs || demoMode) return;
    void refreshAuditLogs().catch(() => {
      /* ignore — aktivitetslog er ikke kritisk for app-start */
    });
  }, [canReadLogs, demoMode, refreshAuditLogs]);

  const logEvent = useCallback(
    async ({ actor, studentId, courseId, description }: LogEventArgs) => {
      if (demoMode) {
        setAuditLogs((prev) => [
          {
            id: `log${Math.random().toString(36).slice(2, 9)}`,
            at: new Date(),
            actor,
            studentId: studentId || null,
            courseId: courseId || null,
            description,
          },
          ...prev,
        ]);
        return;
      }
      try {
        const created = await auditLogsApi.createAuditLog({
          actor,
          studentId,
          courseId,
          description,
        });
        setAuditLogs((prev) => [created, ...prev]);
      } catch {
        /* logging must not block the primary action */
      }
    },
    [demoMode],
  );

  return (
    <AuditLogsContext.Provider
      value={{ auditLogs, refreshAuditLogs, logEvent }}
    >
      {children}
    </AuditLogsContext.Provider>
  );
}

export function useAuditLogs() {
  const ctx = useContext(AuditLogsContext);
  if (!ctx) {
    throw new Error("useAuditLogs must be used within AuditLogsProvider");
  }
  return ctx;
}
