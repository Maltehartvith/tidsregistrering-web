import * as XLSX from "xlsx";
import type { Course, CourseMap } from "@/types/course";
import type { CategoriesMap, ProgramsMap } from "@/types/domain";
import type { TimeEntry } from "@/types/entry";
import type { User } from "@/types/user";
import { categoriesForCourseIds } from "./catalog";
import { totalsForStudentOnHold } from "./totals";

const ALL_COURSES = "alle";

function uniqueExcelSheetName(raw: string, used: Set<string>): string {
  const cleaned = raw.replace(/[:\\/?*[\]]/g, " ").trim() || "Hold";
  const base = cleaned.slice(0, 31);
  let name = base;
  let n = 2;
  while (used.has(name)) {
    const suffix = ` (${n++})`;
    name = `${base.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`;
  }
  used.add(name);
  return name;
}

function fileSafe(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim() || "hold";
}

const EXCEL_MDW = 6;
const COLUMN_PADDING_PX = 4;

function columnWidths(rows: (string | number)[][]): XLSX.ColInfo[] {
  if (rows.length === 0) return [];
  const colCount = Math.max(...rows.map((row) => row.length), 0);
  return Array.from({ length: colCount }, (_, col) => {
    let maxChars = 0;
    for (const row of rows) {
      const value = row[col];
      if (value == null) continue;
      maxChars = Math.max(maxChars, String(value).length);
    }
    return { wch: maxChars + COLUMN_PADDING_PX / EXCEL_MDW };
  });
}

function coursesToExport(
  courseId: string,
  courses: CourseMap,
): Course[] {
  if (courseId === ALL_COURSES) return Object.values(courses);
  const course = courses[courseId];
  return course ? [course] : [];
}

function studentsOnCourse(students: User[], courseId: string): User[] {
  return students
    .filter((student) =>
      student.courses.some((course) => course.id === courseId),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "da"));
}

function rowsForCourse(
  courseId: string,
  students: User[],
  entries: TimeEntry[],
  courses: CourseMap,
  programs: ProgramsMap,
  categories: CategoriesMap,
): (string | number)[][] {
  const courseCategories = categoriesForCourseIds(
    [courseId],
    courses,
    programs,
    categories,
  );
  const headers = [
    "Navn",
    "Email",
    ...courseCategories.map((category) => category.label),
  ];
  const body = studentsOnCourse(students, courseId).map((student) => {
    const totals = totalsForStudentOnHold(
      student,
      entries,
      courseId,
      categories,
    );
    return [
      student.name,
      student.email,
      ...courseCategories.map((category) => totals[category.key] ?? 0),
    ];
  });
  return [headers, ...body];
}

export function downloadCourseStudentsExcel({
  courseId,
  students,
  entries,
  courses,
  programs,
  categories,
}: {
  courseId: string;
  students: User[];
  entries: TimeEntry[];
  courses: CourseMap;
  programs: ProgramsMap;
  categories: CategoriesMap;
}): void {
  const selectedCourses = coursesToExport(courseId, courses);
  if (selectedCourses.length === 0) return;

  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const course of selectedCourses) {
    const rows = rowsForCourse(
      course.id,
      students,
      entries,
      courses,
      programs,
      categories,
    );
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = columnWidths(rows);
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      uniqueExcelSheetName(course.key || course.label, usedNames),
    );
  }
  const date = new Date().toISOString().split("T")[0];
  const fileLabel =
    courseId === ALL_COURSES
      ? "alle-hold"
      : fileSafe(courses[courseId]?.key || courses[courseId]?.label || "hold");
  XLSX.writeFile(workbook, `kursister-${fileLabel}-${date}.xlsx`);
}
