import { VoteCard } from "../molecules/VoteCard";

interface VoteCardsPanelProps {
  cards: string[];
  selectedValue: string | null;
  onVote: (value: string) => void;
  compact?: boolean;
}

export function VoteCardsPanel({ cards, selectedValue, onVote, compact = false }: VoteCardsPanelProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h2 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-slate-100`}>
        Choose your card
      </h2>
      <div className={`grid gap-4 p-3 ${compact ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,3.5rem),1fr))]' : 'grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))]'}`}>
        {cards.map((value) => (
          <VoteCard
            key={value}
            value={value}
            isSelected={selectedValue === value}
            onClick={() => onVote(value)}
            className="w-full"
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
