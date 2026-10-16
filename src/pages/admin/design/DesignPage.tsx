import { useState } from "react";
import AdminPageWrapper from "@/pages/admin/components/AdminPageWrapper";
import { useBranding } from "@/context/BrandingContext";
import { DEFAULT_BRANDING } from "@/data/constants";
import { useActorLabel } from "@/domain/actor";
import { defaultCardFromBackground, isValidHex } from "@/theme/colors";
import type { Organization } from "@/types/organization";
import { BrandingForm } from "@/pages/admin/design/components/BrandingForm";
import { BrandPreview } from "@/pages/admin/design/components/BrandPreview";
import { Button } from "@/components/ui/Button";

const COLOR_KEYS = ["primary", "accent", "background", "card"] as const;

function toDraft(branding: Organization): Organization {
  return {
    orgName: branding.orgName,
    appTitle: branding.appTitle,
    contactEmail: branding.contactEmail,
    logo: branding.logo,
    primary: branding.primary,
    accent: branding.accent,
    background: branding.background,
    card: isValidHex(branding.card)
      ? branding.card
      : defaultCardFromBackground(branding.background),
  };
}

export function DesignPage() {
  const actor = useActorLabel();
  const {
    setBranding: _setBranding,
    saveBranding,
    isLoading: _brandingLoading,
    isSaving,
    ...branding
  } = useBranding();
  const [draft, setDraft] = useState<Organization>(() => toDraft(branding));
  const [logoError, setLogoError] = useState("");
  const [formError, setFormError] = useState("");

  const saved = toDraft(branding);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const save = async () => {
    const orgName = draft.orgName.trim();
    const appTitle = draft.appTitle.trim();
    if (!orgName || !appTitle) {
      setFormError("Udfyld både navn og titel.");
      return;
    }
    if (!COLOR_KEYS.every((k) => isValidHex(draft[k]))) {
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
    if (next.orgName !== saved.orgName)
      changes.push(`navn til "${next.orgName}"`);
    if (next.appTitle !== saved.appTitle)
      changes.push(`titel til "${next.appTitle}"`);
    if (next.contactEmail !== (saved.contactEmail || ""))
      changes.push(
        next.contactEmail
          ? `kontakt-email til ${next.contactEmail}`
          : "fjernede kontakt-email",
      );
    if (next.logo !== saved.logo) changes.push("logo");
    if (COLOR_KEYS.some((k) => next[k] !== saved[k])) changes.push("farver");
    await saveBranding(next, {
      toastSuccessMessage: "Design gemt",
      logArgs:
        changes.length > 0
          ? {
              description: `${actor} ændrede designet: ${changes.join(", ")}`,
            }
          : null,
    });
    setDraft(next);
    setFormError("");
  };

  const resetAll = () => {
    setDraft(DEFAULT_BRANDING);
    setFormError("");
    setLogoError("");
  };

  const undo = () => {
    setDraft(toDraft(branding));
    setFormError("");
    setLogoError("");
  };

  return (
    <AdminPageWrapper
      title="Design"
      subtitle="Navn, logo og farver, som kursister og administratorer ser"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <BrandingForm
          draft={draft}
          setDraft={setDraft}
          logoError={logoError}
          setLogoError={setLogoError}
        />
        <BrandPreview draft={draft} />
      </div>

      {formError && (
        <div className="mt-3 mb-3 text-md text-secondary">{formError}</div>
      )}
      <div className="mt-4 flex justify-between gap-2.5">
        <Button variant="secondary" onClick={resetAll}>
          Nulstil alt til standard
        </Button>
        <div className="flex gap-2.5">
          <Button variant="secondary" disabled={!dirty} onClick={undo}>
            Fortryd
          </Button>
          <Button
            variant="primary"
            disabled={!dirty || isSaving}
            aria-busy={isSaving}
            onClick={save}
          >
            {isSaving ? "Gemmer…" : "Gem design"}
          </Button>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
