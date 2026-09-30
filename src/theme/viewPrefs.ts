import type { TextSize, ViewPrefs } from "../types/ui";

export const TEXT_SIZES: { key: TextSize; label: string; sample: number }[] = [
  { key: "normal", label: "Normal", sample: 15 },
  { key: "stor", label: "Stor", sample: 18 },
  { key: "ekstra", label: "Ekstra stor", sample: 21 },
];

export function initialViewPrefs(): ViewPrefs {
  if (typeof window === "undefined") return { highContrast: false, textSize: "normal" };
  const highContrast = window.matchMedia ? window.matchMedia("(prefers-contrast: more)").matches : false;
  const base = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const textSize: TextSize = base >= 22 ? "ekstra" : base >= 19 ? "stor" : "normal";
  return { highContrast, textSize };
}

export function viewPrefClasses(prefs: ViewPrefs | null | undefined): string {
  if (!prefs) return "";
  return [
    prefs.highContrast ? "pref-hc" : "",
    prefs.textSize && prefs.textSize !== "normal" ? `pref-text-${prefs.textSize}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
