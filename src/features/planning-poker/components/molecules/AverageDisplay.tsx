import { Calculator } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { getNumericScale, numericVote, type PokerDeck } from "../../lib/decks";

interface AverageDisplayProps {
  votes: string[];
  deck: PokerDeck;
}

export function AverageDisplay({ votes, deck }: AverageDisplayProps) {
  const scale = getNumericScale(deck);
  const numericVotes = votes
    .map((vote) => numericVote(vote, scale))
    .filter((vote): vote is number => vote !== null);
  const questionCount = votes.filter((vote) => vote === "?").length;

  const average =
    numericVotes.length > 0
      ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
      : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {scale && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 shadow-sm">
          <Calculator className="h-5 w-5 text-indigo-500" />
          <div>
            <span className="text-xs text-slate-400">Average</span>
            <p className="text-lg font-bold text-slate-100">
              {average !== null ? `${average.toFixed(1)}${scale === "percentage" ? "%" : ""}` : "—"}
            </p>
          </div>
        </div>
      )}
      {questionCount > 0 && (
        <Badge variant="warning" size="md">
          {questionCount} unsure
        </Badge>
      )}
    </div>
  );
}
