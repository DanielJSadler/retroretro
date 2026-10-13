import { WifiOff } from "lucide-react";

interface ReconnectingBannerProps {
  isVisible: boolean;
}

export function ReconnectingBanner({ isVisible }: ReconnectingBannerProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white shadow-lg animate-reveal-in">
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={16} />
        <span>Connection lost. Reconnecting...</span>
      </div>
    </div>
  );
}
