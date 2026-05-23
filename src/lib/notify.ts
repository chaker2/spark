import { toast } from "sonner";
import i18n from "@/i18n";

export type NotifyKey =
  | "auth.invalid_password" | "auth.account_not_found" | "auth.email_taken"
  | "auth.name_taken" | "auth.session_expired" | "auth.access_denied"
  | "auth.profile_updated" | "auth.signed_in" | "auth.signed_out"
  | "room.not_found" | "room.invalid_code" | "room.unavailable"
  | "room.removed" | "room.starting" | "room.waiting_teacher"
  | "answer.submitted" | "answer.correct" | "answer.wrong"
  | "net.lost" | "net.reconnecting" | "net.slow"
  | "upload.failed" | "load.failed";

const t = (k: NotifyKey) => i18n.t(`notify.${k}`, { defaultValue: k });

export const notify = {
  success: (k: NotifyKey, opts?: { description?: string }) => toast.success(t(k), opts),
  error: (k: NotifyKey, opts?: { description?: string }) => toast.error(t(k), opts),
  info: (k: NotifyKey, opts?: { description?: string }) => toast(t(k), opts),
  warning: (k: NotifyKey, opts?: { description?: string }) => toast.warning(t(k), opts),
  raw: (msg: string, type: "success" | "error" | "info" = "info") =>
    type === "success" ? toast.success(msg) : type === "error" ? toast.error(msg) : toast(msg),
};

// Network listeners (call once at app root)
let installed = false;
export function installNetworkListeners() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("offline", () => notify.error("net.lost"));
  window.addEventListener("online", () => notify.success("net.reconnecting"));
}
