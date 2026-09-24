import { PlayerCard } from "../molecules/PlayerCard";

interface Player {
  _id: string;
  name: string;
  hasVoted: boolean;
  isModerator: boolean;
  isConnected: boolean;
  disambiguator?: number;
}

interface PlayerListProps {
  players: Player[];
}

export function PlayerList({ players }: PlayerListProps) {
  const votedCount = players.filter((p) => p.hasVoted).length;
  const totalCount = players.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">
          Players ({totalCount})
        </h2>
        <span className="text-xs text-slate-400">
          {votedCount}/{totalCount} voted
        </span>
      </div>
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {players.map((player) => (
          <PlayerCard
            key={player._id}
            name={player.name}
            hasVoted={player.hasVoted}
            isModerator={player.isModerator}
            isConnected={player.isConnected}
            disambiguator={player.disambiguator}
          />
        ))}
      </div>
      {votedCount === totalCount && totalCount > 0 && (
        <p className="text-center text-xs font-medium text-emerald-400">
          All votes in — ready to reveal
        </p>
      )}
    </div>
  );
}
