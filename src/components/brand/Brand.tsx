import { useBranding } from "../../context/BrandingContext";

export function BrandLogo({ className }: { className?: string }) {
  const brand = useBranding();
  return <img src={brand.logo} alt={brand.orgName} className={className} />;
}

export function BrandName() {
  return <>{useBranding().orgName}</>;
}

export function AppTitle() {
  return <>{useBranding().appTitle}</>;
}
