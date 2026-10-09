import type { ChangeEvent } from "react";
import { fieldControlClass } from "./inputStyles";

type DateInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
};

export function DateInput({
  value,
  onChange,
  required,
  className = "",
}: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={onChange}
      required={required}
      className={`${fieldControlClass} ${className}`.trim()}
    />
  );
}
