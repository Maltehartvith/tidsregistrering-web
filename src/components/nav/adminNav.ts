import {
  Users2,
  Building2,
  ShieldCheck,
  ListChecks,
  Palette,
} from "lucide-react";
import { routes } from "@/routes";

/** Shared admin tabs — config only; AdminTabs renders it. */
export const adminNavItems = [
  {
    key: "students",
    to: routes.adminStudents,
    label: "Kursister",
    Icon: Users2,
    isActive: (path: string) => path.startsWith(routes.adminStudents),
  },
  {
    key: "course",
    to: routes.adminCourses,
    label: "Hold-administration",
    Icon: Building2,
    isActive: (path: string) => path.startsWith(routes.adminCourses),
  },
  {
    key: "users",
    to: routes.adminUsers,
    label: "Administratorer",
    Icon: ShieldCheck,
    isActive: (path: string) => path.startsWith(routes.adminUsers),
  },
  {
    key: "catalog",
    to: routes.adminCatalog,
    label: "Kategorier & læringsmål",
    Icon: ListChecks,
    isActive: (path: string) => path.startsWith(routes.adminCatalog),
  },
  {
    key: "design",
    to: routes.adminDesign,
    label: "Design",
    Icon: Palette,
    isActive: (path: string) => path.startsWith(routes.adminDesign),
  },
] as const;
