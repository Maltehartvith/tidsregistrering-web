type ToggleButtonProps = {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "sm" | "md";
  className?: string;
};

const ToggleButton = ({
  label,
  checked,
  onChange,
  size = "md",
  className,
}: ToggleButtonProps) => {
  const switchEl = (
    <button
      type="button"
      className={`relative shrink-0 cursor-pointer rounded-full transition-colors ease-out duration-150 ${
        size === "sm" ? "h-4.75 w-8" : "h-6 w-10"
      } ${checked ? "bg-primary" : "bg-border"}`}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute top-0.75 rounded-full bg-card transition-[left] ease-out duration-150 ${
          size === "sm"
            ? `size-3.25 ${checked ? "left-4" : "left-0.75"}`
            : `size-4.5 ${checked ? "left-4.75" : "left-0.75"}`
        }`}
      />
    </button>
  );

  if (!label) return switchEl;

  return (
    <label
      className={
        className ??
        "mb-1 flex cursor-pointer items-center justify-between text-[13px] font-semibold"
      }
    >
      <span>{label}</span>
      {switchEl}
    </label>
  );
};

export default ToggleButton;
