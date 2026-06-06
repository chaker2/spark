import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SparkLogo } from "@/components/SparkLogo";
import { Loader2, LogOut, Plus, Users, Play, X, Copy, Sparkles, SkipForward, Trophy, Trash2, UserX, Eye } from "lucide-react";
import { toast } from "sonner";
import { CategoryBackground } from "@/components/CategoryBackground";
import { AnswerDistribution } from "@/components/AnswerDistribution";
import { PlayerAvatar } from "@/components/PlayerAvatar";

type Room = { id: string; code: string; status: "waiting" | "active" | "ended"; quiz_id: string | null; current_question_id: string | null; question_started_at: string | null; reveal_answer?: boolean };
type Player = { id: string; username: string; client_id: string; avatar: string | null };
type Quiz = { id: string; title: string };
type Question = { id: string; position: number; text: string; time_limit: number; points: number; type: string; image_url: string | null };

export const Route = createFileRoute("/teacher")({
  component: TeacherDashboard,
  head: () => ({ meta: [{ title: "Tableau de bord — SPARK" }] }),
});

function TeacherDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [creating, setCreating] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Mobile reliability: refresh state when the tab regains focus / reconnects.
  useEffect(() => {
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        setReloadKey((k) => k + 1);
      }
    };
    window.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, []);

  useEffect(() => {
    if (!room?.quiz_id) { setCategory(null); return; }
    (async () => {
      const { data } = await supabase.from("quizzes").select("category").eq("id", room.quiz_id!).maybeSingle();
      setCategory((data as any)?.category ?? null);
    })();
  }, [room?.quiz_id]);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: qs } = await supabase.from("quizzes").select("id, title").eq("owner_id", user.id).order("created_at", { ascending: false });
      setQuizzes((qs as Quiz[]) ?? []);
      if (qs?.[0]) setSelectedQuiz(qs[0].id);
      const { data: r } = await supabase.from("rooms").select("*").eq("host_id", user.id).in("status", ["waiting", "active"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (r) setRoom(r as Room);
    })();
  }, [user]);

  useEffect(() => {
    if (!room?.quiz_id) return;
    (async () => {
      const { data } = await supabase.from("questions").select("id, position, text, time_limit, points, type, image_url").eq("quiz_id", room.quiz_id!).order("position");
      setQuestions((data as Question[]) ?? []);
    })();
  }, [room?.quiz_id]);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    const loadPlayers = async () => {
      const { data } = await supabase.from("room_players").select("id, username, client_id, avatar").eq("room_id", room.id).order("joined_at");
      if (!cancelled) setPlayers((data as Player[]) ?? []);
    };
    const loadScores = async () => {
      const { data } = await supabase.from("room_answers").select("username, score_awarded").eq("room_id", room.id);
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => map[r.username] = (map[r.username] ?? 0) + r.score_awarded);
      if (!cancelled) setScores(map);
    };
    loadPlayers(); loadScores();
    const ch = supabase.channel(`tr-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` }, loadPlayers)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_answers", filter: `room_id=eq.${room.id}` }, loadScores)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, (p) => setRoom((r) => r ? { ...r, ...(p.new as Room) } : r))
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [room?.id, reloadKey]);

  const currentIdx = useMemo(() => questions.findIndex((q) => q.id === room?.current_question_id), [questions, room?.current_question_id]);
  const currentQ = currentIdx >= 0 ? questions[currentIdx] : null;

  const createRoom = async () => {
    if (!user || !selectedQuiz) return;
    setCreating(true);
    try {
      const { data: codeData, error: ce } = await supabase.rpc("generate_room_code");
      if (ce) throw ce;
      const { data, error } = await supabase.from("rooms").insert({ code: codeData as string, host_id: user.id, quiz_id: selectedQuiz }).select().single();
      if (error) throw error;
      setRoom(data as Room);
      setPlayers([]); setScores({});
      toast.success(`${t("teacher.roomCreated")} ${data.code}`);
    } catch (e: any) { toast.error(e.message); } finally { setCreating(false); }
  };

  const startGame = async () => {
    if (!room || !questions.length) return;
    const first = questions[0];
    const { error } = await supabase.from("rooms").update({ status: "active", started_at: new Date().toISOString(), current_question_id: first.id, question_started_at: new Date().toISOString() }).eq("id", room.id);
    if (error) return toast.error(error.message);
    toast.success(t("teacher.started"));
  };

  const nextQuestion = async () => {
    if (!room) return;
    const next = questions[currentIdx + 1];
    if (!next) return endGame();
    await supabase.from("rooms").update({ current_question_id: next.id, question_started_at: new Date().toISOString(), reveal_answer: false }).eq("id", room.id);
  };

  const revealAnswer = async () => {
    if (!room) return;
    await supabase.from("rooms").update({ reveal_answer: true }).eq("id", room.id);
    toast.success(t("teacher.revealAnswer"));
  };

  const endGame = async () => {
    if (!room) return;
    await supabase.from("rooms").update({ status: "ended", ended_at: new Date().toISOString(), current_question_id: null }).eq("id", room.id);
    toast.success(t("teacher.ended"));
  };

  const closeRoom = async () => {
    if (!room) return;
    await supabase.from("rooms").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", room.id);
    await supabase.from("rooms").delete().eq("id", room.id);
    setRoom(null); setPlayers([]); setScores({});
  };

  const clearAllPlayers = async () => {
    if (!room) return;
    if (!confirm("Supprimer tous les joueurs de la salle ?")) return;
    const { error } = await supabase.from("room_players").delete().eq("room_id", room.id);
    if (error) return toast.error(error.message);
    toast.success("Joueurs retirés");
  };

  const kickPlayer = async (id: string) => {
    const { error } = await supabase.from("room_players").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  const copyCode = () => { if (room) { navigator.clipboard.writeText(room.code); toast.success(t("teacher.copy")); } };
  const logout = async () => {
    // Close any active room so connected students are returned to the home screen
    // and nobody can join an abandoned room.
    if (room) {
      await supabase.from("rooms").update({ status: "ended", ended_at: new Date().toISOString(), current_question_id: null }).eq("id", room.id);
      await supabase.from("rooms").delete().eq("id", room.id);
    }
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };


  if (loading || !user) return <div className="min-h-screen grid place-items-center bg-sky-gradient"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-sky-gradient relative">
      <CategoryBackground category={category} />
      <div className="relative">
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto max-w-7xl rounded-3xl bg-card/80 backdrop-blur-md border border-border shadow-soft px-4 py-3 flex items-center justify-between">
          <SparkLogo />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/my-games" className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-accent transition">{t("nav.myGames")}</Link>
            <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-accent transition"><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">{t("auth.logout")}</span></button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:py-10 max-w-5xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 animate-pop-in">
          <h1 className="font-display text-3xl sm:text-5xl font-bold">{t("auth.dashboard")}</h1>
        </div>

        {!room ? (
          <div className="rounded-3xl bg-card border border-border shadow-float p-6 sm:p-10 text-center animate-pop-in">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-primary-gradient grid place-items-center shadow-pop animate-float"><Sparkles className="h-9 w-9 text-primary-foreground" /></div>
            <h2 className="mt-5 font-display text-2xl font-bold">{t("teacher.noActive")}</h2>
            <p className="mt-2 text-muted-foreground">{t("teacher.pitch")}</p>
            {quizzes.length === 0 ? (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">{t("teacher.noQuiz")}</p>
                <Link to="/quiz/new" className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop"><Plus className="h-4 w-4" /> {t("mygames.create")}</Link>
              </div>
            ) : (
              <div className="mt-6 max-w-md mx-auto space-y-3">
                <label className="block text-left">
                  <span className="text-sm font-semibold">{t("teacher.selectQuiz")}</span>
                  <select value={selectedQuiz} onChange={(e) => setSelectedQuiz(e.target.value)} className="mt-1 w-full h-12 rounded-xl border-2 border-border bg-background px-3 focus:border-primary focus:outline-none">
                    {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
                  </select>
                </label>
                <button onClick={createRoom} disabled={creating || !selectedQuiz} className="w-full h-14 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold text-lg shadow-pop hover:shadow-float transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />} {t("teacher.create")}
                </button>
              </div>
            )}
          </div>
        ) : room.status === "waiting" ? (
          <div className="grid lg:grid-cols-2 gap-6 animate-pop-in">
            <div className="rounded-3xl bg-card border border-border shadow-float p-6 sm:p-8 text-center">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{t("teacher.gameCode")}</p>
              <div className="mt-4 game-code font-display text-5xl sm:text-7xl font-bold tracking-[0.2em] sm:tracking-[0.25em] tabular-nums">{room.code}</div>
              <button onClick={copyCode} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-soft text-primary px-4 py-2 text-sm font-bold"><Copy className="h-4 w-4" /> {t("teacher.copy")}</button>
              <p className="mt-4 text-sm text-muted-foreground">{t("teacher.status")} : <span className="font-bold text-foreground">{t("teacher.waiting")}</span></p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={startGame} disabled={players.length === 0 || questions.length === 0} className="h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition flex items-center justify-center gap-2 disabled:opacity-50"><Play className="h-4 w-4" /> {t("teacher.start")}</button>
                <button onClick={closeRoom} className="h-12 rounded-2xl border-2 border-destructive text-destructive font-bold hover:bg-destructive/10 transition flex items-center justify-center gap-2"><X className="h-4 w-4" /> {t("teacher.end")}</button>
              </div>
              <button onClick={clearAllPlayers} disabled={players.length === 0} className="mt-3 w-full h-11 rounded-2xl border-2 border-border font-bold flex items-center justify-center gap-2 hover:bg-accent transition disabled:opacity-50">
                <Trash2 className="h-4 w-4" /> Effacer tous les joueurs
              </button>
            </div>
            <PlayersPanel players={players} onKick={kickPlayer} t={t} />
          </div>
        ) : room.status === "active" && currentQ ? (
          <div className="space-y-6 animate-pop-in">
            {/* Always-visible large game code banner */}
            <div className="rounded-3xl bg-card/90 backdrop-blur border border-border shadow-float p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest hidden sm:block">{t("teacher.gameCode")}</p>
                <div className="game-code font-display text-3xl sm:text-5xl font-bold tracking-[0.25em] tabular-nums">{room.code}</div>
              </div>
              <button onClick={copyCode} className="inline-flex items-center gap-2 rounded-xl bg-sky-soft text-primary px-3 py-2 text-sm font-bold whitespace-nowrap"><Copy className="h-4 w-4" /> <span className="hidden sm:inline">{t("teacher.copy")}</span></button>
            </div>

            <div className="rounded-3xl bg-card border border-border shadow-float p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-muted-foreground">{t("play.question")} {currentIdx + 1} / {questions.length}</span>
                {room.reveal_answer && <span className="text-xs font-bold text-mint bg-mint/10 px-3 py-1 rounded-full">✓ {t("teacher.revealAnswer")}</span>}
              </div>
              {currentQ.type === "image" && currentQ.image_url && (
                <img src={currentQ.image_url} alt="" className="mb-3 w-full max-h-72 object-contain rounded-2xl bg-sky-soft" />
              )}
              <h2 className="font-display text-2xl sm:text-4xl font-bold mb-3">{currentQ.text}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                <button onClick={revealAnswer} disabled={room.reveal_answer} className="h-12 rounded-2xl border-2 border-primary text-primary font-bold hover:bg-primary/10 transition flex items-center justify-center gap-2 disabled:opacity-50"><Eye className="h-4 w-4" /> {t("teacher.revealAnswer")}</button>
                {currentIdx < questions.length - 1 ? (
                  <button onClick={nextQuestion} className="h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop flex items-center justify-center gap-2"><SkipForward className="h-4 w-4" /> {t("teacher.next")}</button>
                ) : (
                  <button onClick={endGame} className="h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop flex items-center justify-center gap-2">{t("teacher.finish")}</button>
                )}
                <button onClick={closeRoom} className="h-12 rounded-2xl border-2 border-destructive text-destructive font-bold hover:bg-destructive/10 transition">{t("teacher.end")}</button>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              {currentQ.type !== "written" && (
                <AnswerDistribution
                  roomId={room.id}
                  questionId={currentQ.id}
                  reveal={!!room.reveal_answer}
                  totalPlayers={players.length}
                  t={t}
                />
              )}
              <Leaderboard sorted={sorted} players={players} t={t} />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-pop-in">
            <div className="rounded-3xl bg-card border border-border shadow-float p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto text-[oklch(0.85_0.18_85)]" />
              <h2 className="mt-3 font-display text-3xl font-bold">{t("play.finalRanking")}</h2>
            </div>
            <Leaderboard sorted={sorted} players={players} t={t} />
            <button onClick={closeRoom} className="w-full h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop">{t("teacher.end")}</button>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

function PlayersPanel({ players, onKick, t }: { players: Player[]; onKick: (id: string) => void; t: any }) {
  return (
    <div className="rounded-3xl bg-card border border-border shadow-float p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> {t("teacher.players")}</h2>
        <span className="font-display text-2xl sm:text-3xl font-bold text-primary tabular-nums">{players.length}</span>
      </div>
      <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto">
        {players.length === 0 ? <div className="text-center py-10 text-muted-foreground text-sm">{t("teacher.waitingPlayers")}</div> :
          players.map((p, i) => (
            <div key={p.id} style={{ animationDelay: `${i * 40}ms` }} className="flex items-center gap-3 rounded-2xl bg-sky-soft px-3 py-2 animate-pop-in">
              <div className="h-9 w-9 rounded-xl bg-card/60 grid place-items-center text-xl overflow-hidden shrink-0"><PlayerAvatar avatar={p.avatar} /></div>
              <span className="font-semibold flex-1 truncate">{p.username}</span>
              <button onClick={() => onKick(p.id)} className="h-8 w-8 rounded-lg border border-destructive/40 text-destructive grid place-items-center hover:bg-destructive/10" aria-label="Kick"><UserX className="h-4 w-4" /></button>
            </div>
          ))}
      </div>
    </div>
  );
}

function Leaderboard({ sorted, players, t }: { sorted: [string, number][]; players: Player[]; t: any }) {
  const avatarOf = (name: string) => players.find((p) => p.username === name)?.avatar ?? null;
  return (
    <div className="rounded-3xl bg-card border border-border shadow-float p-6">
      <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> {t("play.leaderboard")}</h3>
      {sorted.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
        <ul className="space-y-2">
          {sorted.slice(0, 10).map(([name, total], i) => (
            <li key={name} style={{ animationDelay: `${i * 30}ms` }} className="animate-pop-in flex items-center gap-3 rounded-2xl bg-sky-soft px-4 py-3">
              <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
              <div className="h-9 w-9 rounded-xl bg-card/60 grid place-items-center text-xl overflow-hidden shrink-0"><PlayerAvatar avatar={avatarOf(name)} /></div>
              <span className="font-semibold flex-1 truncate">{name}</span>
              <span className="font-display font-bold text-primary tabular-nums">{total}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
