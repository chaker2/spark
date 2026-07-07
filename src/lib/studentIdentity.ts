import { getClientId } from "@/hooks/useAuth";

/**
 * Permanent, device-local student identity.
 *
 * The first time a student picks a display name it is saved permanently in
 * localStorage together with a unique, securely generated credential derived
 * from their name plus random characters. On every future room join the stored
 * name is reused automatically so the student never has to type it again.
 *
 * The credential is stable for the lifetime of the identity (it never changes
 * once created) and is guaranteed unique because it embeds the device's random
 * client id and fresh cryptographic randomness.
 */

const STORAGE_KEY = "spark_student_identity";

export type StudentIdentity = {
  name: string;
  credential: string;
  clientId: string;
  createdAt: string;
};

function randomHex(bytes: number): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(16).slice(2).padEnd(bytes * 2, "0").slice(0, bytes * 2);
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 16) || "student"
  );
}

/** Build a unique, secure credential from the student's name + random chars. */
function generateCredential(name: string, clientId: string): string {
  return `${slugify(name)}-${clientId.slice(0, 8)}-${randomHex(12)}`;
}

export function getStudentIdentity(): StudentIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudentIdentity>;
    if (!parsed?.name || !parsed?.credential) return null;
    return {
      name: parsed.name,
      credential: parsed.credential,
      clientId: parsed.clientId ?? getClientId(),
      createdAt: parsed.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function getStudentName(): string {
  return getStudentIdentity()?.name ?? "";
}

/**
 * Save the student's display name permanently. Creates the secure credential
 * the first time; keeps the existing credential on later name edits so the
 * underlying identity never changes.
 */
export function saveStudentName(name: string): StudentIdentity {
  const trimmed = name.trim();
  const clientId = getClientId();
  const existing = getStudentIdentity();
  const identity: StudentIdentity = {
    name: trimmed,
    credential: existing?.credential ?? generateCredential(trimmed, clientId),
    clientId: existing?.clientId ?? clientId,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  }
  return identity;
}
