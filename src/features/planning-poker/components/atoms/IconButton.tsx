import { type ButtonHTMLAttributes, forwardRef } from "react";
import { type LucideIcon } from "lucide-react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: "default" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, variant = "default", size = "md", className = "", ...props }, ref) => {
    const variants = {
      default: "bg-slate-800 text-slate-300 hover:bg-slate-700",
      ghost: "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
    };

    const sizes = {
      sm: "p-1.5",
      md: "p-2",
      lg: "p-3",
    };

    const iconSizes = {
      sm: 16,
      md: 20,
      lg: 24,
    };

    return (
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${variants[variant]} ${sizes[size]} ${className}`}
        aria-label={label}
        {...props}
      >
        <Icon size={iconSizes[size]} />
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
