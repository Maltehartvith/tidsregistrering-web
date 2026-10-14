import { useEffect, useState } from "react";

/** Matches Tailwind `md` (768px). */
const DESKTOP_QUERY = "(min-width: 768px)";

function getIsDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? false : getIsDesktop(),
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}
