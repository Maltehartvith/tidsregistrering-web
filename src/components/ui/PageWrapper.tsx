import type { ReactNode } from "react";
import { NavigationBar } from "../nav/NavigationBar";
import { useIsDesktop } from "@/hooks/useIsDesktop";

type PageWrapperProps = {
  children: ReactNode;
  /**
   * `wide` uses most of the desktop viewport.
   * `form` is a centered rectangle for login and similar screens.
   */
  size?: "wide" | "form";
};

const PageWrapper = ({ children, size = "wide" }: PageWrapperProps) => {
  const isDesktop = useIsDesktop();

  if (size === "form") {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center overflow-y-auto">
        <div
          className="flex w-full flex-col bg-paper font-sans text-ink md:max-h-[min(800px,calc(100dvh-5rem))] md:max-w-xl md:overflow-y-auto md:rounded-2xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]"
        >
          <div className="flex w-full flex-col items-center justify-center md:p-16">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mx-auto md:px-6 flex h-dvh w-full flex-col overflow-hidden md:max-w-[90vw]">
      {isDesktop && <NavigationBar position="top" />}
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-paper font-sans text-ink md:my-4 md:rounded-2xl md:shadow-[0_16px_24px_rgba(18,57,74,0.16)]">
        {children}
        {!isDesktop && <NavigationBar position="bottom" />}
      </div>
    </div>
  );
};

export default PageWrapper;
