import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function useVoting() {
  const submitVote = useMutation(api.pokerVotes.submitVote);
  const revealVotes = useMutation(api.pokerVotes.revealVotes);
  const resetRound = useMutation(api.sessions.resetRound);
  const createSession = useMutation(api.sessions.createSession);
  const joinSession = useMutation(api.sessions.joinSession);
  const updatePlayerStatus = useMutation(api.sessions.updatePlayerStatus);

  return {
    submitVote,
    revealVotes,
    resetRound,
    createSession,
    joinSession,
    updatePlayerStatus,
  };
}
