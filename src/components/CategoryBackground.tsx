import arabicAsset from "@/assets/arabic-language.png.asset.json";
import englishAsset from "@/assets/english-language.png.asset.json";
import socialAsset from "@/assets/social-studies.png.asset.json";
import frenchAsset from "@/assets/french-language.png.asset.json";
import mathAsset from "@/assets/mathematics.png.asset.json";
import physicsAsset from "@/assets/physics.png.asset.json";
import scienceAsset from "@/assets/science.png.asset.json";
import islamicAsset from "@/assets/islamic-education.png.asset.json";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";

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
  return { key, imageUrl: BACKGROUNDS[key] };
}

export function CategoryBackground({ category, className = "" }: { category?: string | null; className?: string }) {
  const { key, imageUrl } = getCategoryBackground(category);

  return (
    <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background ${className}`} aria-hidden data-category-background={key} data-background-url={imageUrl}>
      {/* Blurred fill so side/letterbox padding matches the artwork instead of cropping it */}
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
        draggable={false}
        aria-hidden
      />
      {/* Full original artwork, never cropped or distorted */}
      <img
        src={imageUrl}
        alt=""
        className="relative h-full w-full object-contain object-center"
        draggable={false}
      />
    </div>
  );
}
