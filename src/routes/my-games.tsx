import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Pencil, Trash2, Play, Loader2, Folder } from "lucide-react";
import { toast } from "sonner";

type Quiz = { id: string; title: string; description: string | null; category: string | null; is_public: boolean };

export const Route = createFileRoute("/my-games")({
  component: MyGamesPage,
  head: () => ({ meta: [{ title: "Mes jeux — SPARK" }] }),
});

function MyGamesPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/login" }); }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("quizzes").select("id, title, description, category, is_public").eq("owner_id", user.id).order("created_at", { ascending: false });
    setQuizzes((data as Quiz[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const remove = async (id: string) => {
    if (!confirm(t("mygames.confirmDelete"))) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("OK");
    load();
  };

  const launch = async (quizId: string) => {
    if (!user) return;
    const { data: codeData } = await supabase.rpc("generate_room_code");
    const { data, error } = await supabase.from("rooms").insert({ code: codeData as string, host_id: user.id, quiz_id: quizId }).select().single();
    if (error) return toast.error(error.message);
    toast.success(`${t("teacher.roomCreated")} ${data.code}`);
    navigate({ to: "/teacher" });
  };

  if (authLoading || !user) {
    return <div className="min-h-screen grid place-items-center bg-sky-gradient"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main className="px-4 py-12 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 animate-pop-in">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-gradient-hero">{t("mygames.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("mygames.subtitle")}</p>
          </div>
          <Link to="/quiz/new" className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition">
            <Plus className="h-4 w-4" /> {t("mygames.create")}
          </Link>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : quizzes.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border shadow-soft p-12 text-center">
            <Folder className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t("mygames.empty")}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((q, i) => (
              <div key={q.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-pop-in rounded-3xl bg-card border border-border shadow-soft p-6 flex flex-col">
                <h3 className="font-display text-xl font-bold">{q.title}</h3>
                {q.category && <span className="mt-1 inline-block text-xs font-semibold text-primary bg-sky-soft rounded-full px-2 py-0.5 w-fit">{q.category}</span>}
                {q.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{q.description}</p>}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button onClick={() => launch(q.id)} className="h-10 rounded-xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition flex items-center justify-center" title={t("mygames.launch")}>
                    <Play className="h-4 w-4" />
                  </button>
                  <Link to="/quiz/$id/edit" params={{ id: q.id }} className="h-10 rounded-xl border-2 border-border font-bold flex items-center justify-center hover:bg-accent transition" title={t("mygames.edit")}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button onClick={() => remove(q.id)} className="h-10 rounded-xl border-2 border-destructive text-destructive hover:bg-destructive/10 transition flex items-center justify-center" title={t("mygames.delete")}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
