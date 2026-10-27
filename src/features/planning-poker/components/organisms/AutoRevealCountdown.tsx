import { useEffect, useState } from 'react';

export function AutoRevealCountdown({ deadline }: { deadline?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === undefined) return;
    const frame = requestAnimationFrame(() => setNow(Date.now()));
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => { cancelAnimationFrame(frame); clearInterval(interval); };
  }, [deadline]);

  if (deadline === undefined) return null;
  const seconds = Math.min(3, Math.max(0, Math.ceil((deadline - now) / 1000)));
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="rounded-xl border border-indigo-500/50 bg-indigo-950/60 px-3 py-2 text-center text-sm font-semibold text-indigo-100">
      {seconds > 0 ? `Everyone has voted. Revealing in ${seconds}…` : 'Revealing votes…'}
      <p className="mt-1 text-xs font-normal text-indigo-200">Clear your vote to pause the countdown.</p>
    </div>
  );
}
