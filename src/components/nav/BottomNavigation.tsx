import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { studentNavItems } from "./studentNav";

export function BottomNavigation() {
  return (
    <nav
      className="sticky bottom-0 z-20 mx-auto w-full max-w-107.5 shrink-0 overflow-hidden border-t border-border bg-card"
      aria-label="Hovedmenu"
    >
      <div className="flex items-stretch">
        {studentNavItems.map(({ to, label, Icon }, index) => (
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
                  <>
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute inset-0 bg-primary-100 transition-opacity duration-300 ease-out ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <Icon size="1.2em" className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </>
                )}
              </NavLink>
            </div>

            {index < studentNavItems.length - 1 && (
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
