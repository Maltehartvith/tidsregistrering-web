import {
  createContext,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { TimeEntry } from "../types/entry";
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
  ) => Promise<TimeEntry>;
  updateEntry: (id: string, entry: Partial<TimeEntry>) => Promise<TimeEntry>;
  deleteEntry: (id: string) => Promise<void>;
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
        createEntry: (entry) => createMutation.mutateAsync(entry),
        updateEntry: (id, entry) => updateMutation.mutateAsync({ id, entry }),
        deleteEntry: (id) => deleteMutation.mutateAsync(id),
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
