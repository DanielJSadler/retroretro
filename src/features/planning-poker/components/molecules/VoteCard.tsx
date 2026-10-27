interface VoteCardProps {
  value: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function VoteCard({ value, isSelected, onClick, className = "", disabled = false, compact = false }: VoteCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={disabled ? undefined : isSelected}
      onClick={onClick}
      className={`flex ${compact ? 'h-20 text-sm' : 'h-36 text-lg'} min-w-0 items-center justify-center rounded-2xl px-2 text-center font-bold [overflow-wrap:anywhere] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400 active:scale-95 ${
        isSelected
          ? "border-2 border-indigo-500 shadow-md animate-vote-flip bg-indigo-950/30 text-indigo-300"
          : "border hover:scale-105 hover:shadow-lg border-slate-700 bg-slate-800 text-slate-300"
      } ${disabled ? "cursor-default" : "cursor-pointer"} ${className}`}
    >
      {value}
    </button>
  );
}
