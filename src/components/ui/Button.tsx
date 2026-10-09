import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "flex items-center justify-center gap-1.5 font-sans font-semibold transition-color duration-200 active:opacity-75 disabled:cursor-default disabled:opacity-45 cursor-pointer";

const variants = {
  primary: `${base} rounded-md border-0 bg-primary px-4 py-3 text-sm text-on-primary hover:bg-primary-900`,
  secondary: `${base} rounded-md border-[1.5px] border-border bg-paper px-4 py-3 text-sm text-ink hover:bg-paper-200`,
  ghost: `${base} rounded-md px-4 py-3 text-sm text-ink hover:text-primary hover:bg-paper-200`,
  small: `${base} flex-none rounded-full border-[1.5px] border-border bg-paper px-3 py-1.5 text-xs text-ink`,
  link: `${base} mt-3.5 border-0 bg-transparent text-center text-[13px] font-semibold text-primary`,
  icon: `${base} rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:opacity-35`,
  nav: `${base} flex-1 flex-col gap-1 border-0 bg-transparent pb-3.5 pt-3 text-[11px] text-ink-soft`,
  navActive: `${base} flex-1 flex-col gap-1 border-0 bg-transparent pb-3.5 pt-3 text-[11px] text-primary`,
  tab: `${base} rounded-full border-[1.5px] border-border bg-card px-3 py-2 text-xs text-ink-soft`,
  tabActive: `${base} rounded-full border-[1.5px] border-ink bg-ink px-3 py-2 text-xs text-card`,
  pill: `${base} rounded-full border-[1.5px] px-3.5 py-2 text-[13px]`,
  back: `${base} gap-1.5 border-0 bg-transparent p-0 text-[13px] text-ink-soft`,
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
    <button
      type="button"
      className={`${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export { variants as buttonVariants };
