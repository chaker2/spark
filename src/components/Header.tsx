import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Gamepad2, Folder, Trophy, HelpCircle, Globe, LogIn, UserPlus, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { SparkLogo } from "./SparkLogo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Accueil", icon: Home, href: "#accueil" },
  { label: "Jeux", icon: Gamepad2, href: "#jeux" },
  { label: "Mes jeux", icon: Folder, href: "#mes-jeux" },
  { label: "Classement", icon: Trophy, href: "#classement" },
  { label: "Aide", icon: HelpCircle, href: "#aide" },
];

export function Header() {
  const [active, setActive] = useState("Accueil");
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="mx-auto max-w-7xl rounded-3xl bg-card/80 backdrop-blur-md border border-border shadow-soft px-4 py-3 flex items-center justify-between gap-4">
        <SparkLogo />

        <nav className="hidden lg:flex items-center gap-1 bg-sky-soft rounded-2xl p-1.5">
          {navItems.map(({ label, icon: Icon }) => {
            const isActive = active === label;
            return (
              <button
                key={label}
                onClick={() => setActive(label)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-card text-primary shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-accent transition">
            <Globe className="h-4 w-4 text-primary" /> Français
          </button>
          {user ? (
            <>
              <Link to="/teacher" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition">
                <LayoutDashboard className="h-4 w-4" /> Tableau de bord
              </Link>
              <button onClick={logout} className="flex items-center gap-2 rounded-xl bg-mint-gradient text-secondary-foreground px-4 py-2 text-sm font-bold shadow-soft hover:shadow-float hover:-translate-y-0.5 transition-all">
                <LogOut className="h-4 w-4" /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition">
                <LogIn className="h-4 w-4" /> Se connecter
              </Link>
              <Link to="/login" className="flex items-center gap-2 rounded-xl bg-mint-gradient text-secondary-foreground px-4 py-2 text-sm font-bold shadow-soft hover:shadow-float hover:-translate-y-0.5 transition-all">
                <UserPlus className="h-4 w-4" /> Créer un compte
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden grid place-items-center h-11 w-11 rounded-xl bg-sky-soft text-primary"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden mx-auto max-w-7xl mt-2 rounded-3xl bg-card border border-border shadow-soft p-3 space-y-1 animate-pop-in">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => { setActive(label); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-sky-soft transition"
            >
              <Icon className="h-4 w-4 text-primary" /> {label}
            </button>
          ))}
          <div className="pt-2 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <Link to="/teacher" className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-center">Tableau de bord</Link>
                <button onClick={logout} className="rounded-xl bg-mint-gradient px-3 py-2 text-sm font-bold">Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-center">Se connecter</Link>
                <Link to="/login" className="rounded-xl bg-mint-gradient px-3 py-2 text-sm font-bold text-center">Créer un compte</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
