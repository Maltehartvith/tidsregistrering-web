import type { TimeEntry } from "../types/entry";
import * as entriesApi from "../api/entries";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";

const EMPTY: TimeEntry[] = [];

export function useEntriesQuery() {
  return useDomainQuery({
    queryKey: queryKeys.entries,
    queryFn: entriesApi.listEntries,
    empty: EMPTY,
  });
}

export function useEntriesSetter() {
  return useQuerySetter<TimeEntry[]>(queryKeys.entries, EMPTY);
}

export function useCreateEntry(successMessage?: string) {
  return useDomainMutation({
    mutationFn: entriesApi.createEntry,
    invalidateKeys: [queryKeys.entries],
    successMessage,
  });
}

export function useUpdateEntry(successMessage?: string) {
  return useDomainMutation({
    mutationFn: ({ id, entry }: { id: string; entry: Partial<TimeEntry> }) =>
      entriesApi.updateEntry(id, entry),
    invalidateKeys: [queryKeys.entries],
    successMessage,
  });
}

export function useDeleteEntry(successMessage?: string) {
  return useDomainMutation({
    mutationFn: (id: string) => entriesApi.deleteEntry(id),
    invalidateKeys: [queryKeys.entries],
    successMessage,
  });
}
