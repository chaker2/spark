import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Plus, Trash2, Save, Loader2, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_KEYS } from "@/lib/categories";

export const Route = createFileRoute("/quiz/new")({
  component: () => <QuizEditor mode="new" />,
  head: () => ({ meta: [{ title: "Nouveau quiz — SPARK" }] }),
});

type ChoiceDraft = { id?: string; text: string; is_correct: boolean };
type QDraft = { id?: string; text: string; time_limit: number; points: number; choices: ChoiceDraft[] };

export function QuizEditor({ mode, quizId }: { mode: "new" | "edit"; quizId?: string }) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [lesson, setLesson] = useState("");
  const [level, setLevel] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [questions, setQuestions] = useState<QDraft[]>([emptyQ()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/login" }); }, [authLoading, user, navigate]);

  useEffect(() => {
    if (mode !== "edit" || !quizId) return;
    (async () => {
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
      if (q) { setTitle(q.title); setDescription(q.description ?? ""); setCategory(q.category ?? ""); setLesson((q as any).lesson ?? ""); setLevel((q as any).level ?? ""); setIsPublic(q.is_public); }
      const { data: qs } = await supabase.from("questions").select("*, choices(*)").eq("quiz_id", quizId).order("position");
      if (qs && qs.length) {
        setQuestions(qs.map((row: any) => ({
          id: row.id, text: row.text, time_limit: row.time_limit, points: row.points,
          choices: (row.choices ?? []).sort((a: any, b: any) => a.position - b.position).map((c: any) => ({ id: c.id, text: c.text, is_correct: c.is_correct })),
        })));
      }
      setLoading(false);
    })();
  }, [mode, quizId]);

  function emptyQ(): QDraft {
    return { text: "", time_limit: 20, points: 1000, choices: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }] };
  }

  const setQ = (i: number, patch: Partial<QDraft>) => setQuestions((qs) => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const setC = (qi: number, ci: number, patch: Partial<ChoiceDraft>) => setQ(qi, { choices: questions[qi].choices.map((c, idx) => idx === ci ? { ...c, ...patch } : c) });
  const setCorrect = (qi: number, ci: number) => setQ(qi, { choices: questions[qi].choices.map((c, idx) => ({ ...c, is_correct: idx === ci })) });

  const save = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error(t("quizForm.needTitle"));
    if (!category) return toast.error(t("quizForm.needCategory"));
    if (questions.length === 0) return toast.error(t("quizForm.needQuestion"));
    for (const q of questions) {
      if (!q.text.trim() || q.choices.filter((c) => c.text.trim()).length < 2) return toast.error(t("quizForm.needQuestion"));
      if (!q.choices.some((c) => c.is_correct && c.text.trim())) return toast.error(t("quizForm.needCorrect"));
    }
    setSaving(true);
    try {
      let id = quizId;
      const payload: any = { title, description, category, lesson, level, is_public: isPublic };
      if (mode === "new") {
        const { data, error } = await supabase.from("quizzes").insert({ owner_id: user.id, ...payload }).select().single();
        if (error) throw error;
        id = data.id;
      } else {
        const { error } = await supabase.from("quizzes").update(payload).eq("id", id!);
        if (error) throw error;
        await supabase.from("questions").delete().eq("quiz_id", id!);
      }
      // insert questions+choices
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: qrow, error: qe } = await supabase.from("questions").insert({ quiz_id: id!, position: i, text: q.text, time_limit: q.time_limit, points: q.points }).select().single();
        if (qe) throw qe;
        const valid = q.choices.filter((c) => c.text.trim());
        const { error: ce } = await supabase.from("choices").insert(valid.map((c, idx) => ({ question_id: qrow.id, position: idx, text: c.text, is_correct: c.is_correct })));
        if (ce) throw ce;
      }
      toast.success(t("quizForm.saved"));
      navigate({ to: "/my-games" });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  if (authLoading || !user || loading) return <div className="min-h-screen grid place-items-center bg-sky-gradient"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main className="px-4 py-10 max-w-4xl mx-auto">
        <Link to="/my-games" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> {t("nav.myGames")}</Link>
        <h1 className="font-display text-4xl font-bold mb-6">{mode === "new" ? t("quizForm.titleNew") : t("quizForm.titleEdit")}</h1>

        <section className="rounded-3xl bg-card border border-border shadow-soft p-6 mb-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">{t("quizForm.name")}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="mt-1 w-full h-12 rounded-xl border-2 border-border bg-background px-4 focus:border-primary focus:outline-none" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">{t("quizForm.desc")}</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} className="mt-1 w-full rounded-xl border-2 border-border bg-background px-4 py-3 focus:border-primary focus:outline-none" />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold">{t("quizForm.category")}</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={50} className="mt-1 w-full h-12 rounded-xl border-2 border-border bg-background px-4 focus:border-primary focus:outline-none" />
            </label>
            <label className="flex items-center gap-3 pt-6">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-5 w-5 accent-primary" />
              <span className="font-semibold text-sm">{t("quizForm.public")}</span>
            </label>
          </div>
        </section>

        <div className="space-y-4">
          {questions.map((q, qi) => (
            <section key={qi} className="rounded-3xl bg-card border border-border shadow-soft p-6 animate-pop-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-bold">{t("quizForm.question")} {qi + 1}</h3>
                <button onClick={() => setQuestions(questions.filter((_, i) => i !== qi))} className="h-9 w-9 rounded-xl border-2 border-destructive text-destructive hover:bg-destructive/10 grid place-items-center"><Trash2 className="h-4 w-4" /></button>
              </div>
              <input value={q.text} onChange={(e) => setQ(qi, { text: e.target.value })} placeholder={t("quizForm.question")} className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 mb-3 focus:border-primary focus:outline-none" />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="text-xs font-semibold">{t("quizForm.timeLimit")}
                  <input type="number" min={5} max={120} value={q.time_limit} onChange={(e) => setQ(qi, { time_limit: parseInt(e.target.value) || 20 })} className="mt-1 w-full h-10 rounded-lg border-2 border-border bg-background px-3 focus:border-primary focus:outline-none" />
                </label>
                <label className="text-xs font-semibold">{t("quizForm.points")}
                  <input type="number" min={100} max={5000} step={100} value={q.points} onChange={(e) => setQ(qi, { points: parseInt(e.target.value) || 1000 })} className="mt-1 w-full h-10 rounded-lg border-2 border-border bg-background px-3 focus:border-primary focus:outline-none" />
                </label>
              </div>
              <div className="space-y-2">
                {q.choices.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <button onClick={() => setCorrect(qi, ci)} className={`h-10 w-10 shrink-0 rounded-xl grid place-items-center transition ${c.is_correct ? "bg-mint-gradient text-secondary-foreground shadow-pop" : "border-2 border-border text-muted-foreground"}`} title={t("quizForm.correct")}>
                      <Check className="h-4 w-4" />
                    </button>
                    <input value={c.text} onChange={(e) => setC(qi, ci, { text: e.target.value })} placeholder={`${t("quizForm.choice")} ${ci + 1}`} className="flex-1 h-10 rounded-xl border-2 border-border bg-background px-3 focus:border-primary focus:outline-none" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => setQuestions([...questions, emptyQ()])} className="h-12 px-5 rounded-2xl border-2 border-border font-bold flex items-center gap-2 hover:bg-accent transition"><Plus className="h-4 w-4" /> {t("quizForm.addQuestion")}</button>
          <button onClick={save} disabled={saving} className="h-12 px-6 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition flex items-center gap-2 disabled:opacity-60 ml-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? t("quizForm.saving") : t("quizForm.save")}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
