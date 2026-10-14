import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Upload } from "lucide-react";
import { APP_ICON_SRC, BRAND_PRESETS } from "@/data/constants";
import { Field } from "@/components/ui/Field";
import { isValidHex } from "@/theme/colors";
import type { Organization } from "@/types/organization";

type ColorKey = "primary" | "accent" | "background";

type BrandingFormProps = {
  draft: Organization;
  setDraft: Dispatch<SetStateAction<Organization>>;
  logoError: string;
  setLogoError: (message: string) => void;
};

export function BrandingForm({
  draft,
  setDraft,
  logoError,
  setLogoError,
}: BrandingFormProps) {
  const handleLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|svg\+xml|webp|gif)$/.test(file.type)) {
      setLogoError("Vælg en billedfil (PNG, JPG, SVG eller WEBP).");
      return;
    }
    if (file.size > 1024 * 1024) {
      setLogoError("Logoet må højst fylde 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((d) => ({ ...d, logo: reader.result as string }));
      setLogoError("");
    };
    reader.onerror = () => setLogoError("Filen kunne ikke læses.");
    reader.readAsDataURL(file);
  };

  const setColor = (key: ColorKey, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const colorRow = (key: ColorKey, label: string, hint: string) => (
    <div className="mb-3.5 block" key={key}>
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValidHex(draft[key]) ? draft[key] : "#000000"}
          onChange={(e) => setColor(key, e.target.value.toUpperCase())}
        />
        <input
          type="text"
          value={draft[key]}
          onChange={(e) => setColor(key, e.target.value)}
          maxLength={7}
          className="max-w-32.5 font-mono"
        />
      </div>
      <span className="mt-1 block text-[11px] text-ink-soft">{hint}</span>
    </div>
  );

  return (
    <div>
      <div
        className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
        style={{ marginTop: 0 }}
      >
        Navn
      </div>
      <Field
        label="Institutionens eller uddannelsesområdets navn"
        hint="Vises øverst i appen og på login-siden."
      >
        <input
          type="text"
          value={draft.orgName}
          onChange={(e) => setDraft((d) => ({ ...d, orgName: e.target.value }))}
        />
      </Field>
      <Field
        label="Titel på kursistens forside"
        hint='Fx "Timeregnskab" eller "Praktiktimer".'
      >
        <input
          type="text"
          value={draft.appTitle}
          onChange={(e) => setDraft((d) => ({ ...d, appTitle: e.target.value }))}
        />
      </Field>
      <Field
        label="Kontakt-email til kursister"
        hint='Kursisterne får et diskret "Er noget forkert? Kontakt os"-link, der åbner en færdigudfyldt mail hertil. Brug gerne en fælles adresse. Står feltet tomt, vises linket ikke.'
      >
        <input
          type="email"
          value={draft.contactEmail || ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, contactEmail: e.target.value }))
          }
          placeholder="fx kursus@institution.dk"
        />
      </Field>

      <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
        Logo
      </div>
      <div className="mb-1.5 flex items-center gap-3.5">
        <div className="flex h-18 w-27.5 items-center justify-center rounded-xl border border-dashed border-border bg-card p-2">
          <img
            src={draft.logo?.trim() || APP_ICON_SRC}
            alt="Logo"
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
            style={{ cursor: "pointer" }}
          >
            <Upload size={14} /> Upload logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              onChange={handleLogo}
              style={{ display: "none" }}
            />
          </label>
          {draft.logo?.trim() && draft.logo !== APP_ICON_SRC && (
            <button
              className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-primary"
              style={{ margin: 0, textAlign: "left" }}
              onClick={() => setDraft((d) => ({ ...d, logo: "" }))}
            >
              Brug app-ikon
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 block text-[11px] text-ink-soft">
        PNG, SVG, JPG eller WEBP, højst 1 MB. Et logo med gennemsigtig baggrund
        ser pænest ud.
      </p>
      {logoError && (
        <div className="-mt-1.5 mb-3 text-xs text-secondary">{logoError}</div>
      )}

      <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
        Farver
      </div>
      <div
        className="mb-1.5 block text-xs font-semibold text-ink-soft"
        style={{ marginBottom: 6 }}
      >
        Færdige temaer
      </div>
      {[...new Set(BRAND_PRESETS.map((p) => p.group))].map((group) => (
        <div key={group} style={{ marginBottom: 10 }}>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
            {group}
          </div>
          <div className="flex flex-wrap gap-2">
            {BRAND_PRESETS.filter((p) => p.group === group).map((p) => {
              const active =
                p.primary === draft.primary &&
                p.accent === draft.accent &&
                p.background === draft.background;
              return (
                <button
                  key={p.name}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] bg-card px-3 py-1.5 text-xs font-semibold text-ink"
                  style={{
                    borderColor: active ? "ink" : "border",
                  }}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      primary: p.primary,
                      accent: p.accent,
                      background: p.background,
                    }))
                  }
                >
                  <span className="inline-flex">
                    <span style={{ background: p.primary }} />
                    <span style={{ background: p.accent }} />
                    <span style={{ background: p.background }} />
                  </span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ height: 6 }} />
      {colorRow("primary", "Primærfarve", "Overskrifter, knapper og aktive faner.")}
      {colorRow("accent", "Accentfarve", "Timer over målet (+) og små detaljer.")}
      {colorRow("background", "Baggrundsfarve", "Baggrunden bag kortene.")}
    </div>
  );
}
