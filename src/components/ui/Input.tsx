import { useState } from "react";
import { Button } from "./Button";
import { EyeIcon, EyeOffIcon } from "lucide-react";

type InputProps = {
  value: React.InputHTMLAttributes<HTMLInputElement>["value"];
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  icon?: React.ReactNode;
  type: React.InputHTMLAttributes<HTMLInputElement>["type"];
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  autoComplete?: "email" | "password" | "current-password";
  placeholder?: string;
  className?: string;
};
const Input = ({
  value,
  onChange,
  icon,
  type,
  onKeyDown,
  autoComplete,
  placeholder,
  className,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const previewVisible =
    (showPassword && !isHovered) || (!showPassword && isHovered);

  return (
    <div
      className={`input-shell flex items-center gap-2 rounded-md border-[1.5px] border-border bg-card px-3 py-2 text-ink-soft focus-within:border-primary transition-colors duration-200 ${className}`}
    >
      {icon && icon}
      <input
        className="bg-transparent outline-none border-none w-full"
        type={showPassword ? "text" : type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
      {type === "password" && (
        <Button
          variant="ghost"
          type="button"
          className="p-2.5!"
          aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
          onClick={() => setShowPassword(!showPassword)}
          onMouseOver={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className="relative block h-4 w-4">
            <EyeIcon
              className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${
                previewVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
              }`}
            />
            <EyeOffIcon
              className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${
                previewVisible ? "scale-75 opacity-0" : "scale-100 opacity-100"
              }`}
            />
          </span>
        </Button>
      )}
    </div>
  );
};

export default Input;
