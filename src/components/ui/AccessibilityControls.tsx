import { TEXT_SIZES } from "@/theme/viewPrefs";
import type { ViewPrefs } from "@/types/ui";
import { SegButton } from "./SegButton";

export function AccessibilityControls({
  prefs,
  onChange,
}: {
  prefs: ViewPrefs;
  onChange: (p: ViewPrefs) => void;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <div className="mb-1.5 text-xs font-semibold text-ink">Kontrast</div>
        <div className="flex gap-1.5">
          <SegButton
            pressed={!prefs.highContrast}
            onClick={() => onChange({ ...prefs, highContrast: false })}
          >
            Standard
          </SegButton>
          <SegButton
            pressed={prefs.highContrast}
            onClick={() => onChange({ ...prefs, highContrast: true })}
          >
            Høj kontrast
          </SegButton>
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-xs font-semibold text-ink">
          Tekststørrelse
        </div>
        <div className="flex gap-1.5">
          {TEXT_SIZES.map((t) => (
            <SegButton
              key={t.key}
              pressed={prefs.textSize === t.key}
              onClick={() => onChange({ ...prefs, textSize: t.key })}
            >
              <span
                className="mb-1 block leading-none"
                style={{ fontSize: `${t.sampleRem}rem` }}
              >
                Aa
              </span>
              {t.label}
            </SegButton>
          ))}
        </div>
      </div>
      <p className="text-[0.6875rem] text-ink-soft">
        Indstillingerne gælder kun for dig og ændrer ikke, hvad andre ser.
      </p>
    </div>
  );
}
