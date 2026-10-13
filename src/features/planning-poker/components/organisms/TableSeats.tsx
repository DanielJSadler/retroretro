import { type ReactNode } from 'react';

export interface Player {
  _id: string;
  name: string;
  hasVoted: boolean;
  isModerator: boolean;
  isConnected: boolean;
  disambiguator?: number;
}

interface TableSeatsProps {
  players: Player[];
  overlay?: ReactNode;
}

export function TableSeats({ players, overlay }: TableSeatsProps) {
  const positions = [
    'left-[50%] top-0 -translate-x-1/2 -translate-y-1/2',
    'right-0 top-[20%] translate-x-1/2 -translate-y-1/2',
    'right-0 bottom-[20%] translate-x-1/2 translate-y-1/2',
    'left-[50%] bottom-0 -translate-x-1/2 translate-y-1/2',
    'left-0 bottom-[20%] -translate-x-1/2 translate-y-1/2',
    'left-0 top-[20%] -translate-x-1/2 -translate-y-1/2',
  ];

  return (
    <div className="relative mx-auto min-h-[380px] w-full max-w-5xl overflow-visible rounded-[2rem] border bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 p-6 shadow-2xl border-slate-700">
      <div className="absolute inset-5 rounded-[1.6rem] border border-white/10 bg-black/10" />
      <div className="relative flex min-h-[332px] w-full items-center justify-center">
        {overlay ? (
          <div className="absolute left-[12%] z-20 translate-y-[22%]">
            {overlay}
          </div>
        ) : null}
        {players.map((player, index) => (
          <div
            key={player._id}
            className={`absolute z-30 ${positions[index % positions.length]}`}
          >
            <Seat player={player} />
          </div>
        ))}

        <div className="relative z-10 flex min-h-[120px] min-w-[260px] items-center justify-center rounded-[999px] border border-white/20 bg-slate-950/55 px-10 py-8 text-center text-white shadow-inner backdrop-blur-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
              Planning Table
            </p>
            <p className="mt-2 text-sm text-white/80">
              Everyone votes from around the table
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Seat({ player }: { player: Player }) {
  const displayName = player.disambiguator
    ? `${player.name} (${player.disambiguator})`
    : player.name;

  return (
    <div className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center shadow-xl ring-1 backdrop-blur bg-slate-900/95 ring-white/10">
      <div
        className={`h-3 w-3 rounded-full ${player.hasVoted ? 'bg-emerald-400' : 'bg-slate-300'}`}
      />
      <span className="truncate text-xs font-semibold text-slate-100">
        {displayName}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-slate-400">
        {player.isModerator ? 'Mod' : player.isConnected ? 'Here' : 'Away'}
      </span>
    </div>
  );
}
