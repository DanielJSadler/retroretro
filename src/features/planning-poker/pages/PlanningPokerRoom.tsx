"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { usePlayer } from "../hooks/usePlayer";
import { useVoting } from "../hooks/useVoting";
import { useToast } from "../components/atoms/Toast";
import { GameLayout } from "../components/templates/GameLayout";
import { VoteMotionStack } from "../components/organisms/VoteMotionStack";
import { VoteCardsPanel } from "../components/organisms/VoteCardsPanel";
import { RevealPanel } from "../components/organisms/RevealPanel";
import { SessionControls } from "../components/organisms/SessionControls";
import { PiPView } from "../components/organisms/PiPView";
import { JoinForm } from "../components/molecules/JoinForm";
import { Spinner } from "../components/atoms/Spinner";
import { ConfettiBurst } from "../components/atoms/ConfettiBurst";
import { calculateOutliers } from "../lib/constants";

export default function PlanningPokerRoom() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode.toUpperCase();
  const router = useRouter();
  const { player, savePlayer, isModerator, isLoading: isPlayerLoading } = usePlayer();
  const {
    submitVote,
    revealVotes,
    resetRound,
    joinSession,
    updatePlayerStatus,
  } = useVoting();
  const { addToast } = useToast();

  const session = useQuery(api.sessions.getSession, { roomCode });
  const players = useQuery(
    api.players.getPlayers,
    session?._id ? { sessionId: session._id } : "skip",
  );
  const votes = useQuery(
    api.pokerVotes.getVotes,
    session?._id && session.status === "revealed"
      ? { sessionId: session._id, round: session.round }
      : "skip",
  );
  const currentVote = useQuery(
    api.pokerVotes.getCurrentVote,
    session?._id && player?.playerId
      ? {
          sessionId: session._id,
          playerId: player.playerId as never,
          round: session.round,
        }
      : "skip",
  );
  const currentUser = useQuery(api.users.current);

  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isPiPEnabled, setIsPiPEnabled] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);
  const pipRootRef = useRef<Root | null>(null);
  const openPiPRef = useRef<() => Promise<void>>(async () => {});

  const currentPlayer = useMemo(() => {
    if (!player || !players) return null;
    return players.find((candidate) => candidate._id === player.playerId) ?? null;
  }, [player, players]);

  const handleVote = useCallback(
    async (value: number | null) => {
      if (!session || !player || !currentPlayer) return;
      setSelectedVote(value);
      try {
        await submitVote({
          sessionId: session._id,
          playerId: player.playerId as never,
          value,
        });
      } catch {
        addToast("Could not submit your vote. Please try again.");
      }
    },
    [addToast, currentPlayer, player, session, submitVote],
  );

  const handleReveal = useCallback(async () => {
    if (!session) return;
    try {
      await revealVotes({ sessionId: session._id });
    } catch {
      addToast("Could not reveal votes. Please try again.");
    }
  }, [addToast, revealVotes, session]);

  const handleReset = useCallback(async () => {
    if (!session) return;
    setSelectedVote(null);
    try {
      await resetRound({ sessionId: session._id });
    } catch {
      addToast("Could not reset the round. Please try again.");
    }
  }, [addToast, resetRound, session]);

  const syncPiPStyles = (pipWindow: Window) => {
    pipWindow.document.head.innerHTML = "";
    document.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
      pipWindow.document.head.appendChild(node.cloneNode(true));
    });
  };

  const handleOpenPiP = async () => {
    const pictureInPicture = (window as Window & { documentPictureInPicture?: any })
      .documentPictureInPicture;
    if (!pictureInPicture) return;
    if (pipWindowRef.current && !pipWindowRef.current.closed) return;

    try {
      const pipWindow = (await pictureInPicture.requestWindow({
        width: 500,
        height: 500,
      })) as Window;

      syncPiPStyles(pipWindow);
      pipWindow.document.body.style.margin = "0";
      pipWindow.document.body.style.background = "#020617";

      pipWindowRef.current = pipWindow;
      pipRootRef.current?.unmount();
      pipRootRef.current = createRoot(pipWindow.document.body);
      pipRootRef.current.render(
        <PiPView
          roomCode={roomCode}
          status={session?.status ?? "voting"}
          selectedVote={selectedVote}
          votes={votes ?? null}
          isModerator={isModerator(session?.moderatorId ?? "")}
          onVote={handleVote}
          onReveal={handleReveal}
          onReset={handleReset}
        />,
      );
      pipWindow.addEventListener("pagehide", () => {
        pipWindowRef.current = null;
        pipRootRef.current?.unmount();
        pipRootRef.current = null;
      });
    } catch {
      // Picture-in-Picture can be unsupported or blocked by the browser.
    }
  };
  openPiPRef.current = handleOpenPiP;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pipWindowRef.current?.close();
        pipWindowRef.current = null;
        pipRootRef.current?.unmount();
        pipRootRef.current = null;
      } else if (isPiPEnabled) {
        void openPiPRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pipWindowRef.current?.close();
      pipWindowRef.current = null;
      pipRootRef.current?.unmount();
      pipRootRef.current = null;
    };
  }, [isPiPEnabled]);

  useEffect(() => {
    if (!pipRootRef.current) return;
    pipRootRef.current.render(
      <PiPView
        roomCode={roomCode}
        status={session?.status ?? "voting"}
        selectedVote={selectedVote}
        votes={votes ?? null}
        isModerator={isModerator(session?.moderatorId ?? "")}
        onVote={handleVote}
        onReveal={handleReveal}
        onReset={handleReset}
      />,
    );
  }, [handleReveal, handleReset, handleVote, isModerator, roomCode, selectedVote, session?.moderatorId, session?.status, votes]);

  const togglePiP = async () => {
    const nextEnabled = !isPiPEnabled;
    setIsPiPEnabled(nextEnabled);
    if (nextEnabled) {
      await handleOpenPiP();
    } else {
      pipWindowRef.current?.close();
      pipWindowRef.current = null;
    }
  };

  const handleJoin = async (name: string) => {
    if (!session) return;
    setIsJoining(true);
    try {
      const result = await joinSession({ roomCode, playerName: name });
      savePlayer({ playerId: result.playerId, name, sessionId: result.sessionId });
    } catch {
      addToast("Failed to join this room. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (!currentPlayer || !player?.playerId) return;

    const markDisconnected = () => {
      updatePlayerStatus({ playerId: player.playerId as never, isConnected: false });
    };

    void updatePlayerStatus({ playerId: player.playerId as never, isConnected: true });
    window.addEventListener("beforeunload", markDisconnected);
    return () => window.removeEventListener("beforeunload", markDisconnected);
  }, [currentPlayer, player?.playerId, updatePlayerStatus]);

  useEffect(() => {
    if (currentVote?.value !== undefined) {
      setSelectedVote(currentVote.value);
    } else if (session?.status === "voting") {
      setSelectedVote(null);
    }
  }, [currentVote, session?.status]);

  const outlierIds = useMemo(() => {
    if (!votes) return new Set<string>();
    const outlierIndices = calculateOutliers(votes.map((vote) => vote.value));
    const ids = new Set<string>();
    votes.forEach((vote, index) => {
      if (outlierIndices.has(index)) ids.add(vote.playerId);
    });
    return ids;
  }, [votes]);

  const shouldCelebrate = useMemo(() => {
    if (session?.status !== "revealed" || !votes || votes.length === 0) return false;
    const numericVotes = votes
      .map((vote) => vote.value)
      .filter((value): value is number => value !== null);
    return numericVotes.length > 0 && numericVotes.every((value) => value === numericVotes[0]);
  }, [session?.status, votes]);

  if (session === null) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border p-8 text-center shadow-lg border-slate-800 bg-slate-900">
          <h1 className="mb-2 text-2xl font-bold text-slate-100">
            Room not found
          </h1>
          <p className="mb-6 text-slate-400">
            Check the room code and try again.
          </p>
          <Link
            href="/planning-poker"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Back to Planning Poker
          </Link>
        </div>
      </main>
    );
  }

  if (session === undefined || players === undefined || isPlayerLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-100">
              Room: {roomCode}
            </h1>
            <p className="mt-2 text-slate-400">
              Enter your name to join this session
            </p>
          </div>
          <JoinForm
            onSubmit={handleJoin}
            initialName={currentUser?.name ?? ""}
            buttonText="Join Room"
            isLoading={isJoining}
          />
        </div>
      </main>
    );
  }

  const activePlayers = players.filter((candidate) => candidate.isConnected);
  const voteCount = activePlayers.filter((candidate) => candidate.hasVoted).length;

  return (
    <GameLayout
      roomCode={roomCode}
      status={session.status}
      players={activePlayers}
      tableOverlay={<VoteMotionStack count={voteCount} revealed={session.status === "revealed"} />}
    >
      <ConfettiBurst active={shouldCelebrate} />
      <div className="flex flex-col gap-6">
        <SessionControls
          isModerator={isModerator(session.moderatorId)}
          status={session.status}
          onReveal={handleReveal}
          onReset={handleReset}
          onOpenPiP={togglePiP}
        />
        {session.status === "voting" && (
          <VoteCardsPanel selectedValue={selectedVote} onVote={handleVote} />
        )}
        {session.status === "revealed" && votes && (
          <RevealPanel
            votes={votes.map((vote) => ({
              playerId: vote.playerId,
              playerName: vote.playerName,
              value: vote.value,
            }))}
            outliers={outlierIds}
          />
        )}
      </div>
    </GameLayout>
  );
}
