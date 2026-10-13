import { useEffect, useState } from "react";

interface ConfettiBurstProps {
  active: boolean;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    setPieces(
      Array.from({ length: 42 }, (_, id) => ({
        id,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.35,
      }))
    );

    const timer = window.setTimeout(() => setPieces([]), 2400);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
