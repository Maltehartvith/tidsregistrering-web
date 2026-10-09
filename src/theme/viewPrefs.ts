import type { TextSize, ViewPrefs } from "../types/ui";

/** Class on <html> for high-contrast mode (same pattern as .dark). */
export const HC_CLASS = "hc";

const STORAGE_KEY = "tidsreg-view-prefs";

export const TEXT_SIZES: {
  key: TextSize;
  label: string;
  /** Preview size relative to root (1rem = 16px at normal). */
  sampleRem: number;
  /** Root font-size when this preference is active. */
  rootPx: number;
}[] = [
  { key: "normal", label: "Normal", sampleRem: 0.9375, rootPx: 16 },
  { key: "stor", label: "Stor", sampleRem: 1.125, rootPx: 18 },
  { key: "ekstra", label: "Ekstra stor", sampleRem: 1.3125, rootPx: 21 },
];

function readStoredPrefs(): Partial<ViewPrefs> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<ViewPrefs>;
  } catch {
    return null;
  }
}

export function saveViewPrefs(prefs: ViewPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / private mode */
  }
}

export function initialViewPrefs(): ViewPrefs {
  if (typeof window === "undefined")
    return { highContrast: false, textSize: "normal" };

  const stored = readStoredPrefs();
  const highContrast =
    typeof stored?.highContrast === "boolean"
      ? stored.highContrast
      : window.matchMedia
        ? window.matchMedia("(prefers-contrast: more)").matches
        : false;

  let textSize: TextSize = "normal";
  if (stored?.textSize === "normal" || stored?.textSize === "stor" || stored?.textSize === "ekstra") {
    textSize = stored.textSize;
  } else {
    const base =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    textSize = base >= 22 ? "ekstra" : base >= 19 ? "stor" : "normal";
  }

  return { highContrast, textSize };
}

export function viewPrefClasses(prefs: ViewPrefs | null | undefined): string {
  if (!prefs) return "";
  return [
    prefs.highContrast ? HC_CLASS : "",
    prefs.textSize && prefs.textSize !== "normal"
      ? `pref-text-${prefs.textSize}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Sync personal view prefs onto <html> (hc + rem-based text scale). */
export function syncViewPrefClasses(prefs: ViewPrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle(HC_CLASS, prefs.highContrast);
  root.classList.toggle("pref-text-stor", prefs.textSize === "stor");
  root.classList.toggle("pref-text-ekstra", prefs.textSize === "ekstra");

  const size =
    TEXT_SIZES.find((t) => t.key === prefs.textSize) ?? TEXT_SIZES[0];
  root.style.fontSize = `${size.rootPx}px`;

  saveViewPrefs(prefs);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      prefs.highContrast
        ? "#000000"
        : getComputedStyle(root).getPropertyValue("--primary").trim() ||
            "#12394a",
    );
  }
}
