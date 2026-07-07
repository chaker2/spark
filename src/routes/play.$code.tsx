import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/hooks/useAuth";
import { usePhaseCountdown } from "@/lib/usePhaseCountdown";
import { SparkLogo } from "@/components/SparkLogo";
import { ArrowLeft, Loader2, LogIn, Users, X, Check, Trophy, Clock, Upload } from "lucide-react";
import { toast } from "sonner";
import { AVATARS, DEFAULT_AVATAR, type Avatar, compressImage, toImageAvatar, isImageAvatar } from "@/lib/avatars";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { getStudentIdentity, saveStudentName } from "@/lib/studentIdentity";
import type { QuestionType } from "@/lib/questionTypes";
import { CategoryBackground } from "@/components/CategoryBackground";
import { PuzzleSortable } from "@/components/PuzzleSortable";

type Room = {
  id: string;
  code: string;
  status: "waiting" | "active" | "ended";
  quiz_id: string | null;
  current_question_id: string | null;
  question_started_at: string | null;
  question_phase?: "idle" | "intro" | "answering" | "waiting" | "result" | "ended";
  phase_started_at?: string | null;
  phase_ends_at?: string | null;
  reveal_answer?: boolean;
};
type Player = { id: string; username: string; client_id: string; avatar: string | null };
type Choice = { id: string; text: string; position: number };
type Question = { id: string; text: string; time_limit: number; points: number; type: QuestionType; image_url: string | null; choices: Choice[] };
type AnswerResult = { choiceId?: string; isCorrect: boolean; correctChoiceId: string | null; correctOrder: string[]; correctText?: string | null; similarity?: number };
type AnswerProgress = { answeredCount: number; playerCount: number };
type ResultDetails = { correctChoiceId: string | null; correctOrder: string[]; correctText: string | null };

export const Route = createFileRoute("/play/$code")({
  component: PlayPage,
  head: () => ({ meta: [{ title: "Salle de jeu — SPARK" }] }),
});

const CHOICE_COLORS = ["bg-[oklch(0.7_0.18_25)]", "bg-[oklch(0.7_0.18_240)]", "bg-[oklch(0.78_0.15_160)]", "bg-[oklch(0.88_0.16_85)]"];

function PlayPage() {
  const { t } = useTranslation();
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<Avatar>(DEFAULT_AVATAR);
  const [step, setStep] = useState<"name" | "avatar">("name");
  const [joining, setJoining] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [myAnswer, setMyAnswer] = useState<AnswerResult | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [resultDetails, setResultDetails] = useState<ResultDetails | null>(null);
  const [puzzleOrder, setPuzzleOrder] = useState<Choice[]>([]);
  const [now, setNow] = useState(Date.now());
  const [scores, setScores] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [answerProgress, setAnswerProgress] = useState<AnswerProgress>({ answeredCount: 0, playerCount: 0 });
  const prevQuestionIdRef = useRef<string | null>(null);

  // Reuse the permanent student identity so the name never has to be re-entered.
  useEffect(() => {
    const identity = getStudentIdentity();
    if (identity?.name) {
      setUsername(identity.name);
      setStep("avatar");
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        setNow(Date.now());
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
    if (!room?.quiz_id) return;
    (async () => {
      const { data } = await supabase.rpc("get_room_category", { _room_id: room.id });
      setCategory((data as string | null) ?? null);
    })();
  }, [room?.id, room?.quiz_id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setRoom((data as Room) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [code, reloadKey]);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    const loadPlayers = async () => {
      const { data } = await supabase.from("room_players").select("id, username, client_id, avatar").eq("room_id", room.id).order("joined_at");
      if (cancelled) return;
      const list = (data as Player[]) ?? [];
      setPlayers(list);
      const existingPlayer = list.find((p) => p.client_id === getClientId());
      if (existingPlayer && !myPlayerId) {
        setMyPlayerId(existingPlayer.id);
        setUsername(existingPlayer.username);
        if (existingPlayer.avatar) setAvatar(existingPlayer.avatar as Avatar);
      } else if (myPlayerId && !list.find((p) => p.id === myPlayerId)) setMyPlayerId(null);
    };
    const loadScores = async () => {
      const { data } = await supabase.rpc("get_room_scoreboard", { _room_id: room.id });
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.username] = r.total;
      });
      if (!cancelled) setScores(map);
    };
    const refreshRoom = async () => {
      const { data } = await supabase.from("rooms").select("*").eq("id", room.id).maybeSingle();
      if (!cancelled && data) setRoom(data as Room);
    };
    loadPlayers();
    loadScores();
    const ch = supabase
      .channel(`p-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` }, loadPlayers)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, (p) => {
        setRoom((r) => (r ? { ...r, ...(p.new as Room) } : r));
        loadScores();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_answers", filter: `room_id=eq.${room.id}` }, loadScores)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, () =>
        setRoom((r) => (r ? { ...r, status: "ended" } : r)),
      )
      .subscribe();
    const scorePoll = setInterval(loadScores, 3000);
    const roomPoll = setInterval(refreshRoom, 2000);
    return () => {
      cancelled = true;
      clearInterval(scorePoll);
      clearInterval(roomPoll);
      supabase.removeChannel(ch);
    };
  }, [room?.id, myPlayerId, reloadKey]);

  useEffect(() => {
    if (!room?.current_question_id) {
      setQuestion(null);
      setMyAnswer(null);
      setResultDetails(null);
      setSubmittingAnswer(false);
      setPuzzleOrder([]);
      setAnswerProgress({ answeredCount: 0, playerCount: 0 });
      prevQuestionIdRef.current = null;
      return;
    }
    (async () => {
      const { data: q } = await supabase.from("questions").select("id, text, time_limit, points, type, image_url").eq("id", room.current_question_id!).single();
      const { data: ch } = await supabase.rpc("get_question_choices", { _question_id: room.current_question_id! });
      if (q) {
        const choices: Choice[] = ((ch as any[]) ?? []).map((c) => ({ id: c.id, text: c.text, position: c.pos }));
        setQuestion({ ...(q as any), choices });
        if ((q as any).type === "puzzle") {
          setPuzzleOrder([...choices].sort(() => Math.random() - 0.5));
        }
      }
      if (prevQuestionIdRef.current !== room.current_question_id) {
        setMyAnswer(null);
        setResultDetails(null);
        setSubmittingAnswer(false);
        prevQuestionIdRef.current = room.current_question_id;
      }
    })();
  }, [room?.current_question_id]);

  useEffect(() => {
    if (!room?.id || !room.current_question_id) return;
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
      .channel(`answer-progress-${room.id}-${room.current_question_id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_answers", filter: `room_id=eq.${room.id}` }, loadProgress)
      .subscribe();
    const poll = setInterval(loadProgress, 1000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(ch);
    };
  }, [room?.id, room?.current_question_id, players.length]);

  useEffect(() => {
    if (room?.question_phase !== "result" || !room.id || !room.current_question_id) {
      if (room?.question_phase !== "result") setResultDetails(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_question_result_details", {
        _room_id: room.id,
        _question_id: room.current_question_id!,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (!cancelled && row) {
        setResultDetails({
          correctChoiceId: row.correct_choice_id ?? null,
          correctOrder: row.correct_order ?? [],
          correctText: row.correct_text ?? null,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [room?.question_phase, room?.id, room?.current_question_id]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) return toast.error(t("play.pseudoLen"));
    setStep("avatar");
  };

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error(t("play.avatarInvalid"));
    if (file.size > 8 * 1024 * 1024) return toast.error(t("play.avatarTooBig"));
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const path = `players/${getClientId()}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) throw error;
      setAvatar(toImageAvatar(path));
      toast.success(t("play.avatarUploaded"));
    } catch (e: any) {
      toast.error(e.message ?? t("play.avatarInvalid"));
    } finally {
      setUploading(false);
    }
  };

  const confirmAvatar = async () => {
    if (!room) return;
    setJoining(true);
    try {
      const { data, error } = await supabase
        .from("room_players")
        .insert({ room_id: room.id, username: username.trim(), avatar, client_id: getClientId() })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505") throw new Error(t("play.pseudoTaken"));
        throw error;
      }
      setMyPlayerId(data.id);
      toast.success(t("play.joined"));
    } catch (e: any) {
      toast.error(e.message);
      setStep("name");
    } finally {
      setJoining(false);
    }
  };

  const me = useMemo(() => players.find((p) => p.id === myPlayerId), [players, myPlayerId]);

  const phaseTimeLeft = usePhaseCountdown(room?.question_phase, room?.phase_started_at, room?.phase_ends_at);

  const isAnswering = room?.question_phase === "answering";
  const allAnswered = answerProgress.playerCount > 0 && answerProgress.answeredCount >= answerProgress.playerCount;

  const answer = async (choice: Choice) => {
    if (!room || !question || !me || myAnswer || submittingAnswer || !isAnswering || phaseTimeLeft <= 0) return;
    setSubmittingAnswer(true);
    const { data, error } = await supabase.rpc("submit_answer", {
      _room_id: room.id,
      _question_id: question.id,
      _client_id: getClientId(),
      _username: me.username,
      _choice_id: choice.id,
      _puzzle_order: [],
      _text_answer: null,
    } as any);
    if (error) {
      setSubmittingAnswer(false);
      toast.error(error.message);
      return;
    }
    const r = (Array.isArray(data) ? data[0] : data) as any;
    setMyAnswer({
      choiceId: choice.id,
      isCorrect: !!r?.is_correct,
      correctChoiceId: r?.correct_choice_id ?? null,
      correctOrder: r?.correct_order ?? [],
    });
  };

  const submitPuzzle = async () => {
    if (!room || !question || !me || myAnswer || submittingAnswer || !isAnswering || phaseTimeLeft <= 0) return;
    setSubmittingAnswer(true);
    const { data, error } = await supabase.rpc("submit_answer", {
      _room_id: room.id,
      _question_id: question.id,
      _client_id: getClientId(),
      _username: me.username,
      _choice_id: null,
      _puzzle_order: puzzleOrder.map((c) => c.id),
      _text_answer: null,
    } as any);
    if (error) {
      setSubmittingAnswer(false);
      toast.error(error.message);
      return;
    }
    const r = (Array.isArray(data) ? data[0] : data) as any;
    setMyAnswer({
      isCorrect: !!r?.is_correct,
      correctChoiceId: r?.correct_choice_id ?? null,
      correctOrder: r?.correct_order ?? [],
    });
  };

  const submitWritten = async (text: string) => {
    if (!room || !question || !me || myAnswer || submittingAnswer || !isAnswering || phaseTimeLeft <= 0) return;
    setSubmittingAnswer(true);
    const { data, error } = await supabase.rpc("submit_answer", {
      _room_id: room.id,
      _question_id: question.id,
      _client_id: getClientId(),
      _username: me.username,
      _choice_id: null,
      _puzzle_order: [],
      _text_answer: text,
    } as any);
    if (error) {
      setSubmittingAnswer(false);
      toast.error(error.message);
      return;
    }
    const r = (Array.isArray(data) ? data[0] : data) as any;
    setMyAnswer({
      isCorrect: !!r?.is_correct,
      correctChoiceId: null,
      correctOrder: [],
      correctText: r?.correct_text ?? null,
      similarity: r?.similarity ?? 0,
    });
  };

  if (loading) return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const myScore = me ? scores[me.username] ?? 0 : 0;

  return (
    <div className="min-h-screen bg-background relative">
      <CategoryBackground category={category} />
      <div className="relative z-10">
        <header className="px-4 pt-4">
          <div className="mx-auto max-w-7xl rounded-3xl bg-card/80 backdrop-blur-md border border-border shadow-soft px-4 py-3 flex items-center justify-between">
            <SparkLogo />
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"><ArrowLeft className="h-4 w-4" /> {t("nav.home")}</Link>
          </div>
        </header>

        <main className="px-4 py-6 sm:py-10 max-w-2xl mx-auto">
          {!room ? (
            <div className="rounded-3xl bg-card border border-border shadow-float p-10 text-center animate-pop-in">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-[oklch(0.95_0.05_25)] grid place-items-center"><X className="h-8 w-8 text-coral" /></div>
              <h1 className="mt-4 font-display text-2xl font-bold">{t("play.invalidCode")}</h1>
              <p className="mt-2 text-muted-foreground">{t("play.noRoom")} <span className="font-bold text-foreground">{code}</span>.</p>
              <Link to="/" className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop">{t("play.backHome")}</Link>
            </div>
          ) : !myPlayerId && step === "name" ? (
            <div className="rounded-3xl bg-card border border-border shadow-float p-6 sm:p-10 text-center animate-pop-in">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Code</p>
              <div className="mt-2 game-code font-display text-4xl sm:text-5xl font-bold tracking-[0.25em] tabular-nums">{room.code}</div>
              <h1 className="mt-6 font-display text-2xl font-bold">{t("play.choosePseudo")}</h1>
              <p className="mt-2 text-muted-foreground text-sm">{t("play.visible")}</p>
              <form onSubmit={join} className="mt-6 flex flex-col gap-3">
                <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} required placeholder="Pseudo" className="h-14 rounded-2xl border-2 border-border bg-background px-5 text-lg font-display font-semibold text-center focus:outline-none focus:border-primary transition" />
                <button type="submit" className="h-14 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold text-lg shadow-pop hover:shadow-float transition flex items-center justify-center gap-2">
                  Suivant <LogIn className="h-5 w-5" />
                </button>
              </form>
            </div>
          ) : !myPlayerId && step === "avatar" ? (
            <div className="rounded-3xl bg-card border border-border shadow-float p-6 sm:p-10 text-center animate-pop-in">
              <h1 className="font-display text-2xl font-bold">Choisissez votre avatar</h1>
              <p className="mt-2 text-muted-foreground text-sm">Salut <span className="font-bold text-foreground">{username}</span> !</p>
              <div className="mt-6 mx-auto h-24 w-24 rounded-3xl bg-mint-gradient grid place-items-center text-6xl shadow-pop animate-float overflow-hidden">
                <PlayerAvatar avatar={avatar} />
              </div>
              <div className="mt-6 grid grid-cols-4 sm:grid-cols-8 gap-2">
                {AVATARS.map((a) => (
                  <button key={a} onClick={() => setAvatar(a)} className={`h-14 rounded-2xl text-3xl transition ${avatar === a ? "bg-mint-gradient shadow-pop ring-2 ring-mint scale-110" : "bg-sky-soft hover:scale-105"}`}>{a}</button>
                ))}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={`mt-4 w-full h-12 rounded-2xl border-2 font-bold flex items-center justify-center gap-2 transition disabled:opacity-60 ${isImageAvatar(avatar) ? "border-mint bg-mint/10 text-mint" : "border-border hover:bg-accent"}`}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {t("play.uploadPhoto")}
              </button>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={() => setStep("name")} className="h-12 rounded-2xl border-2 border-border font-bold">Retour</button>
                <button onClick={confirmAvatar} disabled={joining} className="h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop flex items-center justify-center gap-2 disabled:opacity-60">
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} {t("join.cta")}
                </button>
              </div>
            </div>
          ) : room.status === "ended" ? (
            <FinalRanking sorted={sorted} me={me?.username} players={players} t={t} />
          ) : room.status === "active" && question ? (
            room.question_phase === "intro" ? (
              <IntroCard question={question} secondsLeft={phaseTimeLeft} t={t} />
            ) : room.question_phase === "result" ? (
              <ResultCard myAnswer={myAnswer} question={question} resultDetails={resultDetails} t={t} />
            ) : (
              <QuestionView
                key={`${question.id}-${room.question_phase}`}
                question={question}
                timeLeft={phaseTimeLeft}
                myAnswer={myAnswer}
                onAnswer={answer}
                onPuzzleSubmit={submitPuzzle}
                onPuzzleReorder={setPuzzleOrder}
                onWrittenSubmit={submitWritten}
                puzzleOrder={puzzleOrder}
                myScore={myScore}
                isWaiting={submittingAnswer || !!myAnswer}
                answerProgress={answerProgress}
                allAnswered={allAnswered}
                t={t}
              />
            )
          ) : room.status === "active" ? (
            <div className="rounded-3xl bg-card border border-border shadow-float p-10 text-center animate-pop-in">
              <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
              <p className="mt-3 text-muted-foreground">{t("play.waitingNext")}</p>
            </div>
          ) : (
            <Lobby room={room} players={players} myPlayerId={myPlayerId} onLeave={() => navigate({ to: "/" })} t={t} />
          )}
        </main>
      </div>
    </div>
  );
}

function Lobby({ room, players, myPlayerId, onLeave, t }: any) {
  return (
    <div className="rounded-3xl bg-card border border-border shadow-float p-6 sm:p-10 animate-pop-in">
      <div className="text-center">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{t("play.waitingTitle")}</p>
        <div className="mt-2 game-code font-display text-3xl sm:text-4xl font-bold tracking-[0.25em] tabular-nums">{room.code}</div>
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-sky-soft px-5 py-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="font-semibold text-primary text-sm sm:text-base">{t("play.waitingFor")}</span>
        </div>
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> {t("play.playersConnected")}</h2>
          <span className="font-display text-2xl font-bold text-primary tabular-nums">{players.length}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {players.map((p: Player, i: number) => (
            <div key={p.id} style={{ animationDelay: `${i * 30}ms` }} className={`flex items-center gap-2 rounded-2xl px-3 py-2 animate-pop-in ${p.id === myPlayerId ? "bg-mint-gradient text-secondary-foreground" : "bg-sky-soft"}`}>
              <div className="h-8 w-8 rounded-lg bg-card/60 grid place-items-center text-xl overflow-hidden shrink-0"><PlayerAvatar avatar={p.avatar} /></div>
              <span className="font-semibold text-sm truncate">{p.username}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onLeave} className="mt-6 w-full h-12 rounded-2xl border-2 border-border font-semibold hover:bg-accent transition">{t("play.leave")}</button>
    </div>
  );
}

function IntroCard({ question, secondsLeft, t }: { question: Question; secondsLeft: number; t: any }) {
  return (
    <div className="rounded-3xl bg-card border border-border shadow-float p-8 sm:p-10 text-center animate-pop-in">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{t("play.getReady")}</p>
      <div className="mt-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-gradient text-primary-foreground shadow-pop">
        <Clock className="h-8 w-8" />
      </div>
      <h2 className="mt-6 font-display text-2xl sm:text-4xl font-bold">{question.text}</h2>
      <p className="mt-4 text-muted-foreground">{t("play.questionStarting")}</p>
      <p className="mt-3 font-display text-4xl font-bold text-primary tabular-nums">{secondsLeft}</p>
    </div>
  );
}

function WaitingCard({ answerProgress, allAnswered, t }: { answerProgress: AnswerProgress; allAnswered: boolean; t: any }) {
  return (
    <div className="rounded-3xl bg-card border border-border shadow-float p-8 text-center animate-pop-in">
      <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
      <h3 className="mt-4 font-display text-2xl font-bold">{t("play.waitingForOthers")}</h3>
      <p className="mt-2 text-muted-foreground">
        {answerProgress.answeredCount}/{answerProgress.playerCount} {t("teacher.answered")}
      </p>
      {allAnswered && <p className="mt-3 font-semibold text-primary">{t("play.resultsSoon")}</p>}
    </div>
  );
}

function ResultCard({ myAnswer, question, resultDetails, t }: { myAnswer: AnswerResult | null; question: Question; resultDetails: ResultDetails | null; t: any }) {
  const correct = !!myAnswer?.isCorrect;
  const correctChoiceText = question.choices.find((c) => c.id === (myAnswer?.correctChoiceId ?? resultDetails?.correctChoiceId))?.text;
  const correctPuzzle = (resultDetails?.correctOrder ?? myAnswer?.correctOrder ?? [])
    .map((id) => question.choices.find((c) => c.id === id)?.text)
    .filter(Boolean)
    .join(" → ");
  const revealedAnswer = question.type === "written" ? (myAnswer?.correctText ?? resultDetails?.correctText) : question.type === "puzzle" ? correctPuzzle : correctChoiceText;
  return (
    <div className="rounded-3xl bg-card border border-border shadow-float p-8 sm:p-10 text-center animate-pop-in">
      <div className={`mx-auto h-20 w-20 rounded-3xl grid place-items-center shadow-pop ${correct ? "bg-mint-gradient text-secondary-foreground" : "bg-[oklch(0.95_0.05_25)] text-coral"}`}>
        {correct ? <Check className="h-10 w-10" /> : <X className="h-10 w-10" />}
      </div>
      <h2 className="mt-6 font-display text-3xl sm:text-4xl font-bold">{correct ? t("play.correct") : t("play.wrong")}</h2>
      {!myAnswer && <p className="mt-3 text-muted-foreground">{t("play.noAnswer")}</p>}
      {revealedAnswer && (
        <div className="mt-5 rounded-2xl bg-mint/10 border border-mint/30 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("quizForm.correct")}</p>
          <p className="mt-1 font-display text-xl font-bold text-foreground">{revealedAnswer}</p>
        </div>
      )}
    </div>
  );
}

function QuestionView({ question, timeLeft, myAnswer, onAnswer, onPuzzleSubmit, onPuzzleReorder, onWrittenSubmit, puzzleOrder, myScore, isWaiting, answerProgress, allAnswered, t }: any) {
  const [writtenText, setWrittenText] = useState("");
  const expired = timeLeft <= 0;

  if (isWaiting) {
    return <WaitingCard answerProgress={answerProgress} allAnswered={allAnswered} t={t} />;
  }

  return (
    <div className="space-y-4 animate-pop-in">
      <div className="rounded-3xl bg-card border border-border shadow-float p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2 text-primary font-display text-xl font-bold">
            <Clock className="h-5 w-5" /> {timeLeft}s
          </div>
          <div className="text-sm text-muted-foreground">{t("play.you")}: <span className="font-bold text-primary">{myScore} {t("play.points")}</span></div>
        </div>
        <div className="h-2 w-full bg-sky-soft rounded-full overflow-hidden">
          <div className="h-full bg-primary-gradient transition-all" style={{ width: `${Math.max(0, (timeLeft / question.time_limit) * 100)}%` }} />
        </div>
        {question.type === "image" && question.image_url && (
          <img src={question.image_url} alt="" className="mt-4 w-full max-h-56 sm:max-h-72 object-contain rounded-2xl bg-sky-soft" />
        )}
        <h2 className="mt-4 font-display text-xl sm:text-3xl font-bold">{question.text}</h2>
      </div>

      {question.type === "true_false" ? (
        <div className="grid grid-cols-2 gap-3">
          {question.choices.map((c: Choice, i: number) => (
            <button key={c.id} onClick={() => onAnswer(c)} disabled={expired}
              className={`h-24 rounded-3xl font-display font-bold text-2xl text-white shadow-pop transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 ${i === 0 ? "bg-[oklch(0.78_0.15_160)]" : "bg-[oklch(0.7_0.18_25)]"}`}>
              {c.text}
            </button>
          ))}
        </div>
      ) : question.type === "puzzle" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">Glissez ou utilisez les flèches pour ordonner :</p>
          <PuzzleSortable items={puzzleOrder} disabled={expired} onReorder={onPuzzleReorder} />
          <button onClick={onPuzzleSubmit} disabled={expired} className="w-full h-14 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold text-lg shadow-pop disabled:opacity-60">
            Valider l'ordre
          </button>
        </div>
      ) : question.type === "written" ? (
        <div className="space-y-3">
          <input
            value={writtenText}
            onChange={(e) => setWrittenText(e.target.value)}
            disabled={expired}
            placeholder="Tapez votre réponse…"
            className="w-full h-14 rounded-2xl border-2 border-border bg-background px-5 text-lg font-semibold text-center focus:outline-none focus:border-primary transition"
            onKeyDown={(e) => { if (e.key === "Enter" && writtenText.trim()) onWrittenSubmit(writtenText.trim()); }}
          />
          <button onClick={() => onWrittenSubmit(writtenText.trim())} disabled={!writtenText.trim() || expired} className="w-full h-14 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold text-lg shadow-pop disabled:opacity-60">
            Valider
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {question.choices.map((c: Choice, i: number) => (
            <button key={c.id} onClick={() => onAnswer(c)} disabled={expired}
              className={`relative min-h-20 rounded-2xl px-5 py-4 text-left font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 ${CHOICE_COLORS[i % 4]}`}>
              <span className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-white/25 grid place-items-center font-display">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{c.text}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FinalRanking({ sorted, me, players, t }: any) {
  const avatarOf = (name: string) => players.find((p: Player) => p.username === name)?.avatar ?? null;
  return (
    <div className="space-y-4 animate-pop-in">
      <div className="rounded-3xl bg-card border border-border shadow-float p-8 text-center">
        <Trophy className="h-14 w-14 mx-auto text-[oklch(0.85_0.18_85)] animate-float" />
        <h2 className="mt-3 font-display text-3xl font-bold">{t("play.finalRanking")}</h2>
        <p className="text-muted-foreground text-sm">{t("play.gameEnded")}</p>
      </div>
      <div className="rounded-3xl bg-card border border-border shadow-float p-6">
        {sorted.length === 0 ? <p className="text-center text-sm text-muted-foreground py-6">—</p> : (
          <ul className="space-y-2">
            {sorted.map(([name, total]: [string, number], i: number) => (
              <li key={name} style={{ animationDelay: `${i * 50}ms` }} className={`animate-pop-in flex items-center gap-3 rounded-2xl px-4 py-3 ${name === me ? "bg-mint-gradient text-secondary-foreground" : "bg-sky-soft"}`}>
                <span className="w-6 text-center font-bold">{i + 1}</span>
                <div className="h-10 w-10 rounded-xl bg-card/60 grid place-items-center text-2xl overflow-hidden shrink-0"><PlayerAvatar avatar={avatarOf(name)} /></div>
                <span className="font-semibold flex-1 truncate">{name}{name === me && ` (${t("play.you")})`}</span>
                <span className="font-display font-bold tabular-nums">{total}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link to="/" className="block text-center h-12 leading-[3rem] rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition">{t("play.backHome")}</Link>
    </div>
  );
}
