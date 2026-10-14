import {
  createContext,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { TimeEntry } from "../types/entry";
import type { MutationFeedback } from "@/types/log";
import { withFeedback } from "../hooks/queryHelpers";
import {
  useCreateEntry,
  useDeleteEntry,
  useEntriesQuery,
  useEntriesSetter,
  useUpdateEntry,
} from "../hooks/entries";

export interface EntriesContextValue {
  entries: TimeEntry[];
  isLoading: boolean;
  setEntries: Dispatch<SetStateAction<TimeEntry[]>>;
  createEntry: (
    entry: Omit<TimeEntry, "id"> & { id?: string },
    feedback?: MutationFeedback<TimeEntry> | null,
  ) => Promise<TimeEntry>;
  updateEntry: (
    id: string,
    entry: Partial<TimeEntry>,
    feedback?: MutationFeedback<TimeEntry> | null,
  ) => Promise<TimeEntry>;
  deleteEntry: (
    id: string,
    feedback?: MutationFeedback<void> | null,
  ) => Promise<void>;
}

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const { data: entries, isLoading } = useEntriesQuery();
  const setEntries = useEntriesSetter();
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();
  const deleteMutation = useDeleteEntry();

  return (
    <EntriesContext.Provider
      value={{
        entries,
        isLoading,
        setEntries,
        createEntry: (entry, feedback) =>
          createMutation.mutateAsync(withFeedback(entry, feedback)),
        updateEntry: (id, entry, feedback) =>
          updateMutation.mutateAsync(withFeedback({ id, entry }, feedback)),
        deleteEntry: (id, feedback) =>
          deleteMutation.mutateAsync(withFeedback(id, feedback)),
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
