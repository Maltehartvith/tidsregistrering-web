import type { EntryQuery, EntryPage, EntryUsage } from "../api/entries";
import * as entriesApi from "../api/entries";
import { queryKeys } from "../api/queryKeys";
import { useDomainMutation, useDomainQuery } from "./queryHelpers";
import { useHoldQuery, useQueryHeld } from "./queryGate";

const EMPTY_PAGE: EntryPage = { items: [], total: 0, page: 1, pageSize: 20 };
const EMPTY_USAGE: EntryUsage = { categories: {}, goals: {} };

export function useEntryPage(query: EntryQuery, enabled = true) {
  useHoldQuery("entries", enabled);
  const held = useQueryHeld("entries");

  return useDomainQuery({
    queryKey: [...queryKeys.entries, "page", query],
    queryFn: () => entriesApi.listEntries(query),
    empty: { ...EMPTY_PAGE, page: query.page ?? 1, pageSize: query.pageSize ?? 20 },
    enabled: held && enabled,
  });
}

export function useEntryUsage(enabled = true) {
  useHoldQuery("entries", enabled);
  const held = useQueryHeld("entries");

  return useDomainQuery({
    queryKey: [...queryKeys.entries, "usage"],
    queryFn: entriesApi.entryUsage,
    empty: EMPTY_USAGE,
    enabled: held && enabled,
  });
}

export function useCreateEntry() {
  return useDomainMutation({
    mutationFn: entriesApi.createEntry,
    invalidateKeys: [queryKeys.entries, queryKeys.students, queryKeys.users],
  });
}

export function useUpdateEntry() {
  return useDomainMutation({
    mutationFn: ({ id, entry }: { id: string; entry: Record<string, unknown> }) =>
      entriesApi.updateEntry(id, entry),
    invalidateKeys: [queryKeys.entries, queryKeys.students, queryKeys.users],
  });
}

export function useDeleteEntry() {
  return useDomainMutation({
    mutationFn: (id: string) => entriesApi.deleteEntry(id),
    invalidateKeys: [queryKeys.entries, queryKeys.students, queryKeys.users],
  });
}
