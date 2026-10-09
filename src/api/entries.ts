import { TimeEntry } from "@/types/entry";
import { request } from "./request";

export async function listEntries(): Promise<TimeEntry[]> {
  return request<TimeEntry[]>("/entries");
}

export async function createEntry(
  entry: Omit<TimeEntry, "id"> & { id?: string },
): Promise<TimeEntry> {
  return request<TimeEntry>("/entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function updateEntry(
  id: string,
  entry: Partial<TimeEntry>,
): Promise<TimeEntry> {
  return request<TimeEntry>(`/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(entry),
  });
}

export async function deleteEntry(id: string): Promise<void> {
  await request(`/entries/${id}`, { method: "DELETE" });
}
