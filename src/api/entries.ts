import { TimeEntry } from "@/types/entry";
import { request } from "./request";

export type EntryQuery = {
  page?: number;
  pageSize?: number;
  userId?: string;
  courseId?: string;
  category?: string;
  q?: string;
};

export type EntryPage = {
  items: TimeEntry[];
  total: number;
  page: number;
  pageSize: number;
};

export type EntryUsage = {
  categories: Record<string, number>;
  goals: Record<string, number>;
};

function entryPath(query: EntryQuery = {}): string {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.userId) params.set("userId", query.userId);
  if (query.courseId) params.set("courseId", query.courseId);
  if (query.category && query.category !== "alle")
    params.set("category", query.category);
  if (query.q?.trim()) params.set("q", query.q.trim());
  const search = params.toString();
  return search ? `/entries?${search}` : "/entries";
}

export async function listEntries(query: EntryQuery = {}): Promise<EntryPage> {
  return request<EntryPage>(entryPath(query));
}

export async function entryUsage(): Promise<EntryUsage> {
  return request<EntryUsage>("/entries/usage");
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
