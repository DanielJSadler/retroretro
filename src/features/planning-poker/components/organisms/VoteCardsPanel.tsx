import { VoteCard } from "../molecules/VoteCard";

interface VoteCardsPanelProps {
  cards: string[];
  selectedValue: string | null;
  onVote: (value: string) => void;
}

export function VoteCardsPanel({ cards, selectedValue, onVote }: VoteCardsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-100">
        Choose your card
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {cards.map((value) => (
          <VoteCard
            key={value}
            value={value}
            isSelected={selectedValue === value}
            onClick={() => onVote(value)}
            className="w-full"
          />
        ))}
      </div>
    </div>
  );
}
