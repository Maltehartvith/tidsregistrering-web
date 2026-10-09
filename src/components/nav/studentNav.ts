import { Home, ListChecks, PlusCircle, Settings } from "lucide-react";
import { routes } from "@/routes";

/** Shared student tabs — same items for bottom (mobile) and top (desktop) nav. */
export const studentNavItems = [
  {
    to: routes.studentOverview,
    id: "oversigt",
    label: "Oversigt",
    Icon: Home,
  },
  {
    to: routes.studentCreateEntry,
    id: "registrer",
    label: "Registrér",
    Icon: PlusCircle,
  },
  {
    to: routes.studentHistory,
    id: "historik",
    label: "Historik",
    Icon: ListChecks,
  },
  {
    to: routes.studentSettings,
    id: "indstillinger",
    label: "Indstillinger",
    Icon: Settings,
  },
] as const;

export type StudentNavId = (typeof studentNavItems)[number]["id"];
