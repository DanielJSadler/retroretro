import { useEffect, useRef, useState } from "react";

interface ConfettiBurstProps {
  active: boolean;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const container = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const host = container.current?.ownerDocument.defaultView ?? window;
    const frame = host.requestAnimationFrame(() => setPieces(
      Array.from({ length: 42 }, (_, id) => ({
        id,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.35,
      }))
    ));

    const timer = host.setTimeout(() => setPieces([]), 2400);
    return () => { host.cancelAnimationFrame(frame); host.clearTimeout(timer); };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={container} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
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
