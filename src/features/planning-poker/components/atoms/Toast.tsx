import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

interface ToastContextType {
  addToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "error") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg animate-reveal-in ${
              toast.type === "error"
                ? "bg-red-900/30 text-red-300"
                : toast.type === "success"
                ? "bg-emerald-900/30 text-emerald-300"
                : "bg-indigo-900/30 text-indigo-300"
            }`}
          >
            {toast.type === "error" && <AlertCircle size={18} />}
            {toast.type === "success" && <CheckCircle size={18} />}
            {toast.type === "info" && <Info size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 rounded p-1 hover:bg-white/5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
