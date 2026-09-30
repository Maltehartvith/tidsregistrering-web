export const routes = {
  login: "/login",
  invite: "/invite",
  resetPassword: "/reset-password",
  student: "/",
  adminStudents: "/admin/students",
  adminStudent: (id: string) => `/admin/students/${id}`,
  adminCourses: "/admin/courses",
  adminUsers: "/admin/users",
  adminCatalog: "/admin/catalog",
  adminDesign: "/admin/design",
} as const;

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}
