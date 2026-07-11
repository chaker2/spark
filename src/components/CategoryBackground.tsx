import arabicAsset from "@/assets/arabic-language.png.asset.json";
import englishAsset from "@/assets/english-language.png.asset.json";
import socialAsset from "@/assets/social-studies.png.asset.json";
import frenchAsset from "@/assets/french-language.png.asset.json";
import mathAsset from "@/assets/mathematics.png.asset.json";
import physicsAsset from "@/assets/physics.png.asset.json";
import scienceAsset from "@/assets/science.png.asset.json";
import islamicAsset from "@/assets/islamic-education.png.asset.json";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";
import type { CSSProperties } from "react";

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
  const style = { "--category-background-image": `url(${imageUrl})` } as CSSProperties;

  return (
    <div
      className={`category-background pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background ${className}`}
      style={style}
      aria-hidden
      data-category-background={key}
      data-background-url={imageUrl}
    >
      <div className="category-background__base" />
      <div className="category-background__edge category-background__edge--left" />
      <div className="category-background__edge category-background__edge--right" />
      <div className="category-background__edge category-background__edge--top" />
      <div className="category-background__edge category-background__edge--bottom" />
      <img
        src={imageUrl}
        alt=""
        className="category-background__artwork"
        draggable={false}
      />
    </div>
  );
}
