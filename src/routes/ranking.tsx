import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Trophy, Crown, Medal, Loader2 } from "lucide-react";

type Top = { username: string; total: number };
type TopQuiz = { title: string; plays: number };

export const Route = createFileRoute("/ranking")({
  component: RankingPage,
  head: () => ({ meta: [{ title: "Classement — SPARK" }] }),
});

function RankingPage() {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Top[]>([]);
  const [quizzes, setQuizzes] = useState<TopQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Aggregate top players from room_answers (this week)
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data: ans } = await supabase.from("room_answers").select("username, score_awarded, answered_at, room_id").gte("answered_at", since);
      const byUser = new Map<string, number>();
      (ans ?? []).forEach((r: any) => byUser.set(r.username, (byUser.get(r.username) ?? 0) + r.score_awarded));
      const tops = [...byUser.entries()].map(([username, total]) => ({ username, total })).sort((a, b) => b.total - a.total).slice(0, 10);
      setPlayers(tops);

      // Top quizzes by number of rooms hosted
      const { data: rooms } = await supabase.from("rooms").select("quiz_id");
      const byQuiz = new Map<string, number>();
      (rooms ?? []).forEach((r: any) => { if (r.quiz_id) byQuiz.set(r.quiz_id, (byQuiz.get(r.quiz_id) ?? 0) + 1); });
      const quizIds = [...byQuiz.keys()];
      if (quizIds.length) {
        const { data: qs } = await supabase.from("quizzes").select("id, title").in("id", quizIds);
        const titleMap = new Map((qs ?? []).map((q: any) => [q.id, q.title]));
        setQuizzes([...byQuiz.entries()].map(([id, plays]) => ({ title: titleMap.get(id) ?? "—", plays })).sort((a, b) => b.plays - a.plays).slice(0, 10));
      }
      setLoading(false);
    })();
  }, []);

  const medal = (i: number) => i === 0 ? <Crown className="h-5 w-5 text-[oklch(0.85_0.18_85)]" /> : i === 1 ? <Medal className="h-5 w-5 text-muted-foreground" /> : i === 2 ? <Medal className="h-5 w-5 text-coral" /> : <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>;

  return (
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main className="px-4 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-10 animate-pop-in">
          <div className="inline-flex h-16 w-16 rounded-3xl bg-sun-gradient items-center justify-center shadow-pop animate-float mb-4"><Trophy className="h-8 w-8 text-foreground" /></div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gradient-hero">{t("ranking.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("ranking.subtitle")}</p>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <section className="rounded-3xl bg-card border border-border shadow-float p-6 animate-pop-in">
              <h2 className="font-display text-xl font-bold mb-4">{t("ranking.topPlayers")}</h2>
              {players.length === 0 ? <p className="text-sm text-muted-foreground">{t("ranking.empty")}</p> : (
                <ul className="space-y-2">
                  {players.map((p, i) => (
                    <li key={p.username + i} style={{ animationDelay: `${i * 40}ms` }} className="animate-pop-in flex items-center gap-3 rounded-2xl bg-sky-soft px-4 py-3">
                      <div className="w-6 grid place-items-center">{medal(i)}</div>
                      <div className="h-9 w-9 rounded-xl bg-primary-gradient grid place-items-center text-primary-foreground font-bold">{p.username[0]?.toUpperCase()}</div>
                      <span className="font-semibold flex-1 truncate">{p.username}</span>
                      <span className="font-display font-bold text-primary tabular-nums">{p.total} {t("ranking.xp")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-3xl bg-card border border-border shadow-float p-6 animate-pop-in">
              <h2 className="font-display text-xl font-bold mb-4">{t("ranking.topQuizzes")}</h2>
              {quizzes.length === 0 ? <p className="text-sm text-muted-foreground">{t("ranking.empty")}</p> : (
                <ul className="space-y-2">
                  {quizzes.map((q, i) => (
                    <li key={q.title + i} style={{ animationDelay: `${i * 40}ms` }} className="animate-pop-in flex items-center gap-3 rounded-2xl bg-mint-soft px-4 py-3">
                      <div className="w-6 grid place-items-center">{medal(i)}</div>
                      <span className="font-semibold flex-1 truncate">{q.title}</span>
                      <span className="font-display font-bold text-secondary-foreground tabular-nums">{q.plays}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
