import { useState } from "react";
import { Button } from "./Button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { fieldControlClass } from "./inputStyles";

type InputProps = {
  value: React.InputHTMLAttributes<HTMLInputElement>["value"];
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  icon?: React.ReactNode;
  type: React.InputHTMLAttributes<HTMLInputElement>["type"];
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  autoComplete?: "email" | "password" | "current-password" | "off";
  placeholder?: string;
  className?: string;
  maxLength?: number;
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
  maxLength,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const previewVisible =
    (showPassword && !isHovered) || (!showPassword && isHovered);

  return (
    <div className={`relative`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        {icon && icon}
      </div>
      <input
        className={`${fieldControlClass} ${icon ? "pl-9" : ""} ${className}`.trim()}
        type={showPassword ? "text" : type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete || "off"}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {type === "password" && (
        <Button
          variant="ghost"
          type="button"
          className="p-1.5! absolute right-2 top-1/2 -translate-y-1/2"
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
