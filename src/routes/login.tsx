import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SparkLogo } from "@/components/SparkLogo";
import { PasswordInput } from "@/components/PasswordInput";
import { ArrowLeft, Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Connexion enseignant — SPARK" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/teacher" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/teacher` },
        });
        if (error) throw error;
        toast.success("Compte créé !");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/teacher" });
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-gradient px-4 py-8 flex flex-col">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <SparkLogo />
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </div>

      <div className="flex-1 grid place-items-center py-10">
        <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-float p-8 animate-pop-in">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-gradient grid place-items-center shadow-pop">
            {mode === "signin" ? <LogIn className="h-6 w-6 text-primary-foreground" /> : <UserPlus className="h-6 w-6 text-primary-foreground" />}
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-center">
            {mode === "signin" ? "Connexion enseignant" : "Créer un compte enseignant"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Créez et animez vos parties en direct.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ecole.fr"
              className="w-full h-12 rounded-2xl border-2 border-border bg-background px-4 font-semibold focus:outline-none focus:border-primary transition"
            />
            <PasswordInput
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe (min. 6 caractères)"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold shadow-pop hover:shadow-float hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-sm text-primary font-semibold hover:underline"
          >
            {mode === "signin" ? "Pas encore de compte ? Créer un compte" : "Déjà inscrit ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
