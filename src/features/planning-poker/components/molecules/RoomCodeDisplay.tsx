import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { IconButton } from "../atoms/IconButton";

interface RoomCodeDisplayProps {
  roomCode: string;
}

export function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="info" size="md">
        {roomCode}
      </Badge>
      <IconButton
        icon={copied ? Check : Copy}
        label={copied ? "Copied" : "Copy room code"}
        variant="ghost"
        size="sm"
        onClick={handleCopy}
      />
    </div>
  );
}
