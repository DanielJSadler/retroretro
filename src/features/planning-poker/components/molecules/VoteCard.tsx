import { Card } from "../atoms/Card";

interface VoteCardProps {
  value: number | null;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function VoteCard({ value, isSelected, onClick, className = "", disabled = false }: VoteCardProps) {
  const displayValue = value === null ? "?" : String(value);

  return (
    <Card
      variant="bare"
      onClick={disabled ? undefined : onClick}
      className={`flex h-36 w-28 items-center justify-center rounded-2xl text-2xl font-bold transition-all duration-150 active:scale-95 ${
        isSelected
          ? "border-2 border-indigo-500 shadow-md animate-vote-flip bg-indigo-950/30 text-indigo-300"
          : "border hover:scale-105 hover:shadow-lg border-slate-700 bg-slate-800 text-slate-300"
      } ${disabled ? "opacity-100" : "cursor-pointer"} ${className}`}
    >
      {displayValue}
    </Card>
  );
}
