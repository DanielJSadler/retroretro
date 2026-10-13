interface VoteCardProps {
  value: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function VoteCard({ value, isSelected, onClick, className = "", disabled = false }: VoteCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={disabled ? undefined : isSelected}
      onClick={onClick}
      className={`flex h-36 min-w-0 items-center justify-center rounded-2xl px-2 text-center text-lg font-bold break-words transition-all duration-150 active:scale-95 ${
        isSelected
          ? "border-2 border-indigo-500 shadow-md animate-vote-flip bg-indigo-950/30 text-indigo-300"
          : "border hover:scale-105 hover:shadow-lg border-slate-700 bg-slate-800 text-slate-300"
      } ${disabled ? "cursor-default" : "cursor-pointer"} ${className}`}
    >
      {value}
    </button>
  );
}
