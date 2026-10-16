import { TEXT_SIZES } from "@/theme/viewPrefs";
import type { ViewPrefs } from "@/types/ui";
import { Button } from "./Button";

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
          <Button
            variant={!prefs.highContrast ? "primary" : "secondary"}
            onClick={() => onChange({ ...prefs, highContrast: false })}
            className="w-full"
          >
            Standard
          </Button>
          <Button
            className="w-full"
            variant={prefs.highContrast ? "primary" : "secondary"}
            onClick={() => onChange({ ...prefs, highContrast: true })}
          >
            Høj kontrast
          </Button>
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-xs font-semibold text-ink">
          Tekststørrelse
        </div>
        <div className="flex gap-1.5">
          {TEXT_SIZES.map((t) => (
            <Button
              key={t.key}
              variant={prefs.textSize === t.key ? "primary" : "secondary"}
              onClick={() => onChange({ ...prefs, textSize: t.key })}
              className="w-full flex-col gap-0!"
            >
              <span
                className="mb-1 block leading-none"
                style={{ fontSize: `${t.sampleRem}rem` }}
              >
                Aa
              </span>
              {t.label}
            </Button>
          ))}
        </div>
      </div>
      <p className="text-[0.6875rem] text-ink-soft">
        Indstillingerne gælder kun for dig og ændrer ikke, hvad andre ser.
      </p>
    </div>
  );
}
