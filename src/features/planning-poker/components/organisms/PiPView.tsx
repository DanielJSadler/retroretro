import type { ReactNode } from 'react';
import { AverageDisplay } from '../molecules/AverageDisplay';
import { OutlierBadge } from '../molecules/OutlierBadge';
import { ResultsChart } from './ResultsChart';
import { VoteCardsPanel } from './VoteCardsPanel';
import { Button } from '../atoms/Button';
import { RoomHeader } from './RoomHeader';
import type { Player } from './TableSeats';
import type { PokerDeck } from '../../lib/decks';

interface Vote {
  playerId: string;
  playerName: string;
  value: string;
}

interface PiPViewProps {
  roomCode: string;
  round: number;
  deck: PokerDeck;
  status: 'voting' | 'revealed';
  selectedVote: string | null;
  players: Player[];
  currentPlayerId?: string;
  votes: Vote[] | null;
  outliers: Set<string>;
  isModerator: boolean;
  onVote: (value: string) => void;
  onReveal: () => void;
  onReset: () => void;
  onChangeDeck: () => void;
  canChangeDeck: boolean;
  deckPicker: ReactNode;
  error: string | null;
}

export function PiPView({
  roomCode, round, deck, status, selectedVote, players, currentPlayerId,
  votes, outliers, isModerator, onVote, onReveal, onReset,
  onChangeDeck, canChangeDeck, deckPicker, error,
}: PiPViewProps) {
  const activePlayers = players.filter((player) => player.isConnected);
  const voteCount = activePlayers.filter((player) => player.hasVoted).length;
  const voteValues = votes?.map((vote) => vote.value) ?? [];
  const votesByPlayer = new Map(votes?.map((vote) => [vote.playerId, vote]));

  return (
    <div id="planning-poker" className="dark min-h-screen min-w-0 bg-slate-950 p-3 text-slate-100">
      <div className="mx-auto flex w-full min-w-0 max-w-lg flex-col gap-3">
        <RoomHeader roomCode={roomCode} deckName={deck.name} status={status} />
        <section aria-label="Players and voting progress" className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs text-slate-300" aria-live="polite">
            <span>Round {round} ? {activePlayers.length} online</span>
            <span>{voteCount}/{activePlayers.length} voted</span>
          </div>
          <ul className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2">
            {players.map((player) => {
              const vote = votesByPlayer.get(player._id);
              const name = player.disambiguator ? player.name + ' (' + player.disambiguator + ')' : player.name;
              return (
                <li key={player._id} className="min-w-0 rounded-lg bg-slate-800 px-2 py-1.5 text-xs">
                  <p className="break-words font-semibold text-slate-100">{name}{player._id === currentPlayerId ? ' (you)' : ''}</p>
                  <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-slate-400">
                    {player.isModerator && <span>Mod</span>}
                    <span>{!player.isConnected ? 'Away' : status === 'revealed' ? (vote ? 'Voted' : 'No vote') : player.hasVoted ? 'Voted' : 'Choosing'}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
        {isModerator && (
          <div className="flex flex-wrap gap-2 p-1">
            {status === 'voting'
              ? <Button size="sm" onClick={onReveal}>Reveal votes</Button>
              : <Button size="sm" onClick={onReset}>Reset round</Button>}
            <Button size="sm" variant="secondary" onClick={onChangeDeck} disabled={!canChangeDeck}
              title={canChangeDeck ? 'Choose cards for this room' : 'Reveal or reset the current round first'}>Change deck</Button>
          </div>
        )}
        {error && <p role="alert" className="break-words rounded-lg bg-red-950 p-3 text-xs text-red-200">{error}</p>}
        {deckPicker}
        {status === 'voting' ? (
          <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <p className="mb-2 break-words text-xs text-slate-400" aria-live="polite">
              {selectedVote === null ? 'Choose a card below.' : 'Your vote: ' + selectedVote + '. Tap again to clear.'}
            </p>
            <VoteCardsPanel cards={deck.cards} selectedValue={selectedVote} onVote={onVote} compact />
          </section>
        ) : (
          <section aria-label="Round results" className="min-w-0 space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <h2 className="text-sm font-semibold">Results ? {votes?.length ?? 0} votes</h2>
            <AverageDisplay votes={voteValues} deck={deck} />
            <ResultsChart votes={voteValues.map((value) => ({ value }))} deck={deck} />
            {votes === null ? <p role="status" className="text-xs text-slate-400">Loading votes?</p>
              : votes.length === 0 ? <p className="text-xs text-slate-400">No votes this round.</p>
              : <ul className="space-y-2">
                {votes.map((vote) => (
                  <li key={vote.playerId} className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-slate-800 p-2 text-xs">
                    <span className="min-w-0 flex-1 break-words font-medium">{vote.playerName}</span>
                    <span className="max-w-full break-words rounded-md bg-indigo-950 px-2 py-1 font-bold text-indigo-200">{vote.value}</span>
                    <OutlierBadge isOutlier={outliers.has(vote.playerId)} />
                  </li>
                ))}
              </ul>}
          </section>
        )}
      </div>
    </div>
  );
}
