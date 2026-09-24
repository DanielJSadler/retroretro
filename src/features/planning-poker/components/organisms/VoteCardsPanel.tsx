import { VoteCard } from "../molecules/VoteCard";

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, null];

interface VoteCardsPanelProps {
  selectedValue: number | null;
  onVote: (value: number | null) => void;
}

export function VoteCardsPanel({ selectedValue, onVote }: VoteCardsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-100">
        Choose your card
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {FIBONACCI.map((value) => (
          <VoteCard
            key={value === null ? "question" : value}
            value={value}
            isSelected={selectedValue === value}
            onClick={() => onVote(value)}
          />
        ))}
      </div>
    </div>
  );
}
