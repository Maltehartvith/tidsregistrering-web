import { AlertTriangle } from "lucide-react";
import { APP_ICON_SRC } from "@/data/constants";
import type { Organization } from "@/types/organization";
import { themeVars, isValidHex, brandWarnings } from "@/theme/colors";

type BrandPreviewProps = {
  draft: Organization;
};

export function BrandPreview({ draft }: BrandPreviewProps) {
  const warnings = brandWarnings(draft);
  const preview =
    isValidHex(draft.primary) &&
    isValidHex(draft.accent) &&
    isValidHex(draft.background);

  return (
    <div>
      <div
        className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
        style={{ marginTop: 0 }}
      >
        Forhåndsvisning
      </div>
      {preview ? (
        <div
          className="rounded-2xl border border-border bg-paper p-4 text-ink"
          style={themeVars(draft)}
        >
          <div className="flex items-center gap-2.5">
            <img
              src={draft.logo?.trim() || APP_ICON_SRC}
              alt=""
              className="h-6.5 w-auto max-w-35 shrink-0 object-contain"
            />
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
              {draft.orgName || "…"}
            </div>
          </div>
          <div
            className="mb-0.5 font-display text-[28px] font-semibold"
            style={{ marginTop: 8 }}
          >
            {draft.appTitle || "…"}
          </div>
          <div className="text-[13px] text-ink-soft">
            Anna Bertelsen · Hold 26-100
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
            <span className="stitch-line" />
          </div>
          <div
            className="mb-3 rounded-[14px] border border-border bg-card px-4.5 py-4"
            style={{ marginTop: 14 }}
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
              className="my-1 mb-2.5 font-mono text-[26px] font-semibold"
              style={{ color: "var(--surplus)", fontSize: 20 }}
            >
              +3 timer
            </div>
          </div>
          <div
            className="mb-4 flex flex-wrap gap-2"
            style={{ marginTop: 12 }}
          >
            <button
              type="button"
              className="rounded-full border-[1.5px] border-ink bg-ink px-3 py-2 text-xs font-semibold text-card"
            >
              Aktiv fane
            </button>
            <button
              type="button"
              className="rounded-full border-[1.5px] border-border bg-card px-3 py-2 text-xs font-semibold text-ink-soft"
            >
              Fane
            </button>
          </div>
          <button
            className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
            style={{ width: "100%" }}
          >
            Gem registrering
          </button>
        </div>
      ) : (
        <p className="mt-1 block text-[11px] text-ink-soft">
          Forhåndsvisningen vises, når alle tre farvekoder er gyldige.
        </p>
      )}
      {warnings.map((w) => (
        <div
          className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary"
          key={w}
          style={{ marginTop: 10 }}
        >
          <AlertTriangle size={14} /> {w}
        </div>
      ))}
    </div>
  );
}
