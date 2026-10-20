import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isStaffRole } from "@/api/queryKeys";
import { routes } from "@/routes";
import { GhostBlock } from "@/components/ui/Ghost";
import { studentNavItems } from "./studentNav";

export function NavigationBarGhost({
  position,
}: {
  position: "top" | "bottom";
}) {
  const isTop = position === "top";

  return (
    <div
      className={`sticky z-20 w-full shrink-0 overflow-hidden bg-card ${
        isTop
          ? "top-0 border border-border md:rounded-b-lg"
          : "bottom-0 border-t border-border"
      }`}
      aria-hidden
    >
      <div className="flex items-stretch">
        {studentNavItems.map((item, index) => (
          <Fragment key={item.id}>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 p-2 md:flex-row md:justify-center md:gap-2 md:py-3">
              <GhostBlock className="h-4 w-4 shrink-0 rounded-full" />
              <GhostBlock className="h-2.5 w-12" />
            </div>
            {index < studentNavItems.length - 1 && (
              <span className="flex shrink-0 items-center self-stretch px-px">
                <span className="h-8 w-px bg-border" />
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function NavigationBar({ position }: { position: "top" | "bottom" }) {
  const isTop = position === "top";
  const { user } = useAuth();
  const showAdminLink = isStaffRole(user?.role);
  const items = showAdminLink
    ? [
        {
          to: routes.adminStudents,
          label: "Admin",
          Icon: ShieldCheck,
        },
        ...studentNavItems,
      ]
    : studentNavItems;

  return (
    <nav
      className={`sticky z-20 w-full shrink-0 overflow-hidden bg-card ${
        isTop
          ? "top-0 border border-border md:rounded-b-lg"
          : "bottom-0 border-t border-border"
      }`}
      aria-label="Hovedmenu"
    >
      <div className="flex items-stretch">
        {items.map(({ to, label, Icon }, index) => (
          <Fragment key={to}>
            <div className="relative min-w-0 flex-1">
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `relative z-10 flex w-full cursor-pointer flex-col items-center gap-0.5 border-0 bg-transparent p-2 font-sans text-[0.6875rem] font-semibold transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-ink-soft"
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex flex-col items-center md:flex-row md:gap-2 md:py-1">
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute inset-0 bg-primary-100 transition-opacity duration-300 ease-out ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <Icon size="1.2em" className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </div>
                )}
              </NavLink>
            </div>

            {index < items.length - 1 && (
              <span
                aria-hidden
                className="flex shrink-0 items-center self-stretch px-px"
              >
                <span className="h-8 w-px bg-border" />
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </nav>
  );
}
