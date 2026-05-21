// Canonical category keys used as DB values for quizzes.category.
// Display labels are translated via i18n (categories.<key>).
export const CATEGORY_KEYS = [
  "arabic",
  "english",
  "social",
  "french",
  "math",
  "physics",
  "science",
  "islamic",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  arabic: "from-emerald-400 to-teal-500",
  english: "from-blue-400 to-indigo-500",
  social: "from-amber-400 to-orange-500",
  french: "from-rose-400 to-pink-500",
  math: "from-violet-400 to-purple-500",
  physics: "from-cyan-400 to-sky-500",
  science: "from-lime-400 to-green-500",
  islamic: "from-yellow-400 to-amber-500",
};
