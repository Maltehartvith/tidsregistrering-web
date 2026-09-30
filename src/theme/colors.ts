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

export function themeVars(
  b: Pick<Organization, "primary" | "accent" | "background">,
): Record<string, string> {
  return {
    "--ink": b.primary,
    "--blue": b.primary,
    "--ink-soft": mixHex(b.primary, "#FFFFFF", 0.3),
    "--blue-soft": mixHex(b.primary, "#FFFFFF", 0.88),
    "--deficit": mixHex(b.primary, "#FFFFFF", 0.17),
    "--surplus": b.accent,
    "--terracotta": b.accent,
    "--paper": b.background,
    "--border": mixHex(b.background, "#000000", 0.09),
    "--color-primary": b.primary,
    "--color-accent": b.accent,
    "--color-background": b.background,
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
