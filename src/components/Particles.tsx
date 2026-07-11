import { useMemo } from "react";
import { Sparkles, Star, BookOpen, Trophy, Zap, HelpCircle, Brain, Lightbulb } from "lucide-react";

const ICONS = [Sparkles, Star, BookOpen, Trophy, Zap, HelpCircle, Brain, Lightbulb];
const COLORS = [
  "text-primary",
  "text-mint",
  "text-[oklch(0.85_0.18_85)]",
  "text-[oklch(0.74_0.18_25)]",
  "text-[oklch(0.7_0.18_300)]",
];

// Seeded pseudo-random so SSR & client match. Values are formatted to fixed
// precision because React's hydration check compares stringified style values
// — floats like 88.5532884480 would mismatch SSR's truncated output.
function rand(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}
const fx = (n: number) => n.toFixed(2);

export function Particles({ count = 18 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const Icon = ICONS[i % ICONS.length];
        const color = COLORS[i % COLORS.length];
        const top = fx(rand(i + 1) * 95);
        const left = fx(rand(i + 7) * 95);
        const size = 14 + Math.floor(rand(i + 13) * 18);
        const delay = fx(rand(i + 21) * 4);
        const duration = fx(5 + rand(i + 33) * 5);
        const opacity = fx(0.3 + rand(i + 41) * 0.4);
        return { Icon, color, top, left, size, delay, duration, opacity, i };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" suppressHydrationWarning>
      {items.map(({ Icon, color, top, left, size, delay, duration, opacity, i }) => (
        <div
          key={i}
          className={`absolute animate-float ${color}`}
          suppressHydrationWarning
          style={{
            top: `${top}%`,
            left: `${left}%`,
            opacity,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }}
        >
          <Icon style={{ width: size, height: size }} className="drop-shadow-md" />
        </div>
      ))}
    </div>
  );
}
