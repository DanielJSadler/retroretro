import { type ReactNode } from "react";
import { RoomHeader } from "../organisms/RoomHeader";
import { ReconnectingBanner } from "../organisms/ReconnectingBanner";
import { TableSeats } from "../organisms/TableSeats";

interface Player {
  _id: string;
  name: string;
  hasVoted: boolean;
  isModerator: boolean;
  isConnected: boolean;
  disambiguator?: number;
}

interface GameLayoutProps {
  roomCode: string;
  status: "voting" | "revealed";
  players: Player[];
  children: ReactNode;
  tableOverlay?: ReactNode;
  isReconnecting?: boolean;
}

export function GameLayout({ roomCode, status, players, children, tableOverlay, isReconnecting }: GameLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl p-4">
      <ReconnectingBanner isVisible={isReconnecting ?? false} />
      <div className="mb-4">
        <RoomHeader roomCode={roomCode} status={status} />
      </div>
      <div className="flex flex-col gap-6 pt-4 md:pt-8">
        <TableSeats players={players} overlay={tableOverlay} />
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
