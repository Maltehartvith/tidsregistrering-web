type SpinnerProps = {
  /** Tailwind spacing units (e.g. 10 → 2.5rem / 40px). */
  size?: number;
  className?: string;
};

const Spinner = ({ size = 12.5, className }: SpinnerProps) => {
  const px = size * 4;
  const stroke = Math.max(1, px * 0.04);
  const hub = Math.max(1.5, px * 0.08);
  const minute = px * 0.36;
  const hour = px * 0.28;
  const c = px / 2;

  const pivot = {
    transformBox: "view-box" as const,
    transformOrigin: `${c}px ${c}px`,
  };

  return (
    <svg
      className={`inline-block text-primary ${className ?? ""}`}
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      aria-hidden
    >
      <circle
        cx={c}
        cy={c}
        r={c - stroke}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
      />
      <line
        className="animate-spin"
        style={pivot}
        x1={c}
        y1={c}
        x2={c + minute}
        y2={c}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <line
        className="animate-[spin_4s_linear_infinite]"
        style={pivot}
        x1={c}
        y1={c}
        x2={c + hour}
        y2={c}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />{" "}
      <circle cx={c} cy={c} r={hub / 2} fill="currentColor" />
    </svg>
  );
};

export default Spinner;
