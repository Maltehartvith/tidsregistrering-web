export type TextSize = "normal" | "stor" | "ekstra";

export interface ViewPrefs {
  highContrast: boolean;
  textSize: TextSize;
}

export interface OrganizationPreset {
  group: string;
  name: string;
  primary: string;
  accent: string;
  background: string;
}
