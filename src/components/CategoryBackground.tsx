import type { CategoryKey } from "@/lib/categories";

const PATTERNS: Record<CategoryKey, string> = {
  arabic: "ا ب ج د هـ و ز ح ط ي ك ل م ن س ع ف ص ق ر ش ت ث خ ذ ض ظ غ",
  english: "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z",
  social: "🗺 🌍 🏛 ⚖ 🗽 🕌 🏺 🌐",
  french: "À Â Ç É È Ê Ë Î Ï Ô Œ Ù Û Ü Ÿ « »",
  math: "∑ ∫ √ π ∞ ≈ ≠ ≤ ≥ ± × ÷ θ φ Δ λ μ Ω α β γ",
  physics: "E=mc² F=ma ⚛ ⚡ 🔭 🧲 λ ν ψ Δ ∇ ℏ",
  science: "🧬 🔬 🌱 🧪 ⚗ 🍃 🦠 🧫",
  islamic: "✦ ✧ ☪ ❋ ✺ ✹ ✸",
};

export function CategoryBackground({ category, className = "" }: { category?: string | null; className?: string }) {
  const key = (category as CategoryKey) || "english";
  const text = PATTERNS[key] || PATTERNS.english;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.06] select-none whitespace-pre-wrap break-all leading-[2.5] text-[28px] sm:text-[36px] font-display text-primary"
        style={{ wordSpacing: "1rem" }}
      >
        {(text + " ").repeat(80)}
      </div>
    </div>
  );
}
