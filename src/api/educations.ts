import type { Education, EducationsMap } from "../types/domain";
import { request } from "./request";

export type EducationWrite = Omit<Education, "id" | "location" | "year"> & {
  location?: string | null;
  year?: number | null;
  locationSpecified?: boolean;
  yearSpecified?: boolean;
};

export async function listEducations(): Promise<EducationsMap> {
  return request<EducationsMap>("/educations");
}

export async function createEducation(
  education: EducationWrite,
): Promise<Education> {
  return request<Education>("/educations", {
    method: "POST",
    body: JSON.stringify(education),
  });
}

export async function updateEducation(
  id: string,
  education: Partial<EducationWrite>,
): Promise<Education> {
  return request<Education>(`/educations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(education),
  });
}

export async function deleteEducation(id: string): Promise<void> {
  await request(`/educations/${encodeURIComponent(id)}`, { method: "DELETE" });
}
