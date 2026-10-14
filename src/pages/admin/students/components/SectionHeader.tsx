type SectionHeaderProps = {
  icon: React.ReactNode;
  title: string;
  className?: string;
};

export default function SectionHeader({
  icon,
  title,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={`mb-2 flex items-center gap-2 font-display text-[15px] font-semibold text-ink ${className ?? ""}`}
    >
      {icon}
      {title}
    </div>
  );
}
