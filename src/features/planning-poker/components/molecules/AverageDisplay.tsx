import { Calculator } from "lucide-react";
import { Badge } from "../atoms/Badge";

interface AverageDisplayProps {
  votes: (number | null)[];
}

export function AverageDisplay({ votes }: AverageDisplayProps) {
  const numericVotes = votes.filter((v): v is number => v !== null);
  const questionCount = votes.length - numericVotes.length;

  const average =
    numericVotes.length > 0
      ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
      : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg p-3 shadow-sm bg-slate-800">
        <Calculator className="h-5 w-5 text-indigo-500" />
        <div>
          <span className="text-xs text-slate-400">Average</span>
          <p className="text-lg font-bold text-slate-100">
            {average !== null ? average.toFixed(1) : "—"}
          </p>
        </div>
      </div>
      {questionCount > 0 && (
        <Badge variant="warning" size="md">
          {questionCount} coffee break{questionCount > 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  );
}
