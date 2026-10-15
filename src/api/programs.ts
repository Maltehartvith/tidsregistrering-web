import type { Program, ProgramsMap } from "../types/domain";
import { request } from "./request";

export type ProgramWrite = Omit<Program, "id">;

export async function listPrograms(): Promise<ProgramsMap> {
  return request<ProgramsMap>("/programs");
}

export async function createProgram(program: ProgramWrite): Promise<Program> {
  return request<Program>("/programs", {
    method: "POST",
    body: JSON.stringify(program),
  });
}

export async function updateProgram(
  id: string,
  program: Partial<ProgramWrite>,
): Promise<Program> {
  return request<Program>(`/programs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(program),
  });
}

export async function deleteProgram(id: string): Promise<void> {
  await request(`/programs/${encodeURIComponent(id)}`, { method: "DELETE" });
}
