import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Gamepad2, Play, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

type Quiz = { id: string; title: string; description: string | null; category: string | null; owner_id: string };

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, description, category, owner_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      const list = (data as Quiz[]) ?? [];
      setQuizzes(list);
      if (list.length) {
        const { data: qs } = await supabase.from("questions").select("quiz_id").in("quiz_id", list.map((q) => q.id));
        const c: Record<string, number> = {};
        (qs ?? []).forEach((r: any) => { c[r.quiz_id] = (c[r.quiz_id] ?? 0) + 1; });
        setCounts(c);
      }
      setLoading(false);
    })();
  }, []);

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

  return (
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main className="px-4 py-12 max-w-6xl mx-auto">
        <div className="text-center mb-10 animate-pop-in">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gradient-hero">{t("games.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("games.subtitle")}</p>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : quizzes.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border shadow-soft p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t("games.empty")}</p>
            {user && <Link to="/quiz/new" className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition"><Gamepad2 className="h-4 w-4" /> {t("mygames.create")}</Link>}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((q, i) => (
              <div key={q.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-pop-in rounded-3xl bg-card border border-border shadow-soft p-6 flex flex-col hover:shadow-float hover:-translate-y-1 transition-all">
                <div className="h-12 w-12 rounded-2xl bg-primary-gradient grid place-items-center shadow-pop mb-4"><Gamepad2 className="h-6 w-6 text-primary-foreground" /></div>
                <h3 className="font-display text-xl font-bold">{q.title}</h3>
                {q.category && <span className="mt-1 inline-block text-xs font-semibold text-primary bg-sky-soft rounded-full px-2 py-0.5 w-fit">{q.category}</span>}
                {q.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{q.description}</p>}
                <div className="mt-3 text-xs text-muted-foreground">{counts[q.id] ?? 0} {t("games.questions")}</div>
                <button onClick={() => host(q.id)} className="mt-5 h-11 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition flex items-center justify-center gap-2">
                  <Play className="h-4 w-4" /> {t("games.play")}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
