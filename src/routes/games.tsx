import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Gamepad2, Play, Loader2, BookOpen, Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_KEYS, CATEGORY_COLORS, type CategoryKey } from "@/lib/categories";

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  lesson: string | null;
  level: string | null;
  owner_id: string;
};

export const Route = createFileRoute("/games")({
  component: GamesPage,
  head: () => ({ meta: [{ title: "Jeux — SPARK" }, { name: "description", content: "Bibliothèque de quiz publics SPARK." }] }),
});

function GamesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [players, setPlayers] = useState<Record<string, number>>({});
  const [activeCat, setActiveCat] = useState<"all" | CategoryKey>("all");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("quizzes")
      .select("id, title, description, category, lesson, level, owner_id")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    const list = (data as Quiz[]) ?? [];
    setQuizzes(list);
    if (list.length) {
      const ids = list.map((q) => q.id);
      const [{ data: qs }, { data: rp }] = await Promise.all([
        supabase.from("questions").select("quiz_id").in("quiz_id", ids),
        supabase.from("rooms").select("quiz_id, id").in("quiz_id", ids),
      ]);
      const c: Record<string, number> = {};
      (qs ?? []).forEach((r: any) => { c[r.quiz_id] = (c[r.quiz_id] ?? 0) + 1; });
      setCounts(c);
      const roomsByQuiz: Record<string, string[]> = {};
      (rp ?? []).forEach((r: any) => { (roomsByQuiz[r.quiz_id] ||= []).push(r.id); });
      const roomIds = Object.values(roomsByQuiz).flat();
      if (roomIds.length) {
        const { data: pl } = await supabase.from("room_players").select("room_id").in("room_id", roomIds);
        const byRoom: Record<string, number> = {};
        (pl ?? []).forEach((r: any) => { byRoom[r.room_id] = (byRoom[r.room_id] ?? 0) + 1; });
        const p: Record<string, number> = {};
        Object.entries(roomsByQuiz).forEach(([qid, rids]) => {
          p[qid] = rids.reduce((s, rid) => s + (byRoom[rid] ?? 0), 0);
        });
        setPlayers(p);
      }
    } else {
      setCounts({});
      setPlayers({});
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("quizzes-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "quizzes" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(
    () => (activeCat === "all" ? quizzes : quizzes.filter((q) => q.category === activeCat)),
    [quizzes, activeCat],
  );

  const host = async (quizId: string) => {
    if (!user) { toast.error(t("games.login")); navigate({ to: "/login" }); return; }
    const { data: codeData } = await supabase.rpc("generate_room_code");
    const { data, error } = await supabase
      .from("rooms")
      .insert({ code: codeData as string, host_id: user.id, quiz_id: quizId })
      .select().single();
    if (error) return toast.error(error.message);
    toast.success(`${t("teacher.roomCreated")} ${data.code}`);
    navigate({ to: "/teacher" });
  };

  const tabs: Array<"all" | CategoryKey> = ["all", ...CATEGORY_KEYS];

  return (
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main className="px-4 py-12 max-w-6xl mx-auto">
        <div className="text-center mb-8 animate-pop-in">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gradient-hero">{t("games.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("games.subtitle")}</p>
        </div>

        {/* Animated category tabs */}
        <div className="mb-8 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 sm:gap-3 min-w-max sm:justify-center pb-2">
            {tabs.map((k) => {
              const active = activeCat === k;
              const gradient = k === "all" ? "from-primary to-mint" : CATEGORY_COLORS[k as CategoryKey];
              return (
                <button
                  key={k}
                  onClick={() => setActiveCat(k)}
                  className={`relative h-11 px-5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-300 transform ${
                    active
                      ? `bg-gradient-to-r ${gradient} text-white shadow-pop scale-105`
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:-translate-y-0.5 hover:shadow-soft"
                  }`}
                >
                  {t(`categories.${k}`)}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border shadow-soft p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t("games.empty")}</p>
            {user && <Link to="/quiz/new" className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition"><Gamepad2 className="h-4 w-4" /> {t("mygames.create")}</Link>}
          </div>
        ) : (
          <div key={activeCat} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((q, i) => {
              const cat = (q.category && (CATEGORY_KEYS as readonly string[]).includes(q.category)) ? (q.category as CategoryKey) : null;
              const gradient = cat ? CATEGORY_COLORS[cat] : "from-primary to-mint";
              return (
                <div key={q.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-pop-in rounded-3xl bg-card border border-border shadow-soft p-6 flex flex-col hover:shadow-float hover:-translate-y-1 transition-all">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} grid place-items-center shadow-pop mb-4`}>
                    <Gamepad2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold">{q.title}</h3>
                  {cat && (
                    <span className={`mt-2 inline-block text-xs font-bold text-white bg-gradient-to-r ${gradient} rounded-full px-3 py-1 w-fit shadow-pop`}>
                      {t(`categories.${cat}`)}
                    </span>
                  )}
                  {q.lesson && <p className="mt-2 text-sm font-semibold text-foreground">📘 {t("games.lesson")}: {q.lesson}</p>}
                  {q.level && <p className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {q.level}</p>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{counts[q.id] ?? 0} {t("games.questions")}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {players[q.id] ?? 0} {t("games.players")}</span>
                  </div>
                  <button onClick={() => host(q.id)} className="mt-5 h-11 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" /> {t("games.play")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
