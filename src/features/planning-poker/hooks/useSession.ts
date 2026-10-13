import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function useSession(roomCode: string) {
  const session = useQuery(api.sessions.getSession, { roomCode });
  const players = useQuery(
    api.players.getPlayers,
    session?._id ? { sessionId: session._id } : "skip"
  );

  return {
    session,
    players,
    isLoading: session === undefined || players === undefined,
  };
}
