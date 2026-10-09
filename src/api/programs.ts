import type { Program, ProgramsMap } from "../types/domain";
import { request } from "./request";

export async function listPrograms(): Promise<ProgramsMap> {
  return request<ProgramsMap>("/programs");
}

export async function createProgram(
  program: Omit<Program, "id"> & { id?: string },
): Promise<Program> {
  return request<Program>("/programs", {
    method: "POST",
    body: JSON.stringify(program),
  });
}

export async function updateProgram(
  id: string,
  program: Partial<Program>,
): Promise<Program> {
  return request<Program>(`/programs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(program),
  });
}

export async function deleteProgram(id: string): Promise<void> {
  await request(`/programs/${encodeURIComponent(id)}`, { method: "DELETE" });
}
