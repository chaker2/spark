import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, GraduationCap, BookOpen, ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const FORMSPREE_URL = "https://formspree.io/f/mpqnqwad";

type Role = "student" | "teacher" | null;

export function SignupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setRole(null); setName(""); setEmail(""); setPassword(""); setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return toast.error(t("signup.errorEmpty"));
    if (!validEmail) return toast.error(t("signup.errorEmail"));
    if (role === "teacher") {
      if (!password) return toast.error(t("signup.errorEmpty"));
      if (password.length < 6) return toast.error(t("signup.errorPassword"));
    }

    setBusy(true);
    try {
      if (role === "student") {
        // Students never get an account — they join games anonymously with a username.
        // Never transmit a password to any third party.
        const res = await fetch(FORMSPREE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            role: "Student",
            fullName: name,
            email,
            registeredAt: new Date().toISOString(),
            language: i18n.language,
          }),
        });
        if (!res.ok) throw new Error("Formspree error");
        toast.success(t("signup.success"));
        onClose();
      } else if (role === "teacher") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/teacher`, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success(t("signup.success"));
        onClose();
        navigate({ to: "/teacher" });
      }
    } catch (err: any) {
      toast.error(err?.message || t("signup.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-card border border-border shadow-float p-6 sm:p-8 animate-pop-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 h-9 w-9 rounded-full grid place-items-center hover:bg-accent transition">
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-gradient grid place-items-center shadow-pop">
          <UserPlus className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold text-center">{t("signup.title")}</h2>

        {!role ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-center text-muted-foreground">{t("signup.chooseRole")}</p>
            <button onClick={() => setRole("student")} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-sky-soft transition text-left">
              <div className="h-12 w-12 rounded-xl bg-mint-gradient grid place-items-center shadow-soft shrink-0">
                <BookOpen className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <div className="font-display font-bold">{t("signup.student")}</div>
                <div className="text-xs text-muted-foreground">{t("signup.studentDesc")}</div>
              </div>
            </button>
            <button onClick={() => setRole("teacher")} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-sky-soft transition text-left">
              <div className="h-12 w-12 rounded-xl bg-primary-gradient grid place-items-center shadow-soft shrink-0">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display font-bold">{t("signup.teacher")}</div>
                <div className="text-xs text-muted-foreground">{t("signup.teacherDesc")}</div>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <button type="button" onClick={() => setRole(null)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="h-3.5 w-3.5" /> {t("signup.back")}
            </button>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t("signup.fullName")}
              className="w-full h-12 rounded-2xl border-2 border-border bg-background px-4 font-semibold focus:outline-none focus:border-primary transition"
            />
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t("signup.email")}
              className="w-full h-12 rounded-2xl border-2 border-border bg-background px-4 font-semibold focus:outline-none focus:border-primary transition"
            />
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={t("signup.password")}
              className="w-full h-12 rounded-2xl border-2 border-border bg-background px-4 font-semibold focus:outline-none focus:border-primary transition"
            />
            <button
              type="submit" disabled={busy}
              className="w-full h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold shadow-pop hover:shadow-float hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("signup.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
