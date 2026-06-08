import arabicAsset from "@/assets/arabic-language.png.asset.json";
import englishAsset from "@/assets/english-language.png.asset.json";
import socialAsset from "@/assets/social-studies.png.asset.json";
import frenchAsset from "@/assets/french-language.png.asset.json";
import mathAsset from "@/assets/mathematics.png.asset.json";
import physicsAsset from "@/assets/physics.png.asset.json";
import scienceAsset from "@/assets/science.png.asset.json";
import islamicAsset from "@/assets/islamic-education.png.asset.json";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";

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

const BACKGROUNDS: Record<CategoryKey, string> = {
  arabic: arabicAsset.url,
  english: englishAsset.url,
  social: socialAsset.url,
  french: frenchAsset.url,
  math: mathAsset.url,
  physics: physicsAsset.url,
  science: scienceAsset.url,
  islamic: islamicAsset.url,
};

const CATEGORY_ALIASES: Record<string, CategoryKey> = {
  arabic: "arabic",
  "arabic language": "arabic",
  "langue arabe": "arabic",
  العربية: "arabic",
  english: "english",
  "english language": "english",
  "langue anglaise": "english",
  social: "social",
  "social studies": "social",
  "études sociales": "social",
  "etudes sociales": "social",
  french: "french",
  "french language": "french",
  "langue française": "french",
  "langue francaise": "french",
  math: "math",
  maths: "math",
  mathematics: "math",
  mathématiques: "math",
  mathematiques: "math",
  physics: "physics",
  physique: "physics",
  science: "science",
  sciences: "science",
  islamic: "islamic",
  "islamic education": "islamic",
  "éducation islamique": "islamic",
  "education islamique": "islamic",
};

export function getCategoryBackground(category?: string | null) {
  const raw = (category ?? "").trim().toLowerCase();
  const key = (CATEGORY_KEYS as readonly string[]).includes(raw) ? (raw as CategoryKey) : CATEGORY_ALIASES[raw] ?? "english";
  return { key, text: PATTERNS[key], imageUrl: BACKGROUNDS[key] };
}

export function CategoryBackground({ category, className = "" }: { category?: string | null; className?: string }) {
  const { key, text, imageUrl } = getCategoryBackground(category);

  return (
    <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`} aria-hidden data-category-background={key}>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-background/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/60" />
      <div
        className="absolute inset-0 opacity-[0.08] select-none whitespace-pre-wrap break-all leading-[2.5] text-[28px] sm:text-[36px] font-display text-primary"
        style={{ wordSpacing: "1rem" }}
      >
        {(text + " ").repeat(80)}
      </div>
    </div>
  );
}
