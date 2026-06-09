import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SparkLogo } from "@/components/SparkLogo";
import { Loader2, LogOut, Plus, Users, Play, X, Copy, Sparkles, SkipForward, Trophy, Trash2, UserX, Eye, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { CategoryBackground } from "@/components/CategoryBackground";
import { AnswerDistribution } from "@/components/AnswerDistribution";
import { PlayerAvatar } from "@/components/PlayerAvatar";

type Room = {
  id: string;
  code: string;
  status: "waiting" | "active" | "ended";
  quiz_id: string | null;
  current_question_id: string | null;
  question_started_at: string | null;
  reveal_answer?: boolean;
  question_phase?: "idle" | "intro" | "answering" | "waiting" | "result" | "ended";
  phase_started_at?: string | null;
  phase_ends_at?: string | null;
};
type Player = { id: string; username: string; client_id: string; avatar: string | null };
type Quiz = { id: string; title: string; category: string | null };
type Question = { id: string; position: number; text: string; time_limit: number; points: number; type: string; image_url: string | null };
type AnswerProgress = { answeredCount: number; playerCount: number };

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
  const selectedQuizCategory = useMemo(() => quizzes.find((q: any) => q.id === selectedQuiz)?.category ?? null, [quizzes, selectedQuiz]);
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [answerProgress, setAnswerProgress] = useState<AnswerProgress>({ answeredCount: 0, playerCount: 0 });
  const autoBusyRef = useRef(false);

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
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!room?.quiz_id) {
      setCategory(null);
      return;
    }
    (async () => {
      const { data } = await supabase.rpc("get_room_category", { _room_id: room.id });
      setCategory((data as string | null) ?? null);
    })();
  }, [room?.id, room?.quiz_id]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: qs } = await supabase.from("quizzes").select("id, title, category").eq("owner_id", user.id).order("created_at", { ascending: false });
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
      (data ?? []).forEach((r: any) => (map[r.username] = (map[r.username] ?? 0) + r.score_awarded));
      if (!cancelled) setScores(map);
    };
    const refreshRoom = async () => {
      const { data } = await supabase.from("rooms").select("*").eq("id", room.id).maybeSingle();
      if (!cancelled && data) setRoom(data as Room);
    };
    loadPlayers();
    loadScores();
    const ch = supabase
      .channel(`tr-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` }, loadPlayers)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_answers", filter: `room_id=eq.${room.id}` }, loadScores)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, (p) => setRoom((r) => (r ? { ...r, ...(p.new as Room) } : r)))
      .subscribe();
    const roomPoll = setInterval(refreshRoom, 2000);
    return () => {
      cancelled = true;
      clearInterval(roomPoll);
      supabase.removeChannel(ch);
    };
  }, [room?.id, reloadKey]);

  useEffect(() => {
    if (!room?.id || !room.current_question_id) {
      setAnswerProgress({ answeredCount: 0, playerCount: players.length });
      return;
    }
    let cancelled = false;
    const loadProgress = async () => {
      const { data } = await supabase.rpc("get_room_answer_progress", {
        _room_id: room.id,
        _question_id: room.current_question_id!,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (!cancelled && row) {
        setAnswerProgress({ answeredCount: row.answered_count ?? 0, playerCount: row.player_count ?? players.length });
      }
    };
    loadProgress();
    const ch = supabase
      .channel(`teacher-answer-progress-${room.id}-${room.current_question_id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_answers", filter: `room_id=eq.${room.id}` }, loadProgress)
      .subscribe();
    const poll = setInterval(loadProgress, 1000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(ch);
    };
  }, [room?.id, room?.current_question_id, players.length]);

  const currentIdx = useMemo(() => questions.findIndex((q) => q.id === room?.current_question_id), [questions, room?.current_question_id]);
  const currentQ = currentIdx >= 0 ? questions[currentIdx] : null;
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const phaseTimeLeft = useMemo(() => {
    if (!room?.phase_ends_at) return 0;
    return Math.max(0, Math.ceil((new Date(room.phase_ends_at).getTime() - now) / 1000));
  }, [room?.phase_ends_at, now]);
  const allAnswered = answerProgress.playerCount > 0 && answerProgress.answeredCount >= answerProgress.playerCount;

  const createRoom = async () => {
    if (!user || !selectedQuiz) return;
    setCreating(true);
    try {
      const { data: codeData, error: ce } = await supabase.rpc("generate_room_code");
      if (ce) throw ce;
      const { data, error } = await supabase.from("rooms").insert({ code: codeData as string, host_id: user.id, quiz_id: selectedQuiz }).select().single();
      if (error) throw error;
      setRoom(data as Room);
      setPlayers([]);
      setScores({});
      toast.success(`${t("teacher.roomCreated")} ${data.code}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const startQuestion = async (questionId: string) => {
    if (!room) return;
    const { data, error } = await supabase.rpc("start_room_question", {
      _room_id: room.id,
      _question_id: questionId,
      _intro_seconds: 2,
    });
    if (error) throw error;
    setRoom((data as Room) ?? room);
  };

  const setPhase = async (nextPhase: "answering" | "result", durationSeconds: number | null) => {
    if (!room) return;
    const { data, error } = await supabase.rpc("advance_room_phase", {
      _room_id: room.id,
      _next_phase: nextPhase,
      _duration_seconds: durationSeconds ?? undefined,
    });
    if (error) throw error;
    setRoom((data as Room) ?? room);
  };

  const startGame = async () => {
    if (!room || !questions.length) return;
    try {
      await startQuestion(questions[0].id);
      toast.success(t("teacher.started"));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const nextQuestion = async () => {
    if (!room) return;
    const next = questions[currentIdx + 1];
    if (!next) return endGame();
    try {
      await startQuestion(next.id);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const revealAnswer = async () => {
    if (!room) return;
    try {
      await setPhase("result", 3);
      toast.success(t("teacher.revealAnswer"));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const endGame = async () => {
    if (!room) return;
    const { error } = await supabase.from("rooms").update({ status: "ended", ended_at: new Date().toISOString(), current_question_id: null, question_phase: "ended" }).eq("id", room.id);
    if (error) return toast.error(error.message);
    toast.success(t("teacher.ended"));
  };

  const closeRoom = async () => {
    if (!room) return;
    await supabase.from("rooms").update({ status: "ended", ended_at: new Date().toISOString(), question_phase: "ended" }).eq("id", room.id);
    await supabase.from("rooms").delete().eq("id", room.id);
    setRoom(null);
    setPlayers([]);
    setScores({});
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

  const copyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      toast.success(t("teacher.copy"));
    }
  };

  const logout = async () => {
    if (room) {
      await supabase.from("rooms").update({ status: "ended", ended_at: new Date().toISOString(), current_question_id: null, question_phase: "ended" }).eq("id", room.id);
      await supabase.from("rooms").delete().eq("id", room.id);
    }
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  useEffect(() => {
    if (!room || !currentQ || autoBusyRef.current) return;

    const run = async (fn: () => Promise<void>) => {
      autoBusyRef.current = true;
      try {
        await fn();
      } finally {
        setTimeout(() => {
          autoBusyRef.current = false;
        }, 500);
      }
    };

    if (room.question_phase === "intro" && phaseTimeLeft <= 0) {
      run(async () => {
        await setPhase("answering", currentQ.time_limit);
      });
    } else if (room.question_phase === "answering" && (phaseTimeLeft <= 0 || allAnswered)) {
      run(async () => {
        await setPhase("result", 3);
      });
    } else if (room.question_phase === "result" && phaseTimeLeft <= 0) {
      run(async () => {
        await nextQuestion();
      });
    }
  }, [room, currentQ, phaseTimeLeft, allAnswered]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background relative">
      <CategoryBackground category={category ?? selectedQuizCategory} />
      <div className="relative z-10">
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
              <div className="rounded-3xl bg-card/90 backdrop-blur border border-border shadow-float p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest hidden sm:block">{t("teacher.gameCode")}</p>
                  <div className="game-code font-display text-3xl sm:text-5xl font-bold tracking-[0.25em] tabular-nums">{room.code}</div>
                </div>
                <button onClick={copyCode} className="inline-flex items-center gap-2 rounded-xl bg-sky-soft text-primary px-3 py-2 text-sm font-bold whitespace-nowrap"><Copy className="h-4 w-4" /> <span className="hidden sm:inline">{t("teacher.copy")}</span></button>
              </div>

              <div className="rounded-3xl bg-card border border-border shadow-float p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <span className="text-sm font-semibold text-muted-foreground">{t("play.question")} {currentIdx + 1} / {questions.length}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-sky-soft px-3 py-1 font-bold text-primary">{room.question_phase ?? "idle"}</span>
                    {room.question_phase !== "ended" && room.question_phase !== "idle" && <span className="rounded-full bg-mint/10 px-3 py-1 font-bold text-mint"><Clock3 className="inline h-4 w-4 mr-1" />{phaseTimeLeft}s</span>}
                  </div>
                </div>
                {currentQ.type === "image" && currentQ.image_url && <img src={currentQ.image_url} alt="" className="mb-3 w-full max-h-72 object-contain rounded-2xl bg-sky-soft" />}
                <h2 className="font-display text-2xl sm:text-4xl font-bold mb-3">{currentQ.text}</h2>
                <p className="text-sm text-muted-foreground">{answerProgress.answeredCount}/{answerProgress.playerCount} {t("teacher.answered")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <button onClick={revealAnswer} disabled={room.question_phase === "result"} className="h-12 rounded-2xl border-2 border-primary text-primary font-bold hover:bg-primary/10 transition flex items-center justify-center gap-2 disabled:opacity-50"><Eye className="h-4 w-4" /> {t("teacher.revealAnswer")}</button>
                  {currentIdx < questions.length - 1 ? (
                    <button onClick={nextQuestion} className="h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop flex items-center justify-center gap-2"><SkipForward className="h-4 w-4" /> {t("teacher.next")}</button>
                  ) : (
                    <button onClick={endGame} className="h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop flex items-center justify-center gap-2">{t("teacher.finish")}</button>
                  )}
                  <button onClick={closeRoom} className="h-12 rounded-2xl border-2 border-destructive text-destructive font-bold hover:bg-destructive/10 transition">{t("teacher.end")}</button>
                </div>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                {room.question_phase === "result" && currentQ.type !== "written" ? (
                  <AnswerDistribution roomId={room.id} questionId={currentQ.id} reveal={!!room.reveal_answer} totalPlayers={players.length} t={t} />
                ) : (
                  <div className="rounded-3xl bg-card border border-border shadow-float p-6 text-center">
                    <h3 className="font-display text-xl font-bold">{t("teacher.distribution")}</h3>
                    <p className="mt-3 text-muted-foreground">{t("play.waitingNext")}</p>
                  </div>
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
