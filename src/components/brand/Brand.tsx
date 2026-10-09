import { APP_ICON_SRC } from "@/data/constants";
import { useBranding } from "../../context/BrandingContext";

export function BrandLogo({ className }: { className?: string }) {
  const brand = useBranding();
  const src = brand.logo?.trim() || APP_ICON_SRC;
  return (
    <div className=" w-fit p-2 mx-auto mb-5 rounded-lg shadow-[0_4px_12px_rgba(18,57,74,0.16)]">
      <img
        src={src}
        alt={brand.orgName || "Timeregnskab"}
        className={className}
      />
    </div>
  );
}

export function BrandName() {
  return <>{useBranding().orgName}</>;
}

export function AppTitle() {
  return <>{useBranding().appTitle}</>;
}
