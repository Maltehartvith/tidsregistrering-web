import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Organization } from "../types/organization";
import { themeVars } from "../theme/colors";
import { HC_CLASS } from "../theme/viewPrefs";
import {
  useBrandingQuery,
  useBrandingSetter,
  useSaveBranding,
} from "../hooks/branding";

export type BrandingContextValue = Organization & {
  isLoading: boolean;
  setBranding: Dispatch<SetStateAction<Organization>>;
  saveBranding: (branding: Organization) => Promise<Organization>;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

const BRAND_STYLE_ID = "brand-theme";

/**
 * Org brand as a stylesheet on :root, skipped while .hc is active
 * (high-contrast mode replaces the whole palette, like .dark).
 */
function applyBrandStylesheet(branding: Organization) {
  const vars = themeVars(branding);
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
  const { data: branding, isLoading } = useBrandingQuery();
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
        saveBranding: (next) => saveMutation.mutateAsync(next),
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
