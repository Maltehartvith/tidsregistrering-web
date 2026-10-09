import type { ChangeEvent } from "react";
import { fieldControlClass } from "./inputStyles";

type TextAreaProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function TextArea({
  value,
  onChange,
  rows = 2,
  placeholder,
  required,
  className = "",
}: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`${fieldControlClass} resize-y ${className}`.trim()}
    />
  );
}
