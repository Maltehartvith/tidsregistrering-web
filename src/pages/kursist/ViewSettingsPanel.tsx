import { X } from "lucide-react";
import { TEXT_SIZES } from "../../theme/viewPrefs";
import type { ViewPrefs } from "../../types/ui";

function SegButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex-1 cursor-pointer rounded-[10px] border-[1.5px] px-2 py-2.5 font-sans text-[13px] font-semibold ${
        pressed
          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--card)]"
          : "border-[var(--border)] bg-[var(--paper)] text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

export function ViewSettingsPanel({
  prefs,
  onChange,
  onClose,
}: {
  prefs: ViewPrefs;
  onChange: (p: ViewPrefs) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] px-4 py-3.5" role="region" aria-label="Visning">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="font-[family-name:var(--font-display)] text-[15px] font-semibold text-[var(--ink)]">Visning</div>
        <button
          type="button"
          className="flex cursor-pointer rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--paper)] p-1.5 text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
          onClick={onClose}
          title="Luk"
          aria-label="Luk visning"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mb-1.5 text-xs font-semibold text-[var(--ink-soft)]">Kontrast</div>
      <div className="flex gap-1.5">
        <SegButton pressed={!prefs.highContrast} onClick={() => onChange({ ...prefs, highContrast: false })}>
          Standard
        </SegButton>
        <SegButton pressed={prefs.highContrast} onClick={() => onChange({ ...prefs, highContrast: true })}>
          Høj kontrast
        </SegButton>
      </div>
      <div className="mb-1.5 mt-3.5 text-xs font-semibold text-[var(--ink-soft)]">Tekststørrelse</div>
      <div className="flex gap-1.5">
        {TEXT_SIZES.map((t) => (
          <SegButton key={t.key} pressed={prefs.textSize === t.key} onClick={() => onChange({ ...prefs, textSize: t.key })}>
            <span className="mb-1 block leading-none" style={{ fontSize: t.sample }}>
              Aa
            </span>
            {t.label}
          </SegButton>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-[var(--ink-soft)]">
        Indstillingerne gælder kun for dig og ændrer ikke, hvad andre ser.
      </p>
    </div>
  );
}
