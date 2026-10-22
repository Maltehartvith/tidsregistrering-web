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
      className={`flex items-center gap-2 font-display text-md font-semibold text-ink ${className ?? ""}`}
    >
      {icon}
      {title}
    </div>
  );
}
