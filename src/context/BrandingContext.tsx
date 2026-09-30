import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Organization } from "../types/organization";
import { themeVars, mixHex } from "../theme/colors";
import { useAuth } from "./AuthContext";
import { updateBranding as updateBrandingApi } from "../api/branding";

export type BrandingContextValue = Organization & {
  setBranding: Dispatch<SetStateAction<Organization>>;
  saveBranding: (branding: Organization) => Promise<Organization>;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({
  branding,
  setBranding,
  children,
}: {
  branding: Organization;
  setBranding: Dispatch<SetStateAction<Organization>>;
  children: ReactNode;
}) {
  const { demoMode } = useAuth();

  useEffect(() => {
    const vars = themeVars(branding);
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
    root.style.setProperty("--terracotta", branding.accent);
    document.body.style.background = mixHex(branding.background, "#000000", 0.07);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", branding.primary);
  }, [branding]);

  const saveBranding = useCallback(
    async (next: Organization) => {
      if (demoMode) {
        setBranding(next);
        return next;
      }
      const saved = await updateBrandingApi(next);
      setBranding(saved);
      return saved;
    },
    [demoMode, setBranding],
  );

  return (
    <BrandingContext.Provider value={{ ...branding, setBranding, saveBranding }}>
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
