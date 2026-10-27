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
  const split = Math.ceil(players.length / 2);
  const rows = [players.slice(0, split), players.slice(split)];

  const renderRow = (row: Player[], label: string) => (
    <ul aria-label={label} className="relative z-30 grid grid-cols-3 gap-3 sm:grid-cols-6">
      {row.map((player) => (
        <li key={player._id} className="min-w-0">
          <Seat player={player} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-visible rounded-[2rem] border border-slate-700 bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 p-3 shadow-2xl sm:p-6">
      <div className="pointer-events-none absolute inset-5 rounded-[1.6rem] border border-white/10 bg-black/10" />
      {renderRow(rows[0], 'Players at the top of the table')}
      <div className="relative flex min-h-[280px] flex-col items-center justify-center gap-4 py-6">
        <div className="relative z-10 rounded-full border border-white/20 bg-slate-950/55 px-6 py-3 text-center text-white shadow-inner">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Planning Table</p>
          <p className="mt-2 text-sm text-white/80">Everyone votes from around the table</p>
        </div>
        {overlay ? <div className="relative z-20 w-28 self-center">{overlay}</div> : null}
      </div>
      {renderRow(rows[1], 'Players at the bottom of the table')}
    </div>
  );
}

function Seat({ player }: { player: Player }) {
  const displayName = player.disambiguator
    ? `${player.name} (${player.disambiguator})`
    : player.name;

  return (
    <div className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center shadow-xl ring-1 backdrop-blur bg-slate-900/95 ring-white/10">
      <div
        className={`h-3 w-3 rounded-full ${player.hasVoted ? 'bg-emerald-400' : 'bg-slate-300'}`}
      />
      <span title={displayName}
        className="w-full break-words text-xs font-semibold text-slate-100">
        {displayName}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-slate-400">
        {player.isModerator ? 'Mod' : player.isConnected ? 'Here' : 'Away'}
      </span>
    </div>
  );
}
