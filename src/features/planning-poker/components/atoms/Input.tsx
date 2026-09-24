import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label className="mb-1 block text-sm font-medium text-slate-300">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          className={`w-full rounded-lg border px-4 py-2 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
