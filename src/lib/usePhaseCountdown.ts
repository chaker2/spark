import { useEffect, useRef, useState } from "react";

/**
 * Clock-skew-immune phase countdown.
 *
 * The server stores phase_started_at and phase_ends_at (both server clock).
 * Their difference is the intended phase duration and is NOT affected by any
 * offset between the client clock and the server clock. We anchor that
 * duration to the moment this client first observes the phase, then count
 * down locally. This guarantees e.g. a 5s intro is shown for ~5s on every
 * device regardless of clock drift.
 */
export function usePhaseCountdown(
  phase: string | null | undefined,
  phaseStartedAt: string | null | undefined,
  phaseEndsAt: string | null | undefined,
) {
  const key = `${phase ?? "idle"}|${phaseStartedAt ?? ""}`;
  const anchorRef = useRef<{ key: string; localStart: number; durationMs: number }>({
    key: "",
    localStart: 0,
    durationMs: 0,
  });
  const [, force] = useState(0);

  if (anchorRef.current.key !== key) {
    const started = phaseStartedAt ? new Date(phaseStartedAt).getTime() : 0;
    const ends = phaseEndsAt ? new Date(phaseEndsAt).getTime() : 0;
    const durationMs = started && ends && ends > started ? ends - started : 0;
    anchorRef.current = { key, localStart: Date.now(), durationMs };
  }

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  const { localStart, durationMs } = anchorRef.current;
  if (!durationMs) return 0;
  return Math.max(0, Math.ceil((durationMs - (Date.now() - localStart)) / 1000));
}
