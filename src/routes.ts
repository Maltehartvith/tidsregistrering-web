/** Central URL path map — use these instead of string literals. */
export const routes = {
  login: "/login",
  invite: "/invite",
  resetPassword: "/reset-password",

  studentOverview: "/",
  studentCreateEntry: "/create-entry",
  studentHistory: "/history",
  studentSettings: "/settings",

  adminStudents: "/admin/students",
  adminStudent: (id: string) => `/admin/students/${id}`,
  adminStudentDetail: "/admin/students/:studentId",
  adminCourses: "/admin/courses",
  adminUsers: "/admin/users",
  adminCatalog: "/admin/catalog",
  adminDesign: "/admin/design",
} as const;

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

export function isStudentPath(pathname: string): boolean {
  return (
    pathname === routes.studentOverview ||
    pathname === routes.studentCreateEntry ||
    pathname === routes.studentHistory ||
    pathname === routes.studentSettings
  );
}
