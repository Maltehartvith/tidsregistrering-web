import type { Organization } from "@/types/organization";
import type { OrganizationPreset } from "@/types/ui";
import type { AdminRoleMeta } from "@/types/user";

/** App icon used when an organization has no custom logo. */
export const APP_ICON_SRC = "/android-chrome-192x192.png";

/** Years between course start years for “transfer window” eligibility. */
export const TRANSFER_WINDOW_YEARS = 5;

export const CATEGORY_PALETTE = [
  { color: "#8A4F64", soft: "#F2E4E9" },
  { color: "#55744F", soft: "#E7EDE1" },
  { color: "#A9762E", soft: "#F5EBD8" },
  { color: "#12394A", soft: "#DCE7EC" },
  { color: "#5B5F9E", soft: "#E6E7F3" },
  { color: "#2F7D7A", soft: "#DDEEEC" },
  { color: "#9C4A3A", soft: "#F3E0DB" },
  { color: "#6B6B6B", soft: "#ECECEC" },
];

export const ADMIN_ROLES: Record<string, AdminRoleMeta> = {
  administrator: {
    key: "administrator",
    label: "Administrator",
    description:
      "Fuld adgang til de tilknyttede hold: kan oprette hold, importere/tilføje kursister, foretage holdoverførsler, rette kursisters registreringer og invitere andre administratorer eller undervisere.",
  },
  underviser: {
    key: "underviser",
    label: "Underviser",
    description:
      "Kan se og rette kursisters registreringer på de tilknyttede hold (fx ved forkert indtastning). Kan ikke oprette hold, foretage holdoverførsler eller invitere andre.",
  },
};

/** Default brand values used when resetting design draft (not live org data). */
export const DEFAULT_BRANDING: Organization = {
  orgName: "Narrative efteruddannelser",
  appTitle: "Timeregnskab",
  contactEmail: "",
  logo: APP_ICON_SRC,
  primary: "#12394A",
  accent: "#C25A4C",
  background: "#ECEEEA",
  card: "#FAFAF7",
};

export const BRAND_PRESETS: OrganizationPreset[] = [
  {
    group: "",
    name: "DISPUK (standard)",
    primary: "#12394A",
    accent: "#C25A4C",
    background: "#ECEEEA",
    card: "#FAFAF7",
  },
  {
    group: "",
    name: "Grafit",
    primary: "#2B2B2B",
    accent: "#C25A4C",
    background: "#EFEFEC",
    card: "#FFFFFF",
  },
  {
    group: "",
    name: "Nat",
    primary: "#1F2A5A",
    accent: "#B0701E",
    background: "#ECEDF3",
    card: "#F7F8FC",
  },
  {
    group: "",
    name: "Bordeaux",
    primary: "#5C1F2E",
    accent: "#A8793F",
    background: "#F3EEEC",
    card: "#FCFAF9",
  },
  {
    group: "Naturlige og varme",
    name: "Skov",
    primary: "#2F4F3A",
    accent: "#B5793A",
    background: "#EEF0E8",
    card: "#F8F9F4",
  },
  {
    group: "Naturlige og varme",
    name: "Jord",
    primary: "#6B3A2A",
    accent: "#B97A2F",
    background: "#F4EEE7",
    card: "#FCFAF7",
  },
  {
    group: "Naturlige og varme",
    name: "Sand",
    primary: "#4A3F35",
    accent: "#2F7D7A",
    background: "#F2EEE6",
    card: "#FAF8F4",
  },
  {
    group: "Naturlige og varme",
    name: "Oliven",
    primary: "#454B1B",
    accent: "#A0522D",
    background: "#F1F1E6",
    card: "#F9F9F3",
  },
  {
    group: "Kølige",
    name: "Hav",
    primary: "#0F4C5C",
    accent: "#D0654A",
    background: "#EAF1F2",
    card: "#F5FAFB",
  },
  {
    group: "Kølige",
    name: "Nordisk",
    primary: "#1E2A30",
    accent: "#4F7F8C",
    background: "#F3F4F2",
    card: "#FAFBFA",
  },
  {
    group: "Kølige",
    name: "Klar blå",
    primary: "#004E89",
    accent: "#D9512C",
    background: "#EEF3F8",
    card: "#F7FAFC",
  },
  {
    group: "Bløde",
    name: "Aubergine",
    primary: "#4A2545",
    accent: "#2F7D7A",
    background: "#F1ECEF",
    card: "#FAF7F9",
  },
  {
    group: "Bløde",
    name: "Lavendel",
    primary: "#3F3A6B",
    accent: "#B04A74",
    background: "#F0EEF5",
    card: "#F8F7FC",
  },
  {
    group: "Bløde",
    name: "Salvie",
    primary: "#3D5A4C",
    accent: "#B45A76",
    background: "#EEF2EC",
    card: "#F7FAF6",
  },
  {
    group: "Tilgængelighed",
    name: "Høj kontrast",
    primary: "#000000",
    accent: "#B3261E",
    background: "#FFFFFF",
    card: "#F5F5F5",
  },
];
