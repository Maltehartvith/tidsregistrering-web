import { hexToRgb, isValidHex } from "@/theme/colors";
import { fieldControlClass } from "./inputStyles";

function toPickerValue(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  return (
    "#" +
    rgb
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

type ColorInputProps = {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
};

export function ColorInput({
  value,
  onChange,
  className = "",
}: ColorInputProps) {
  const swatch = isValidHex(value) ? toPickerValue(value) : "#000000";

  return (
    <div className={`flex gap-2 ${className}`.trim()}>
      <label
        className="relative w-14  shrink-0 cursor-pointer overflow-hidden rounded-md border-[1.5px] border-border transition-colors hover:border-primary focus-within:border-primary"
        title="Vælg farve"
      >
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundColor: swatch }}
        />
        <input
          type="color"
          value={swatch}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Vælg farve"
        />
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const trimmed = value.trim();
          if (!trimmed) return;
          const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
          if (isValidHex(withHash)) onChange(toPickerValue(withHash));
        }}
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
        placeholder="#000000"
        aria-label="Farvekode"
        className={`${fieldControlClass} max-w-32 font-mono`}
      />
    </div>
  );
}
