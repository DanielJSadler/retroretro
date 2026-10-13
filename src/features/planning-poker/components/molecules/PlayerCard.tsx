import { User, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "../atoms/Badge";

interface PlayerCardProps {
  name: string;
  hasVoted: boolean;
  isModerator: boolean;
  isConnected: boolean;
  disambiguator?: number;
}

export function PlayerCard({
  name,
  hasVoted,
  isModerator,
  isConnected,
  disambiguator,
}: PlayerCardProps) {
  const displayName = disambiguator ? `${name} (${disambiguator})` : name;

  return (
    <div className="flex items-center gap-3 rounded-lg p-3 shadow-sm transition-all hover:shadow-md bg-slate-800">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-900/30 text-indigo-400">
        <User size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-100">
            {displayName}
          </span>
          {isModerator && (
            <Badge variant="info" size="sm">
              Moderator
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {!isConnected && (
            <span className="text-xs text-slate-500">Offline</span>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {hasVoted ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-slate-600" />
        )}
      </div>
    </div>
  );
}
