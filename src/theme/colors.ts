import type { Organization } from "../types/organization";

export function hexToRgb(hex: string): [number, number, number] | null {
  const h = String(hex || "").replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

export function isValidHex(hex: string): boolean {
  return hexToRgb(hex) !== null;
}

export function mixHex(a: string, b: string, t: number): string {
  const ra = hexToRgb(a) || ([0, 0, 0] as [number, number, number]);
  const rb = hexToRgb(b) || ([0, 0, 0] as [number, number, number]);
  return (
    "#" +
    ra
      .map((v, i) =>
        Math.round(v + (rb[i] - v) * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export function luminance(hex: string): number {
  const rgb = hexToRgb(hex) || ([0, 0, 0] as [number, number, number]);
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const SCALE_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

export type ScaleStep = (typeof SCALE_STEPS)[number];

/** Mix amounts toward white (positive) or black (negative). 0 = base color. */
type ScaleMixes = Record<ScaleStep, number>;

/** Primary scale: base sits at 800 (matches --primary / --ink). */
const PRIMARY_MIXES: ScaleMixes = {
  50: 0.95,
  100: 0.88,
  200: 0.75,
  300: 0.6,
  400: 0.45,
  500: 0.3,
  600: 0.2,
  700: 0.17,
  800: 0,
  900: -0.2,
  950: -0.35,
};

/** Secondary / accent scale: base sits at 500 (matches --secondary). */
const SECONDARY_MIXES: ScaleMixes = {
  50: 0.92,
  100: 0.84,
  200: 0.68,
  300: 0.5,
  400: 0.25,
  500: 0,
  600: -0.1,
  700: -0.2,
  800: -0.35,
  900: -0.5,
  950: -0.65,
};

/** Surface / paper+card scale: base sits at 100 (matches --paper / --card). */
const SURFACE_MIXES: ScaleMixes = {
  50: 0.55,
  100: 0,
  200: -0.06,
  300: -0.12,
  400: -0.2,
  500: -0.3,
  600: -0.42,
  700: -0.55,
  800: -0.7,
  900: -0.82,
  950: -0.9,
};

export function buildScale(
  baseHex: string,
  mixes: ScaleMixes = PRIMARY_MIXES,
): Record<ScaleStep, string> {
  const out = {} as Record<ScaleStep, string>;
  for (const step of SCALE_STEPS) {
    const t = mixes[step];
    if (t === 0) out[step] = baseHex;
    else if (t > 0) out[step] = mixHex(baseHex, "#FFFFFF", t);
    else out[step] = mixHex(baseHex, "#000000", -t);
  }
  return out;
}

function scaleVars(
  prefix: string,
  scale: Record<ScaleStep, string>,
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const step of SCALE_STEPS) {
    vars[`--${prefix}-${step}`] = scale[step];
  }
  return vars;
}

export function themeVars(
  b: Pick<Organization, "primary" | "accent" | "background">,
): Record<string, string> {
  const primary = buildScale(b.primary, PRIMARY_MIXES);
  const secondary = buildScale(b.accent, SECONDARY_MIXES);
  const paper = buildScale(b.background, SURFACE_MIXES);
  const card = buildScale(mixHex(b.background, "#FFFFFF", 0.65), SURFACE_MIXES);

  return {
    ...scaleVars("primary", primary),
    ...scaleVars("secondary", secondary),
    ...scaleVars("paper", paper),
    ...scaleVars("card", card),
    // Semantic aliases
    "--primary": primary[800],
    "--primary-soft": primary[100],
    "--on-primary": card[100],
    "--secondary": secondary[500],
    "--secondary-soft": secondary[100],
    "--on-secondary": card[100],
    "--ink": primary[800],
    "--ink-soft": primary[500],
    "--deficit": primary[700],
    "--surplus": secondary[500],
    "--paper": paper[100],
    "--card": card[100],
    "--border": mixHex(b.background, "#000000", 0.09),
    // Short-lived compat aliases
    "--blue": primary[800],
    "--blue-soft": primary[100],
    "--terracotta": secondary[500],
    // Note: do NOT set --color-primary/--color-accent/--color-background here.
    // Those are Tailwind @theme mappings. Brand is applied as :root:not(.hc);
    // high-contrast mode (.hc) swaps the full palette like .dark.
  };
}

export function brandWarnings(
  b: Pick<Organization, "primary" | "accent" | "background">,
): string[] {
  const warnings: string[] = [];
  if (contrastRatio(b.primary, "#FAFAF7") < 4.5)
    warnings.push(
      "Primærfarven er for lys til hvid tekst på knapper og til overskrifter. Vælg en mørkere farve.",
    );
  if (contrastRatio(b.accent, "#FAFAF7") < 3)
    warnings.push(
      "Accentfarven er meget lys, så plus-timer kan blive svære at læse.",
    );
  if (contrastRatio(b.primary, b.background) < 4.5)
    warnings.push(
      "Primærfarven og baggrunden ligner hinanden for meget, så tekst på baggrunden bliver svær at læse.",
    );
  return warnings;
}
