import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Home, Gamepad2, Folder, Trophy, HelpCircle, LogIn, UserPlus, Menu, X, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { SparkLogo } from "./SparkLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SignupModal } from "./SignupModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    let cancelled = false;
    supabase.rpc("is_current_user_admin").then(({ data }) => {
      if (!cancelled) setIsAdmin(!!data);
    });
    return () => { cancelled = true; };
  }, [user]);

  const navItems = [
    { key: "home", label: t("nav.home"), icon: Home, to: "/" as const },
    { key: "games", label: t("nav.games"), icon: Gamepad2, to: "/games" as const },
    { key: "mygames", label: t("nav.myGames"), icon: Folder, to: "/my-games" as const },
    { key: "leaderboard", label: t("nav.leaderboard"), icon: Trophy, to: "/ranking" as const },
    { key: "help", label: t("nav.help"), icon: HelpCircle, to: "/help" as const },
  ];

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="mx-auto max-w-7xl rounded-3xl bg-card/80 backdrop-blur-md border border-border shadow-soft px-4 py-3 flex items-center justify-between gap-4">
        <SparkLogo />

        <nav className="hidden lg:flex items-center gap-1 bg-sky-soft rounded-2xl p-1.5">
          {navItems.map(({ key, label, icon: Icon, to }) => (
            <Link
              key={key}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all text-muted-foreground hover:text-foreground data-[status=active]:bg-card data-[status=active]:text-primary data-[status=active]:shadow-soft"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-2 rounded-xl bg-primary-gradient text-primary-foreground px-3 py-2 text-sm font-bold shadow-soft hover:shadow-float transition">
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <Link to="/teacher" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition">
                <LayoutDashboard className="h-4 w-4" /> {t("auth.dashboard")}
              </Link>
              <button onClick={logout} className="flex items-center gap-2 rounded-xl bg-mint-gradient text-secondary-foreground px-4 py-2 text-sm font-bold shadow-soft hover:shadow-float hover:-translate-y-0.5 transition-all">
                <LogOut className="h-4 w-4" /> {t("auth.logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition">
                <LogIn className="h-4 w-4" /> {t("auth.signIn")}
              </Link>
              <button
                onClick={() => setSignupOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-mint-gradient text-secondary-foreground px-4 py-2 text-sm font-bold shadow-soft hover:shadow-float hover:-translate-y-0.5 transition-all"
              >
                <UserPlus className="h-4 w-4" /> {t("auth.createAccount")}
              </button>
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
          {navItems.map(({ key, label, icon: Icon, to }) => (
            <Link
              key={key}
              to={to}
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-sky-soft transition"
            >
              <Icon className="h-4 w-4 text-primary" /> {label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-primary bg-sky-soft">
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          <div className="px-1 pt-2"><LanguageSwitcher /></div>
          <div className="pt-2 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <Link to="/teacher" className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-center">{t("auth.dashboard")}</Link>
                <button onClick={logout} className="rounded-xl bg-mint-gradient px-3 py-2 text-sm font-bold">{t("auth.logout")}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-center">{t("auth.signIn")}</Link>
                <button onClick={() => { setSignupOpen(true); setOpen(false); }} className="rounded-xl bg-mint-gradient px-3 py-2 text-sm font-bold text-center">{t("auth.createAccount")}</button>
              </>
            )}
          </div>
        </div>
      )}

      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </header>
  );
}
