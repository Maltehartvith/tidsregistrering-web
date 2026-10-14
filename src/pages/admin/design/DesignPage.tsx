import { useState } from "react";
import AdminPageWrapper from "@/pages/admin/components/AdminPageWrapper";
import { useBranding } from "@/context/BrandingContext";
import { DEFAULT_BRANDING } from "@/data/constants";
import { useActorLabel } from "@/domain/actor";
import { isValidHex } from "@/theme/colors";
import type { Organization } from "@/types/organization";
import { BrandingForm } from "@/pages/admin/design/components/BrandingForm";
import { BrandPreview } from "@/pages/admin/design/components/BrandPreview";

export function DesignPage() {
  const actor = useActorLabel();
  const {
    setBranding: _setBranding,
    saveBranding,
    isLoading: _brandingLoading,
    ...branding
  } = useBranding();
  const [draft, setDraft] = useState<Organization>({
    orgName: branding.orgName,
    appTitle: branding.appTitle,
    contactEmail: branding.contactEmail,
    logo: branding.logo,
    primary: branding.primary,
    accent: branding.accent,
    background: branding.background,
  });
  const [logoError, setLogoError] = useState("");
  const [formError, setFormError] = useState("");

  const dirty = JSON.stringify(draft) !== JSON.stringify(branding);

  const save = async () => {
    const orgName = draft.orgName.trim();
    const appTitle = draft.appTitle.trim();
    if (!orgName || !appTitle) {
      setFormError("Udfyld både navn og titel.");
      return;
    }
    if (
      !(["primary", "accent", "background"] as const).every((k) =>
        isValidHex(draft[k]),
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
      (["primary", "accent", "background"] as const).some(
        (k) => next[k] !== branding[k],
      )
    )
      changes.push("farver");
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
    setDraft(branding);
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
        <div
          className="-mt-1.5 mb-3 text-xs text-secondary"
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
          onClick={undo}
        >
          Fortryd
        </button>
        <button
          className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
          disabled={!dirty}
          onClick={save}
        >
          Gem design
        </button>
      </div>
    </AdminPageWrapper>
  );
}
