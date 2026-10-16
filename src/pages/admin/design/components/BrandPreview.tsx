import { AlertTriangle } from "lucide-react";
import { APP_ICON_SRC } from "@/data/constants";
import type { Organization } from "@/types/organization";
import { themeVars, isValidHex, brandWarnings } from "@/theme/colors";
import { Button } from "@/components/ui/Button";

type BrandPreviewProps = {
  draft: Organization;
};

export function BrandPreview({ draft }: BrandPreviewProps) {
  const warnings = brandWarnings(draft);
  const preview =
    isValidHex(draft.primary) &&
    isValidHex(draft.accent) &&
    isValidHex(draft.background) &&
    isValidHex(draft.card);

  const vars = preview ? themeVars(draft) : undefined;

  return (
    <div>
      <div className="mb-2.5 font-display text-[15px] font-semibold text-ink">
        Forhåndsvisning
      </div>
      {preview && vars ? (
        <div
          className="rounded-2xl border p-4"
          style={{
            ...vars,
            backgroundColor: "var(--paper)",
            color: "var(--ink)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <img
              src={draft.logo?.trim() || APP_ICON_SRC}
              alt=""
              className="h-6.5 w-auto max-w-35 shrink-0 object-contain"
            />
            <div
              className="font-mono text-[11px] uppercase tracking-widest"
              style={{ color: "var(--ink-soft)" }}
            >
              {draft.orgName || "…"}
            </div>
          </div>
          <div className="mt-2 mb-0.5 font-display text-[28px] font-semibold">
            {draft.appTitle || "…"}
          </div>
          <div className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
            Anna Bertelsen · Hold 26-100
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span
              className="h-3 w-0.5 shrink-0 rounded-sm"
              style={{ backgroundColor: "var(--surplus)" }}
            />
            <span className="stitch-line" />
          </div>
          <div
            className="mt-3.5 mb-3 rounded-lg border px-4.5 py-4"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "var(--ink-soft)" }}
            >
              Eksempel på kategori
            </div>
            <div
              className="my-1 mb-2.5 font-mono text-[26px] font-semibold"
              style={{ color: "var(--deficit)" }}
            >
              −12 timer
            </div>
            <div
              className="my-1 mb-2.5 font-mono text-xl font-semibold"
              style={{ color: "var(--surplus)" }}
            >
              +3 timer
            </div>
          </div>
          <div className="mt-3 mb-4 flex flex-wrap gap-2">
            <Button
              variant="pill"
              style={{
                borderColor: "var(--ink)",
                backgroundColor: "var(--ink)",
                color: "var(--card)",
              }}
            >
              Aktiv fane
            </Button>
            <Button
              variant="pill"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--card)",
                color: "var(--ink-soft)",
              }}
            >
              Fane
            </Button>
          </div>
          <Button
            className="w-full"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
            }}
          >
            Gem registrering
          </Button>
        </div>
      ) : (
        <p className="mt-1 block text-[11px] text-ink-soft">
          Forhåndsvisningen vises, når alle farvekoder er gyldige.
        </p>
      )}
      {warnings.map((w) => (
        <div
          className="mt-2.5 flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary"
          key={w}
        >
          <AlertTriangle size={14} /> {w}
        </div>
      ))}
    </div>
  );
}
