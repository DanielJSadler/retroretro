"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
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
import { AutoRevealCountdown } from "../components/organisms/AutoRevealCountdown";
import { JoinForm } from "../components/molecules/JoinForm";
import { Spinner } from "../components/atoms/Spinner";
import { ConfettiBurst } from "../components/atoms/ConfettiBurst";
import { calculateOutliers } from "../lib/constants";
import {
  getNumericScale,
  getRoomDeck,
  numericVote,
  validateCustomCards,
  validateDeckName,
  voteLabel,
} from "../lib/decks";
import { DeckPicker, type DeckChoice } from "../components/organisms/DeckPicker";
import { Button } from "../components/atoms/Button";

export default function PlanningPokerRoom() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode.toUpperCase();
  const { player, savePlayer, isModerator, isLoading: isPlayerLoading } = usePlayer();
  const {
    submitVote,
    revealVotes,
    resetRound,
    joinSession,
    updatePlayerStatus,
    changeDeck,
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
  const deck = getRoomDeck(session);
  const normalizedVotes = useMemo(
    () => votes?.map((vote) => ({ ...vote, value: voteLabel(vote.value) })) ?? null,
    [votes],
  );

  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const [deckChoice, setDeckChoice] = useState<DeckChoice>({ kind: "preset", presetId: "fibonacci" });
  const [isChangingDeck, setIsChangingDeck] = useState(false);
  const [isPiPEnabled, setIsPiPEnabled] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);
  const [pipWindow, setPiPWindow] = useState<Window | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const openPiPRef = useRef<() => Promise<void>>(async () => {});

  const currentPlayer = useMemo(() => {
    if (!player || !players) return null;
    return players.find((candidate) => candidate._id === player.playerId) ?? null;
  }, [player, players]);

  const handleVote = useCallback(
    async (value: string) => {
      if (!session || !player || !currentPlayer) return;
      setActionError(null);
      setShowDeckPicker(false);
      setSelectedVote(selectedVote === value ? null : value);
      try {
        await submitVote({
          sessionId: session._id,
          playerId: player.playerId as never,
          value,
        });
      } catch {
        setSelectedVote(currentVote ? voteLabel(currentVote.value) : null);
        setActionError("Could not submit your vote. Please try again.");
        addToast("Could not submit your vote. Please try again.");
      }
    },
    [addToast, currentPlayer, currentVote, player, selectedVote, session, submitVote],
  );

  const handleReveal = useCallback(async () => {
    if (!session) return;
    setActionError(null);
    try {
      await revealVotes({ sessionId: session._id });
    } catch {
      setActionError("Could not reveal votes. Please try again.");
      addToast("Could not reveal votes. Please try again.");
    }
  }, [addToast, revealVotes, session]);

  const handleReset = useCallback(async () => {
    if (!session) return;
    setActionError(null);
    setSelectedVote(null);
    try {
      await resetRound({ sessionId: session._id });
    } catch {
      setActionError("Could not reset the round. Please try again.");
      addToast("Could not reset the round. Please try again.");
    }
  }, [addToast, resetRound, session]);

  const handleChangeDeck = async () => {
    if (!session || !player) return;
    setActionError(null);
    try {
      if (deckChoice.kind === "custom") {
        validateCustomCards(deckChoice.cards);
        if (currentUser) validateDeckName(deckChoice.name);
      }
      setIsChangingDeck(true);
      await changeDeck({
        sessionId: session._id,
        playerId: player.playerId as never,
        deckSelection: deckChoice,
      });
      setSelectedVote(null);
      setShowDeckPicker(false);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not change the deck.";
      setActionError(message);
      addToast(message);
    } finally {
      setIsChangingDeck(false);
    }
  };

  const syncPiPStyles = (pipWindow: Window) => {
    pipWindow.document.head.innerHTML = "";
    document.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
      pipWindow.document.head.appendChild(node.cloneNode(true));
    });
  };

  const handleOpenPiP = async () => {
    const pictureInPicture = (window as Window & { documentPictureInPicture?: { requestWindow: (options: { width: number; height: number }) => Promise<Window> } })
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
      setPiPWindow(pipWindow);
      pipWindow.addEventListener("pagehide", () => {
        if (pipWindowRef.current === pipWindow) {
          pipWindowRef.current = null;
          setPiPWindow(null);
        }
      }, { once: true });
    } catch {
      // Picture-in-Picture can be unsupported or blocked by the browser.
    }
  };
  useEffect(() => { openPiPRef.current = handleOpenPiP; });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pipWindowRef.current?.close();
        pipWindowRef.current = null;
        setPiPWindow(null);
      } else if (isPiPEnabled) {
        void openPiPRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPiPEnabled]);

  useEffect(() => {
    return () => {
      pipWindowRef.current?.close();
      pipWindowRef.current = null;
    };
  }, []);

  const togglePiP = async () => {
    const nextEnabled = !isPiPEnabled;
    setIsPiPEnabled(nextEnabled);
    if (nextEnabled) {
      await handleOpenPiP();
    } else {
      pipWindowRef.current?.close();
      pipWindowRef.current = null;
      setPiPWindow(null);
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
    const frame = requestAnimationFrame(() => {
    if (currentVote?.value !== undefined) {
      setSelectedVote(voteLabel(currentVote.value));
    } else if (session?.status === "voting") {
      setSelectedVote(null);
    }
    });
    return () => cancelAnimationFrame(frame);
  }, [currentVote, session?.status]);

  const outlierIds = useMemo(() => {
    if (!normalizedVotes) return new Set<string>();
    const scale = getNumericScale(deck);
    if (!scale) return new Set<string>();
    const outlierIndices = calculateOutliers(
      normalizedVotes.map((vote) => numericVote(vote.value, scale)),
    );
    const ids = new Set<string>();
    normalizedVotes.forEach((vote, index) => {
      if (outlierIndices.has(index)) ids.add(vote.playerId);
    });
    return ids;
  }, [deck, normalizedVotes]);

  const shouldCelebrate = useMemo(() => {
    if (session?.status !== "revealed" || !normalizedVotes || normalizedVotes.length === 0) return false;
    const scoredVotes = normalizedVotes
      .map((vote) => vote.value)
      .filter((value) => value !== "?");
    return scoredVotes.length > 0 && scoredVotes.every((value) => value === scoredVotes[0]);
  }, [session?.status, normalizedVotes]);

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
  const canChangeDeck = session.status === "revealed" || !players.some((candidate) => candidate.hasVoted);

  const toggleDeckPicker = () => {
    setDeckChoice({ kind: "preset", presetId: "fibonacci" });
    setShowDeckPicker((show) => !show);
  };
  const deckPicker = (showDeckPicker && canChangeDeck && isModerator(session.moderatorId) && (
          <div className="min-w-0 max-w-lg space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-3 sm:p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Change card deck</h2>
              <p className="text-sm text-slate-400">Current: {deck.name}. Changing after reveal starts a new round.</p>
            </div>
            <DeckPicker value={deckChoice} onChange={setDeckChoice} isSignedIn={!!currentUser} />
            <div className="flex flex-wrap gap-2 p-1">
              <Button type="button" onClick={() => void handleChangeDeck()} isLoading={isChangingDeck}>Use this deck</Button>
              <Button type="button" variant="secondary" onClick={() => setShowDeckPicker(false)}>Cancel</Button>
            </div>
          </div>
        ));

  return (
    <GameLayout
      roomCode={roomCode}
      deckName={deck.name}
      status={session.status}
      players={activePlayers}
      tableOverlay={<VoteMotionStack count={voteCount} revealed={session.status === "revealed"} />}
    >
      {pipWindow && createPortal(
        <PiPView
          roomCode={roomCode}
          round={session.round}
          deck={deck}
          status={session.status}
          selectedVote={selectedVote}
          players={players}
          currentPlayerId={player?.playerId}
          votes={normalizedVotes}
          outliers={outlierIds}
          isModerator={isModerator(session.moderatorId)}
          onVote={handleVote}
          onReveal={handleReveal}
          onReset={handleReset}
          onChangeDeck={toggleDeckPicker}
          canChangeDeck={canChangeDeck}
          deckPicker={deckPicker}
          error={actionError}
          autoRevealAt={session.autoRevealAt}
          celebrate={shouldCelebrate}
        />,
        pipWindow.document.body,
      )}
      <ConfettiBurst key={session.round} active={shouldCelebrate} />
      <div className="flex flex-col gap-6">
        <AutoRevealCountdown deadline={session.status === 'voting' ? session.autoRevealAt : undefined} />
        <SessionControls
          isModerator={isModerator(session.moderatorId)}
          status={session.status}
          onReveal={handleReveal}
          onReset={handleReset}
          onOpenPiP={togglePiP}
          onChangeDeck={toggleDeckPicker}
          canChangeDeck={canChangeDeck}
        />
        {deckPicker}
        {session.status === "voting" && (
          <VoteCardsPanel cards={deck.cards} selectedValue={selectedVote} onVote={handleVote} />
        )}
        {session.status === "revealed" && normalizedVotes && (
          <RevealPanel
            deck={deck}
            votes={normalizedVotes.map((vote) => ({
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
