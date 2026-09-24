import { VoteCard } from "../molecules/VoteCard";
import { AverageDisplay } from "../molecules/AverageDisplay";
import { ResultsChart } from "./ResultsChart";

interface Vote {
  playerId: string;
  playerName: string;
  value: number | null;
}

interface RevealPanelProps {
  votes: Vote[];
  outliers: Set<string>;
}

export function RevealPanel({ votes, outliers }: RevealPanelProps) {
  const voteValues = votes.map((v) => v.value);
  const groupedVotes = Array.from(votes.reduce((groups, vote) => {
    const key = vote.value === null ? "?" : String(vote.value);
    const list = groups.get(key) ?? [];
    list.push(vote);
    groups.set(key, list);
    return groups;
  }, new Map<string, Vote[]>())).sort((a, b) => {
    if (a[0] === "?") return 1;
    if (b[0] === "?") return -1;
    return Number(a[0]) - Number(b[0]);
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-6">
        <h2 className="text-lg font-semibold text-slate-100">Results</h2>
        <AverageDisplay votes={voteValues} />
        <div className="flex flex-wrap gap-6">
          {groupedVotes.map(([value, group]) => (
            <div key={value} className="relative flex min-w-[140px] items-start">
              <div className="relative flex min-h-[180px] flex-col items-center">
                {group.map((vote, index) => (
                  <div
                    key={vote.playerId}
                    className="relative"
                    style={{
                      zIndex: index + 1,
                      marginTop: index === 0 ? 0 : -96,
                    }}
                  >
                    <VoteCard
                      value={vote.value}
                      isSelected={false}
                      onClick={() => {}}
                      disabled
                      className={`w-28 ${outliers.has(vote.playerId) ? "border-2 border-amber-500 bg-amber-950/30" : ""}`}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] text-slate-400">
                      {vote.playerName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:w-[320px] lg:sticky lg:top-4">
        <ResultsChart votes={voteValues.map((value) => ({ value }))} />
      </div>
    </div>
  );
}
