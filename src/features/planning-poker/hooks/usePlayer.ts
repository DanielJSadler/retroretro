"use client";

import { useState, useEffect, useCallback } from "react";

interface PlayerIdentity {
  playerId: string;
  name: string;
  sessionId: string;
}

const STORAGE_KEY = "planning-poker-player";

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const identity = JSON.parse(raw) as Partial<PlayerIdentity>;
        if (
          typeof identity.playerId === "string" &&
          typeof identity.name === "string" &&
          typeof identity.sessionId === "string"
        ) {
          setPlayer(identity as PlayerIdentity);
        }
      }
    } catch {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage can be disabled by the browser.
      }
    } finally {
      setIsLoading(false);
    }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const savePlayer = useCallback((identity: PlayerIdentity) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    setPlayer(identity);
  }, []);

  const clearPlayer = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPlayer(null);
  }, []);

  const isModerator = useCallback(
    (moderatorId: string) => {
      return player?.playerId === moderatorId;
    },
    [player]
  );

  return { player, savePlayer, clearPlayer, isModerator, isLoading };
}
