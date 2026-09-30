import { useState } from "react";
import { Check, Users2, Upload, AlertTriangle } from "lucide-react";
import { useBranding } from "../../context/BrandingContext";

import { BRANDING_INITIAL, BRAND_PRESETS } from "../../data/seed";
import { Field } from "../../components/ui/Field";
import { BrandLogo } from "../../components/brand/Brand";
import { themeVars, isValidHex, brandWarnings } from "../../theme/colors";
import { AdminTabs } from "./AdminTabs";
import { routes } from "@/routes";
import { useNavigate } from "react-router-dom";
import { useAuditLogs } from "@/context/AuditLogsContext";

export const AdminDesignView = () => {
  const navigate = useNavigate();
  const { logEvent: onLog } = useAuditLogs();
  const { setBranding, saveBranding, ...branding } = useBranding();
  const [draft, setDraft] = useState(branding);
  const [logoError, setLogoError] = useState("");
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const warnings = brandWarnings(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(branding);

  const handleLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const setColor = (key: string, value: string) =>
    setDraft({ ...draft, [key]: value });

  const save = async () => {
    const orgName = draft.orgName.trim();
    const appTitle = draft.appTitle.trim();
    if (!orgName || !appTitle) {
      setFormError("Udfyld både navn og titel.");
      return;
    }
    if (
      !["primary", "accent", "background"].every((k) =>
        isValidHex(draft[k as keyof typeof draft]),
      )
    ) {
      setFormError("En af farverne er ikke en gyldig farvekode (fx #12394A).");
      return;
    }
    const contactEmail = (draft.contactEmail || "").trim();
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setFormError(
        "Kontakt-emailen ser ikke ud til at være en gyldig emailadresse.",
      );
      return;
    }
    const next = { ...draft, orgName, appTitle, contactEmail };
    const changes = [];
    if (next.orgName !== branding.orgName)
      changes.push(`navn til "${next.orgName}"`);
    if (next.appTitle !== branding.appTitle)
      changes.push(`titel til "${next.appTitle}"`);
    if (next.contactEmail !== (branding.contactEmail || ""))
      changes.push(
        next.contactEmail
          ? `kontakt-email til ${next.contactEmail}`
          : "fjernede kontakt-email",
      );
    if (next.logo !== branding.logo) changes.push("logo");
    if (
      ["primary", "accent", "background"].some(
        (k) =>
          next[k as keyof typeof next] !== branding[k as keyof typeof branding],
      )
    )
      changes.push("farver");
    await saveBranding(next);
    setDraft(next);
    setFormError("");
    if (changes.length > 0)
      onLog({
        actor: "Administrator",
        description: `Administrator ændrede designet: ${changes.join(", ")}`,
      });
    showToast("Design gemt");
  };

  const resetAll = () => {
    setDraft(BRANDING_INITIAL);
    setFormError("");
    setLogoError("");
  };

  const colorRow = (key: string, label: string, hint: string) => (
    <div className="mb-3.5 block" key={key}>
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={
            isValidHex(draft[key as keyof typeof draft])
              ? draft[key as keyof typeof draft]
              : "#000000"
          }
          onChange={(e) => setColor(key, e.target.value.toUpperCase())}
        />
        <input
          type="text"
          value={draft[key as keyof typeof draft]}
          onChange={(e) => setColor(key, e.target.value)}
          maxLength={7}
          className="max-w-32.5 font-mono"
        />
      </div>
      <span className="mt-1 block text-[11px] text-ink-soft">
        {hint}
      </span>
    </div>
  );

  const preview =
    isValidHex(draft.primary) &&
    isValidHex(draft.accent) &&
    isValidHex(draft.background);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100vh-80px)] md:max-w-225 md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="px-5 pb-4.5 pt-6.5">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-6.5 w-auto max-w-35 shrink-0 object-contain" />
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
            Administrator
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <div className="mb-0.5 font-display text-[28px] font-semibold">
              Design
            </div>
            <div className="text-[13px] text-ink-soft">
              Navn, logo og farver, som kursister og administratorer ser
            </div>
          </div>
          <button
            className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
            onClick={() => navigate(routes.adminStudents)}
            title="Kursistvisning"
          >
            <Users2 size={16} />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
          <span className="stitch-line" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-25 pt-1">
        <AdminTabs />

        <div className="grid gap-6 md:grid-cols-2">
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
                onChange={(e) =>
                  setDraft({ ...draft, orgName: e.target.value })
                }
              />
            </Field>
            <Field
              label="Titel på kursistens forside"
              hint='Fx "Timeregnskab" eller "Praktiktimer".'
            >
              <input
                type="text"
                value={draft.appTitle}
                onChange={(e) =>
                  setDraft({ ...draft, appTitle: e.target.value })
                }
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
                  setDraft({ ...draft, contactEmail: e.target.value })
                }
                placeholder="fx kursus@institution.dk"
              />
            </Field>

            <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
              Logo
            </div>
            <div className="mb-1.5 flex items-center gap-3.5">
              <div className="flex h-18 w-27.5 items-center justify-center rounded-xl border border-dashed border-border bg-card p-2">
                <img src={draft.logo} alt="Logo" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-blue-soft px-3 py-1.5 font-sans text-xs font-semibold text-blue"
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
                {draft.logo !== BRANDING_INITIAL.logo && (
                  <button
                    className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-blue"
                    style={{ margin: 0, textAlign: "left" }}
                    onClick={() =>
                      setDraft({ ...draft, logo: BRANDING_INITIAL.logo })
                    }
                  >
                    Gendan standardlogo
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 block text-[11px] text-ink-soft">
              PNG, SVG, JPG eller WEBP, højst 1 MB. Et logo med gennemsigtig
              baggrund ser pænest ud.
            </p>
            {logoError && (
              <div className="-mt-1.5 mb-3 text-xs text-terracotta">
                {logoError}
              </div>
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
                          setDraft({
                            ...draft,
                            primary: p.primary,
                            accent: p.accent,
                            background: p.background,
                          })
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
            {colorRow(
              "primary",
              "Primærfarve",
              "Overskrifter, knapper og aktive faner.",
            )}
            {colorRow(
              "accent",
              "Accentfarve",
              "Timer over målet (+) og små detaljer.",
            )}
            {colorRow(
              "background",
              "Baggrundsfarve",
              "Baggrunden bag kortene.",
            )}
          </div>

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
                    src={draft.logo}
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
                  className="flex-1 cursor-pointer rounded-[10px] border-0 bg-blue px-4 py-3 font-sans text-sm font-semibold text-paper transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
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
                className="flex items-start gap-1.5 py-2 text-xs leading-normal text-terracotta"
                key={w}
                style={{ marginTop: 10 }}
              >
                <AlertTriangle size={14} /> {w}
              </div>
            ))}
          </div>
        </div>

        {formError && (
          <div
            className="-mt-1.5 mb-3 text-xs text-terracotta"
            style={{ marginTop: 12 }}
          >
            {formError}
          </div>
        )}
        <div className="mt-4.5 flex gap-2.5" style={{ marginTop: 16 }}>
          <button
            className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
            onClick={resetAll}
          >
            Nulstil alt til standard
          </button>
          <button
            className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
            disabled={!dirty}
            onClick={() => {
              setDraft(branding);
              setFormError("");
              setLogoError("");
            }}
          >
            Fortryd
          </button>
          <button
            className="flex-1 cursor-pointer rounded-[10px] border-0 bg-blue px-4 py-3 font-sans text-sm font-semibold text-paper transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
            disabled={!dirty}
            onClick={save}
          >
            Gem design
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-21 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4.5 py-2.5 text-[13px] text-card shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
          <Check size={14} /> {toast}
        </div>
      )}
    </div>
  );
};
