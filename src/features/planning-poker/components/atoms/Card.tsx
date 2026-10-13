import { type ReactNode, type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "outlined" | "elevated";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", className = "", ...props }, ref) => {
    const variants = {
      default: "bg-slate-900",
      outlined: "border border-slate-800 bg-slate-900",
      elevated: "bg-slate-900 shadow-lg",
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl p-4 ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
