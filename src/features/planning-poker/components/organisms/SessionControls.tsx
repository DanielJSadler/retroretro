import { Eye, PictureInPicture2, RotateCcw } from 'lucide-react';
import { Button } from '../atoms/Button';

interface SessionControlsProps {
  isModerator: boolean;
  status: 'voting' | 'revealed';
  onReveal: () => void;
  onReset: () => void;
  onOpenPiP?: () => void;
}

export function SessionControls({
  isModerator,
  status,
  onReveal,
  onReset,
  onOpenPiP,
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
    </div>
  );
}
