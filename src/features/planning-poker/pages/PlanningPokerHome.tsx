"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { DoorOpen, Sparkles } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { usePlayer } from "../hooks/usePlayer";
import { useVoting } from "../hooks/useVoting";
import { useToast } from "../components/atoms/Toast";
import { JoinForm } from "../components/molecules/JoinForm";
import { Button } from "../components/atoms/Button";
import { Input } from "../components/atoms/Input";
import { Card } from "../components/atoms/Card";
import { DeckPicker, type DeckChoice } from "../components/organisms/DeckPicker";
import { validateCustomCards, validateDeckName } from "../lib/decks";

type Mode = "landing" | "create" | "join";

export default function PlanningPokerHome() {
  const router = useRouter();
  const { savePlayer } = usePlayer();
  const { createSession, joinSession } = useVoting();
  const { addToast } = useToast();
  const currentUser = useQuery(api.users.current);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [mode, setMode] = useState<Mode>("landing");
  const [deckChoice, setDeckChoice] = useState<DeckChoice>({ kind: "preset", presetId: "fibonacci" });

  const handleCreate = async (name: string) => {
    setIsCreating(true);
    try {
      if (deckChoice.kind === "custom") {
        validateCustomCards(deckChoice.cards);
        if (currentUser) validateDeckName(deckChoice.name);
      }
      const result = await createSession({ playerName: name, deckSelection: deckChoice });
      savePlayer({
        playerId: result.playerId,
        name,
        sessionId: result.sessionId,
      });
      router.push(`/planning-poker/room/${result.roomCode}`);
    } catch (cause) {
      addToast(cause instanceof Error ? cause.message : "Could not create a session. Please try again.");
      setIsCreating(false);
    }
  };

  const handleJoin = async (name: string) => {
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      setJoinError("Please enter a room code");
      return;
    }

    setIsJoining(true);
    setJoinError("");
    try {
      const result = await joinSession({ roomCode: code, playerName: name });
      savePlayer({ playerId: result.playerId, name, sessionId: result.sessionId });
      router.push(`/planning-poker/room/${code}`);
    } catch {
      setJoinError("Room not found. Please check the code and try again.");
      setIsJoining(false);
    }
  };

  const backButton = (
    <button
      type="button"
      onClick={() => setMode("landing")}
      className="mb-4 text-sm text-slate-400 hover:text-slate-200"
    >
      ← Back
    </button>
  );

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {mode === "landing" && (
          <Card className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-900/30 text-indigo-400">
                <Sparkles size={32} />
              </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-slate-100">
              Planning Poker
            </h1>
            <p className="mb-8 text-slate-400">
              Estimate tasks with your team. Create a session or join one.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setMode("create")} size="lg">
                <Sparkles size={20} className="mr-2" />
                Create Session
              </Button>
              <Button
                variant="secondary"
                onClick={() => setMode("join")}
                size="lg"
              >
                <DoorOpen size={20} className="mr-2" />
                Join Session
              </Button>
            </div>
          </Card>
        )}

        {mode === "create" && (
          <Card className="p-8">
            {backButton}
            <h2 className="mb-6 text-xl font-bold text-slate-100">
              Create a Session
            </h2>
            <JoinForm
              onSubmit={handleCreate}
              initialName={currentUser?.name ?? ""}
              buttonText="Create Session"
              isLoading={isCreating}
            >
              <DeckPicker value={deckChoice} onChange={setDeckChoice} isSignedIn={!!currentUser} />
            </JoinForm>
          </Card>
        )}

        {mode === "join" && (
          <Card className="p-8">
            {backButton}
            <h2 className="mb-6 text-xl font-bold text-slate-100">
              Join a Session
            </h2>
            <div className="mb-4">
              <Input
                label="Room Code"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(event) => {
                  setRoomCode(event.target.value);
                  if (joinError) setJoinError("");
                }}
                error={joinError}
              />
            </div>
            <JoinForm
              onSubmit={handleJoin}
              initialName={currentUser?.name ?? ""}
              buttonText="Join Session"
              isLoading={isJoining}
            />
          </Card>
        )}
      </div>
    </main>
  );
}
