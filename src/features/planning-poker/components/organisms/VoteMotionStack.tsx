import { VoteCard } from "../molecules/VoteCard";

interface VoteMotionStackProps {
  count: number;
  revealed: boolean;
}

export function VoteMotionStack({ count, revealed }: VoteMotionStackProps) {
  const cards = Array.from({ length: count }, (_, index) => index);

  return (
    <div className="pointer-events-none relative h-[260px] w-[240px] overflow-visible">
      {count === 0 ? (
        <div className="absolute left-0 top-0 flex h-36 w-28 items-center justify-center rounded-2xl border border-white/15 bg-black/10 text-white/20 shadow-xl">
          <div className="h-4 w-4 rounded-full border-2 border-dashed border-white/35" />
        </div>
      ) : null}
      {cards.map((index) => (
        <div
          key={index}
          className="absolute left-0 top-0 transition-all duration-700 ease-out"
          style={{
            transform: revealed
              ? `translate(${120 + index * 12}px, ${196 + index * 10}px) rotate(${index * 3}deg) scale(0.92)`
              : `translate(${index * 3}px, ${index * 3}px)`,
            opacity: revealed ? 0 : 1,
            zIndex: index + 1,
            transitionDelay: `${Math.min(index * 45, 180)}ms`,
          }}
        >
          <VoteCard value={null} isSelected={false} onClick={() => {}} disabled />
        </div>
      ))}
    </div>
  );
}
