import { CourseMap } from "@/types/course";
import type { CategoriesMap, ProgramsMap } from "../types/domain";
import type { AdminUser, Student } from "../types/user";
import { TimeEntry } from "@/types/entry";
import { Organization } from "@/types/organization";
import { request } from "./request";

export interface BootstrapPayload {
  branding: Organization;
  categories: CategoriesMap;
  learningGoals: string[];
  programs: ProgramsMap;
  courses: CourseMap;
  students: Student[];
  entries: TimeEntry[];
  adminUsers: AdminUser[];
}

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  return request<BootstrapPayload>("/bootstrap");
}
