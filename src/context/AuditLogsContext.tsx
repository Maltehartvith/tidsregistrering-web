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
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const canReadLogs = isStaffRole(user?.role);

  const refreshAuditLogs = useCallback(async () => {
    if (!isStaffRole(user?.role)) return;
    const logs = await auditLogsApi.listAuditLogs();
    setAuditLogs(logs);
  }, [user?.role]);

  useEffect(() => {
    if (!canReadLogs) return;
    void refreshAuditLogs().catch(() => {
      /* ignore — aktivitetslog er ikke kritisk for app-start */
    });
  }, [canReadLogs, refreshAuditLogs]);

  const logEvent = useCallback(
    async ({ actor, studentId, courseId, description }: LogEventArgs) => {
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
    [],
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
