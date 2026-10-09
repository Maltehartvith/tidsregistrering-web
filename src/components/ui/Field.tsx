import type { ReactNode } from "react";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="mb-3.5 block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-ink-soft">
          {hint}
        </span>
      )}
    </label>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="flex gap-3 [&_label]:flex-1">{children}</div>;
}

export function FormError({ children }: { children: ReactNode }) {
  return <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{children}</div>;
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="mt-[18px] flex gap-2.5">{children}</div>;
}

export function InputWithIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink-soft)] [&_input]:border-0 [&_input]:p-2.5 [&_input]:focus:border-0">
      {children}
    </div>
  );
}

export function SelectWrap({ children }: { children: ReactNode }) {
  return (
    <div className="relative [&_select]:appearance-none [&_select]:pr-[34px]">
      {children}
    </div>
  );
}
