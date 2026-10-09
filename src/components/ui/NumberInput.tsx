import type { ChangeEvent } from "react";
import { fieldControlClass } from "./inputStyles";

type NumberInputProps = {
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  inputMode?: "decimal" | "numeric";
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = "any",
  inputMode = "decimal",
  placeholder,
  required,
  className = "",
}: NumberInputProps) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`${fieldControlClass} ${className}`.trim()}
    />
  );
}
