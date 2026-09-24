import { AlertTriangle } from "lucide-react";

interface OutlierBadgeProps {
  isOutlier: boolean;
}

export function OutlierBadge({ isOutlier }: OutlierBadgeProps) {
  if (!isOutlier) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-900/30 text-amber-300">
      <AlertTriangle size={12} />
      Outlier
    </span>
  );
}
