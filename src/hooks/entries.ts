import type { QueryClient } from "@tanstack/react-query";
import type { TimeEntry } from "../types/entry";
import * as entriesApi from "../api/entries";
import { isStaffRole, queryKeys } from "../api/queryKeys";
import { useAuth } from "../context/AuthContext";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";
import { useQueryHeld } from "./queryGate";

const EMPTY: TimeEntry[] = [];

function writeEntries(
  queryClient: QueryClient,
  update: (prev: TimeEntry[]) => TimeEntry[],
) {
  queryClient.setQueriesData<TimeEntry[]>(
    { queryKey: queryKeys.entries },
    (prev) => update(prev ?? []),
  );
}

export function useEntriesQuery() {
  const { user } = useAuth();
  const held = useQueryHeld("entries");
  const staff = isStaffRole(user?.role);

  return useDomainQuery({
    queryKey: [...queryKeys.entries, staff ? "all" : "self"],
    queryFn: async () => {
      const entries = await entriesApi.listEntries();
      if (staff || !user) return entries;
      return entries.filter((entry) => entry.userId === user.id);
    },
    empty: EMPTY,
    enabled: held,
  });
}

export function useEntriesSetter() {
  return useQuerySetter<TimeEntry[]>(queryKeys.entries, EMPTY);
}

export function useCreateEntry() {
  return useDomainMutation({
    mutationFn: entriesApi.createEntry,
    invalidateKeys: [queryKeys.entries],
    applyResult: (queryClient, data) => {
      writeEntries(queryClient, (prev) =>
        prev.some((entry) => entry.id === data.id) ? prev : [data, ...prev],
      );
    },
  });
}

export function useUpdateEntry() {
  return useDomainMutation({
    mutationFn: ({ id, entry }: { id: string; entry: Partial<TimeEntry> }) =>
      entriesApi.updateEntry(id, entry),
    invalidateKeys: [queryKeys.entries],
    applyResult: (queryClient, data) => {
      writeEntries(queryClient, (prev) =>
        prev.map((entry) => (entry.id === data.id ? data : entry)),
      );
    },
  });
}

export function useDeleteEntry() {
  return useDomainMutation({
    mutationFn: (id: string) => entriesApi.deleteEntry(id),
    invalidateKeys: [queryKeys.entries],
    applyResult: (queryClient, _data, id) => {
      writeEntries(queryClient, (prev) =>
        prev.filter((entry) => entry.id !== id),
      );
    },
  });
}
