import { useState } from "react";
import { ArrowRight, KeyRound, Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function JoinGame() {
  const [code, setCode] = useState("");
  const valid = /^\d{5}$/.test(code);
  const navigate = useNavigate();

  return (
    <section className="px-4 -mt-4 relative z-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-card border border-border shadow-float p-6 sm:p-10 text-center animate-pop-in">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-gradient grid place-items-center shadow-pop">
          <KeyRound className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-foreground">
          Entrez le code de la partie donné par votre enseignant
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tapez le code à 5 chiffres pour rejoindre la salle en direct.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            navigate({ to: "/play/$code", params: { code } });
          }}
          className="mt-6 flex flex-col sm:flex-row gap-3"
        >
          <input
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="Entrez le code ici"
            className="flex-1 h-14 rounded-2xl border-2 border-border bg-background px-5 text-lg font-display font-semibold tracking-[0.4em] text-center placeholder:tracking-normal placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
          />
          <button
            type="submit"
            disabled={!valid}
            className="h-14 px-7 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold text-lg shadow-pop hover:shadow-float hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            Rejoindre la partie
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-primary" /> Code unique à 5 chiffres
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span>Valide uniquement pour une partie en cours</span>
        </div>
      </div>
    </section>
  );
}
