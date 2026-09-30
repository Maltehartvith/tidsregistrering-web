import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { TimeEntry } from "../types/entry";
import { useAuth } from "./AuthContext";
import * as entriesApi from "../api/entries";

export interface EntriesContextValue {
  entries: TimeEntry[];
  setEntries: Dispatch<SetStateAction<TimeEntry[]>>;
  createEntry: (
    entry: Omit<TimeEntry, "id"> & { id?: string },
  ) => Promise<TimeEntry>;
  updateEntry: (id: string, entry: Partial<TimeEntry>) => Promise<TimeEntry>;
  deleteEntry: (id: string) => Promise<void>;
}

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({
  entries,
  setEntries,
  children,
}: {
  entries: TimeEntry[];
  setEntries: Dispatch<SetStateAction<TimeEntry[]>>;
  children: ReactNode;
}) {
  const { demoMode } = useAuth();

  const createEntry = useCallback(
    async (entry: Omit<TimeEntry, "id"> & { id?: string }) => {
      if (demoMode) {
        const created: TimeEntry = {
          ...entry,
          id: entry.id || `e${Date.now().toString(36)}`,
        };
        setEntries((prev) => [created, ...prev]);
        return created;
      }
      const created = await entriesApi.createEntry(entry);
      setEntries((prev) => [created, ...prev]);
      return created;
    },
    [demoMode, setEntries],
  );

  const updateEntry = useCallback(
    async (id: string, entry: Partial<TimeEntry>) => {
      if (demoMode) {
        let updated: TimeEntry | undefined;
        setEntries((prev) =>
          prev.map((e) => {
            if (e.id !== id) return e;
            updated = { ...e, ...entry, id };
            return updated;
          }),
        );
        return updated!;
      }
      const updated = await entriesApi.updateEntry(id, entry);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    [demoMode, setEntries],
  );

  const deleteEntryFn = useCallback(
    async (id: string) => {
      if (demoMode) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        return;
      }
      await entriesApi.deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [demoMode, setEntries],
  );

  return (
    <EntriesContext.Provider
      value={{
        entries,
        setEntries,
        createEntry,
        updateEntry,
        deleteEntry: deleteEntryFn,
      }}
    >
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) {
    throw new Error("useEntries must be used within EntriesProvider");
  }
  return ctx;
}
