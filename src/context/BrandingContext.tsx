import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Organization } from "../types/organization";
import type { MutationFeedback } from "@/types/log";
import { withFeedback } from "../hooks/queryHelpers";
import {
  defaultCardFromBackground,
  isValidHex,
  themeVars,
} from "../theme/colors";
import { HC_CLASS } from "../theme/viewPrefs";
import {
  useBrandingQuery,
  useBrandingSetter,
  useSaveBranding,
} from "../hooks/branding";

export type BrandingContextValue = Organization & {
  isLoading: boolean;
  setBranding: Dispatch<SetStateAction<Organization>>;
  saveBranding: (
    branding: Organization,
    feedback?: MutationFeedback<Organization> | null,
  ) => Promise<Organization>;
  isSaving: boolean;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

const BRAND_STYLE_ID = "brand-theme";

function normalizeBranding(branding: Organization): Organization {
  return {
    ...branding,
    card: isValidHex(branding.card)
      ? branding.card
      : defaultCardFromBackground(branding.background),
  };
}

/**
 * Org brand as a stylesheet on :root, skipped while .hc is active
 * (high-contrast mode replaces the whole palette, like .dark).
 */
function applyBrandStylesheet(branding: Organization) {
  const vars = themeVars(normalizeBranding(branding));
  let styleEl = document.getElementById(
    BRAND_STYLE_ID,
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = BRAND_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  const declarations = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  styleEl.textContent = `:root:not(.${HC_CLASS}) {\n${declarations}\n}`;

  const root = document.documentElement;
  for (const key of Object.keys(vars)) {
    root.style.removeProperty(key);
  }
  document.body.style.removeProperty("background");

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      root.classList.contains(HC_CLASS) ? "#000000" : branding.primary,
    );
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { data: brandingData, isLoading } = useBrandingQuery();
  const branding = useMemo(
    () => normalizeBranding(brandingData),
    [brandingData],
  );
  const setBranding = useBrandingSetter();
  const saveMutation = useSaveBranding();

  useEffect(() => {
    applyBrandStylesheet(branding);
  }, [branding]);

  return (
    <BrandingContext.Provider
      value={{
        ...branding,
        isLoading,
        setBranding,
        saveBranding: (next, feedback) =>
          saveMutation.mutateAsync(
            withFeedback(normalizeBranding(next), feedback),
          ),
        isSaving: saveMutation.isPending,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return ctx;
}
