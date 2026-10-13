import { Eye, Layers3, PictureInPicture2, RotateCcw } from 'lucide-react';
import { Button } from '../atoms/Button';

interface SessionControlsProps {
  isModerator: boolean;
  status: 'voting' | 'revealed';
  onReveal: () => void;
  onReset: () => void;
  onOpenPiP?: () => void;
  onChangeDeck: () => void;
  canChangeDeck: boolean;
}

export function SessionControls({
  isModerator,
  status,
  onReveal,
  onReset,
  onOpenPiP,
  onChangeDeck,
  canChangeDeck,
}: SessionControlsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {onOpenPiP && (
        <Button onClick={onOpenPiP} variant="secondary" className="gap-2">
          <PictureInPicture2 size={18} />
          Open PiP
        </Button>
      )}
      {status === 'voting' && isModerator && (
        <Button onClick={onReveal} className="gap-2">
          <Eye size={18} />
          Reveal Votes
        </Button>
      )}
      {status === 'revealed' && isModerator && (
        <Button onClick={onReset} variant="secondary" className="gap-2">
          <RotateCcw size={18} />
          Reset Round
        </Button>
      )}
      {isModerator && (
        <Button type="button" onClick={onChangeDeck} disabled={!canChangeDeck}
          title={canChangeDeck ? "Choose cards for this room" : "Reveal or reset the current round first"}
          variant="secondary" className="gap-2">
          <Layers3 size={18} />
          Change Deck
        </Button>
      )}
    </div>
  );
}
