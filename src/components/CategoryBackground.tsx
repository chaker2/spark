import arabicAsset from "@/assets/arabic-language.png.asset.json";
import arabicOutpaintAsset from "@/assets/arabic-language-outpaint.png.asset.json";
import englishAsset from "@/assets/english-language.png.asset.json";
import englishOutpaintAsset from "@/assets/english-language-outpaint.png.asset.json";
import socialAsset from "@/assets/social-studies.png.asset.json";
import socialOutpaintAsset from "@/assets/social-studies-outpaint.png.asset.json";
import frenchAsset from "@/assets/french-language.png.asset.json";
import frenchOutpaintAsset from "@/assets/french-language-outpaint.png.asset.json";
import mathAsset from "@/assets/mathematics.png.asset.json";
import mathOutpaintAsset from "@/assets/mathematics-outpaint.png.asset.json";
import physicsAsset from "@/assets/physics.png.asset.json";
import physicsOutpaintAsset from "@/assets/physics-outpaint.png.asset.json";
import scienceAsset from "@/assets/science.png.asset.json";
import scienceOutpaintAsset from "@/assets/science-outpaint.png.asset.json";
import islamicAsset from "@/assets/islamic-education.png.asset.json";
import islamicOutpaintAsset from "@/assets/islamic-education-outpaint.png.asset.json";
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

const OUTPAINTED_BACKGROUNDS: Record<CategoryKey, string> = {
  arabic: arabicOutpaintAsset.url,
  english: englishOutpaintAsset.url,
  social: socialOutpaintAsset.url,
  french: frenchOutpaintAsset.url,
  math: mathOutpaintAsset.url,
  physics: physicsOutpaintAsset.url,
  science: scienceOutpaintAsset.url,
  islamic: islamicOutpaintAsset.url,
};

const EDGE_TONES: Record<CategoryKey, { left: string; right: string; base: string }> = {
  arabic: { left: "#dff2fa", right: "#dff2fa", base: "#eaf7fb" },
  english: { left: "#fbf3ee", right: "#faf2ed", base: "#fbf6f2" },
  social: { left: "#f6efe7", right: "#f2eadf", base: "#f7f0e8" },
  french: { left: "#f5f4fb", right: "#f4f5fb", base: "#f8f7fc" },
  math: { left: "#fbf3db", right: "#faf0dc", base: "#fbf6e8" },
  physics: { left: "#e8f5f8", right: "#eef5fb", base: "#f0f8fb" },
  science: { left: "#f8f7f4", right: "#f6f6f4", base: "#fbfaf8" },
  islamic: { left: "#fbf2f1", right: "#f7f0f7", base: "#fbf6f4" },
};

const BACKGROUND_ASPECTS: Record<CategoryKey, number> = {
  arabic: 1536 / 1024,
  english: 1459 / 972,
  social: 1459 / 972,
  french: 1459 / 972,
  math: 1459 / 972,
  physics: 1459 / 972,
  science: 1459 / 972,
  islamic: 1459 / 972,
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
  return { key, imageUrl: BACKGROUNDS[key], outpaintUrl: OUTPAINTED_BACKGROUNDS[key] };
}

export function CategoryBackground({ category, className = "" }: { category?: string | null; className?: string }) {
  const { key, imageUrl, outpaintUrl } = getCategoryBackground(category);
  const edgeTone = EDGE_TONES[key];
  const style = {
    "--category-background-image": `url(${imageUrl})`,
    "--category-outpaint-image": `url(${outpaintUrl})`,
    "--category-background-aspect": BACKGROUND_ASPECTS[key],
    "--category-edge-left": edgeTone.left,
    "--category-edge-right": edgeTone.right,
    "--category-edge-base": edgeTone.base,
  } as CSSProperties;

  return (
    <div
      className={`category-background pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background ${className}`}
      style={style}
      aria-hidden
      data-category-background={key}
      data-background-url={imageUrl}
      data-outpaint-url={outpaintUrl}
    >
      <div className="category-background__edge category-background__edge--left" />
      <div className="category-background__edge category-background__edge--right" />
      <img
        src={imageUrl}
        alt=""
        className="category-background__artwork"
        draggable={false}
      />
    </div>
  );
}
