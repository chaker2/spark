// Cute colorful avatars (emoji-based, zero asset deps, works on every device).
export const AVATARS = [
  "🦊", "🐼", "🐯", "🐵", "🦁", "🐸", "🐙", "🦄",
  "🐧", "🐨", "🐰", "🐺", "🐲", "🦉", "🦋", "🐳",
] as const;

export type Avatar = (typeof AVATARS)[number];

export const DEFAULT_AVATAR: Avatar = "🦊";
