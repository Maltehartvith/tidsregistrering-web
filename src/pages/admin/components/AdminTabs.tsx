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

export function AdminTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div>
      <div className="grid grid-cols-6 md:hidden">
        {adminNavItems.map(({ key, to, label, Icon, isActive }, index) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate(to)}
            className={`relative border-border border z-10 col-span-2 flex cursor-pointer flex-col items-center gap-0.5 p-2 text-center font-sans text-[0.6rem] font-semibold transition-colors duration-300 ${
              isActive(pathname)
                ? "text-primary bg-primary-100"
                : "text-ink-soft bg-transparent"
            } ${
              index === 1
                ? "border-x-0"
                : index === 3
                  ? "col-start-1 col-span-3 border-t-0 border-r-0"
                  : index === 4
                    ? "col-start-4 col-span-3 border-t-0"
                    : ""
            }`}
          >
            <Icon size="1.2em" className="relative z-10" />
            {label}
          </button>
        ))}
      </div>
      <div className="hidden md:flex md:justify-center md:flex-wrap md:gap-2 md:pt-5 md:px-5">
        {adminNavItems.map(({ key, to, label, Icon, isActive }) => (
          <Button
            key={key}
            variant={isActive(pathname) ? "tabActive" : "tab"}
            onClick={() => navigate(to)}
          >
            <Icon size={14} /> {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
