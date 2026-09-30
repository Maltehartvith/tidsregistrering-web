import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-1.5 font-sans font-semibold transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45";

const variants = {
  primary: `${base} flex-1 rounded-[10px] border-0 bg-[var(--blue)] px-4 py-3 text-sm text-[#fafaf7]`,
  ghost: `${base} flex-1 rounded-[10px] border-[1.5px] border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[var(--ink-soft)]`,
  small: `${base} flex-none rounded-full border-0 bg-[var(--blue-soft)] px-3 py-1.5 text-xs text-[var(--blue)]`,
  link: `${base} mt-3.5 border-0 bg-transparent text-center text-[13px] font-semibold text-[var(--blue)]`,
  icon: `${base} rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--paper)] p-1.5 text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:opacity-35`,
  nav: `${base} flex-1 flex-col gap-1 border-0 bg-transparent pb-3.5 pt-3 text-[11px] text-[var(--ink-soft)]`,
  navActive: `${base} flex-1 flex-col gap-1 border-0 bg-transparent pb-3.5 pt-3 text-[11px] text-[var(--blue)]`,
  tab: `${base} rounded-full border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--ink-soft)]`,
  tabActive: `${base} rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-xs text-[var(--card)]`,
  pill: `${base} rounded-full border-[1.5px] px-3.5 py-2 text-[13px]`,
  back: `${base} gap-1.5 border-0 bg-transparent p-0 text-[13px] text-[var(--ink-soft)]`,
} as const;

export type ButtonVariant = keyof typeof variants;

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children?: ReactNode;
}) {
  return (
    <button type="button" className={`${variants[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export { variants as buttonVariants };
