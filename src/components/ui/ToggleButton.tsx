type ToggleButtonProps = {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
};

const ToggleButton = ({
  label,
  checked,
  onChange,
  size = "md",
  className,
  disabled = false,
  loading = false,
}: ToggleButtonProps) => {
  const inactive = disabled || loading;

  const switchEl = (
    <button
      type="button"
      className={`relative shrink-0 rounded-full transition-colors ease-out duration-150 ${
        size === "sm" ? "h-4.75 w-8" : "h-6 w-10"
      } ${checked ? "bg-primary" : "bg-border"} ${
        inactive ? "cursor-default opacity-80" : "cursor-pointer"
      }`}
      aria-pressed={checked}
      aria-busy={loading || undefined}
      disabled={inactive}
      onClick={() => {
        if (inactive) return;
        onChange(!checked);
      }}
    >
      <span
        className={`absolute top-0.75 flex items-center justify-center rounded-full bg-card transition-[left] ease-out duration-150
          ${loading ? "animate-spin" : ""}
          ${
          size === "sm"
            ? `size-3.25 ${checked ? "left-4" : "left-0.75"}`
            : `size-4.5 ${checked ? "left-4.75" : "left-0.75"}`
        }`}
      >
        {loading && (
          <span
            className={`animate-spin rounded-full border-2 border-primary/20 border-t-primary ${
              size === "sm" ? "size-2" : "size-2.5"
            }`}
            aria-hidden
          />
        )}
      </span>
    </button>
  );

  if (!label) return switchEl;

  return (
    <label
      className={
        className ??
        `mb-1 flex items-center justify-between text-[13px] font-semibold ${
          inactive ? "cursor-default" : "cursor-pointer"
        }`
      }
    >
      <span>{label}</span>
      {switchEl}
    </label>
  );
};

export default ToggleButton;
