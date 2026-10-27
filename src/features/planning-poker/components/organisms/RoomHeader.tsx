import { RotateCcw, Users } from 'lucide-react';
import { RoomCodeDisplay } from '../molecules/RoomCodeDisplay';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';

interface RoomHeaderProps {
  roomCode: string;
  deckName: string;
  status: 'voting' | 'revealed';
  onReset?: () => void;
}

export function RoomHeader({ roomCode, deckName, status, onReset }: RoomHeaderProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl p-3 shadow-sm bg-slate-800">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <Users className="h-6 w-6 shrink-0 text-indigo-500" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-slate-100">
            Planning Poker
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <RoomCodeDisplay roomCode={roomCode} />
            <Badge variant={status === 'voting' ? 'info' : 'success'} size="sm">
              {status === 'voting' ? 'Voting' : 'Revealed'}
            </Badge>
            <span className="min-w-0 break-words text-xs text-slate-400">{deckName}</span>
          </div>
        </div>
        {onReset && (
          <Button onClick={onReset} variant="secondary" className="gap-2">
            <RotateCcw size={18} />
            Reset Round
          </Button>
        )}
      </div>
    </div>
  );
}
