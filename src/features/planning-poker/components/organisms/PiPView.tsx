import { AverageDisplay } from '../molecules/AverageDisplay';
import { ResultsChart } from './ResultsChart';
import { VoteCard } from '../molecules/VoteCard';
import { Button } from '../atoms/Button';
import { RoomHeader } from './RoomHeader';

type Status = 'voting' | 'revealed';

interface Vote {
  playerId: string;
  playerName: string;
  value: number | null;
}

interface PiPViewProps {
  roomCode: string;
  status: Status;
  selectedVote: number | null;
  votes: Vote[] | null;
  isModerator: boolean;
  onVote: (value: number | null) => void;
  onReveal: () => void;
  onReset: () => void;
}

const VOTE_VALUES = [1, 2, 3, 5, 8, 13, 21, null];

export function PiPView({
  roomCode,
  status,
  selectedVote,
  votes,
  isModerator,
  onVote,
  onReveal,
  onReset,
}: PiPViewProps) {
  const voteValues = votes?.map((vote) => vote.value) ?? [];

  return (
    <div id="planning-poker" className="dark min-h-screen bg-slate-950 p-3 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[420px] flex-col justify-between gap-4">
        <RoomHeader roomCode={roomCode} status={status} onReset={onReset} />
        {status === 'voting' ? (
          <>
            <div className="flex flex-1 flex-col rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-200">Cast vote</p>
              </div>
              <div className="grid flex-1 grid-cols-4 gap-3">
                {VOTE_VALUES.map((value) => (
                  <Button
                    key={value === null ? 'question' : value}
                    variant={selectedVote === value ? 'primary' : 'secondary'}
                    size="md"
                    onClick={() => onVote(value)}
                    className="min-h-20 px-2 text-base"
                  >
                    {value ?? '?'}
                  </Button>
                ))}
              </div>
            </div>
            {isModerator && (
              <Button
                onClick={onReveal}
                className="mt-auto w-full gap-2 py-4 text-base"
              >
                Reveal votes
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex flex-row items-center gap-3">
                <div className="rounded-lg bg-slate-950/70 p-2">
                  <AverageDisplay votes={voteValues} />
                </div>
                <div className="w-full">
                  <ResultsChart
                    votes={voteValues.map((value) => ({ value }))}
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex flex-wrap gap-2">
                {votes?.slice(0, 6).map((vote) => (
                  <div key={vote.playerId} className="relative">
                    <VoteCard
                      value={vote.value}
                      isSelected={false}
                      onClick={() => {}}
                      disabled
                      className="h-28 w-20 text-xl"
                    />
                    <div className="mt-1 w-20 truncate text-center text-[10px] text-slate-400">
                      {vote.playerName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
