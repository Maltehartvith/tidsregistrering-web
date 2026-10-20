import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  Users2,
  Building2,
  ShieldCheck,
  ListChecks,
  Palette,
} from "lucide-react";
import { routes } from "@/routes";
import { useAuth } from "@/context/AuthContext";
import { isAdministrator } from "@/api/queryKeys";

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
    key: "users",
    to: routes.adminUsers,
    label: "Administratorer",
    Icon: ShieldCheck,
    administratorOnly: true,
    isActive: (path: string) => path.startsWith(routes.adminUsers),
  },
  {
    key: "course",
    to: routes.adminCourses,
    label: "Hold-administration",
    Icon: Building2,
    isActive: (path: string) => path.startsWith(routes.adminCourses),
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
    administratorOnly: true,
    isActive: (path: string) => path.startsWith(routes.adminDesign),
  },
] as const;

export function AdminTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const items = adminNavItems.filter(
    (item) =>
      !("administratorOnly" in item && item.administratorOnly) ||
      isAdministrator(user?.role),
  );

  return (
    <div>
      <div className="flex flex-wrap md:hidden">
        {items.map(({ key, to, label, Icon, isActive }) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate(to)}
            className={`relative flex min-w-[33%] flex-1 cursor-pointer flex-col items-center gap-0.5 border border-border p-2 text-center font-sans text-[0.6rem] font-semibold transition-colors duration-300 ${
              isActive(pathname)
                ? "text-primary bg-primary-100"
                : "text-ink-soft bg-transparent"
            }`}
          >
            <Icon size="1.2em" className="relative z-10" />
            {label}
          </button>
        ))}
      </div>
      <div className="hidden md:flex md:justify-center md:flex-wrap md:gap-2 md:pt-5 md:px-5">
        {items.map(({ key, to, label, Icon, isActive }) => (
          <Button
            key={key}
            variant="secondary"
            className={isActive(pathname) ? "bg-primary-100" : ""}
            onClick={() => navigate(to)}
          >
            <Icon size={14} /> {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
