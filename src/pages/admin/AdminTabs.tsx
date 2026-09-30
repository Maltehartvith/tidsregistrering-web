import { useLocation, useNavigate } from "react-router-dom";
import {
  Users2,
  Building2,
  ShieldCheck,
  ListChecks,
  Palette,
} from "lucide-react";
import { Button } from "../../components/ui/Button.tsx";
import { routes } from "../../routes.ts";

const TABS = [
  {
    key: "students",
    to: routes.adminStudents,
    icon: <Users2 size={14} />,
    label: "Kursister",
    isActive: (path: string) => path.startsWith(routes.adminStudents),
  },
  {
    key: "course",
    to: routes.adminCourses,
    icon: <Building2 size={14} />,
    label: "Hold-administration",
    isActive: (path: string) => path.startsWith(routes.adminCourses),
  },
  {
    key: "users",
    to: routes.adminUsers,
    icon: <ShieldCheck size={14} />,
    label: "Administratorer",
    isActive: (path: string) => path.startsWith(routes.adminUsers),
  },
  {
    key: "catalog",
    to: routes.adminCatalog,
    icon: <ListChecks size={14} />,
    label: "Kategorier & læringsmål",
    isActive: (path: string) => path.startsWith(routes.adminCatalog),
  },
  {
    key: "design",
    to: routes.adminDesign,
    icon: <Palette size={14} />,
    label: "Design",
    isActive: (path: string) => path.startsWith(routes.adminDesign),
  },
] as const;

export const AdminTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Button
          key={tab.key}
          variant={tab.isActive(pathname) ? "tabActive" : "tab"}
          onClick={() => navigate(tab.to)}
        >
          {tab.icon} {tab.label}
        </Button>
      ))}
    </div>
  );
}
