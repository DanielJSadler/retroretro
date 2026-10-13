import { useMemo } from "react";
import type { PokerDeck } from "../../lib/decks";

interface Vote {
  value: string;
}

interface ResultsChartProps {
  votes: Vote[];
  deck: PokerDeck;
}

export function ResultsChart({ votes, deck }: ResultsChartProps) {
  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    votes.forEach((v) => {
      counts.set(v.value, (counts.get(v.value) || 0) + 1);
    });
    return deck.cards.filter((card) => counts.has(card)).map((card) => [card, counts.get(card)!] as const);
  }, [deck.cards, votes]);

  const maxCount = Math.max(...distribution.map(([, count]) => count), 1);
  const total = votes.length;

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-300">
        Distribution
      </h3>
      <div className="flex flex-col gap-2">
        {distribution.map(([value, count]) => {
          const percentage = (count / maxCount) * 100;
          return (
            <div key={value} className="flex items-center gap-3">
              <span className="w-16 break-words text-sm font-medium text-slate-300">
                {value}
              </span>
              <div className="flex-1">
                <div
                  className="h-6 rounded-md transition-all duration-700 ease-out bg-indigo-600"
                  style={{ width: `${percentage}%`, minWidth: "4px" }}
                />
              </div>
              <span className="w-8 text-right text-xs text-slate-400">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
