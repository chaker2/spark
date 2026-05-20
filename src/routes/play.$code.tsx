import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/hooks/useAuth";
import { SparkLogo } from "@/components/SparkLogo";
import { ArrowLeft, Loader2, LogIn, Users, Sparkles, X, Check, Trophy, Clock } from "lucide-react";
import { toast } from "sonner";

type Room = { id: string; code: string; status: "waiting" | "active" | "ended"; quiz_id: string | null; current_question_id: string | null; question_started_at: string | null };
type Player = { id: string; username: string };
type Question = { id: string; text: string; time_limit: number; points: number; choices: Choice[] };
type Choice = { id: string; text: string; is_correct: boolean; position: number };

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
  const [joining, setJoining] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [myAnswer, setMyAnswer] = useState<{ choiceId: string; isCorrect: boolean } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("rooms").select("*").eq("code", code).in("status", ["waiting", "active"]).maybeSingle();
      setRoom((data as Room) ?? null);
      setLoading(false);
    })();
  }, [code]);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    const loadPlayers = async () => {
      const { data } = await supabase.from("room_players").select("id, username").eq("room_id", room.id).order("joined_at");
      if (!cancelled) setPlayers((data as Player[]) ?? []);
    };
    const loadScores = async () => {
      const { data } = await supabase.from("room_answers").select("username, score_awarded").eq("room_id", room.id);
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => map[r.username] = (map[r.username] ?? 0) + r.score_awarded);
      if (!cancelled) setScores(map);
    };
    loadPlayers(); loadScores();
    const ch = supabase.channel(`p-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` }, loadPlayers)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_answers", filter: `room_id=eq.${room.id}` }, loadScores)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, (p) => setRoom((r) => r ? { ...r, ...(p.new as Room) } : r))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, () => setRoom((r) => r ? { ...r, status: "ended" } : r))
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [room?.id]);

  // Load current question whenever it changes
  useEffect(() => {
    if (!room?.current_question_id) { setQuestion(null); setMyAnswer(null); return; }
    (async () => {
      const { data: q } = await supabase.from("questions").select("id, text, time_limit, points").eq("id", room.current_question_id!).single();
      const { data: ch } = await supabase.from("choices").select("id, text, is_correct, position").eq("question_id", room.current_question_id!).order("position");
      if (q) setQuestion({ ...(q as any), choices: (ch as Choice[]) ?? [] });
      setMyAnswer(null);
    })();
  }, [room?.current_question_id]);

  // Tick timer
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) return toast.error(t("play.pseudoLen"));
    setJoining(true);
    try {
      const { data, error } = await supabase.from("room_players").insert({ room_id: room.id, username: trimmed, client_id: getClientId() }).select("id").single();
      if (error) {
        if (error.code === "23505") throw new Error(t("play.pseudoTaken"));
        throw error;
      }
      setMyPlayerId(data.id);
      toast.success(t("play.joined"));
    } catch (e: any) { toast.error(e.message); } finally { setJoining(false); }
  };

  const me = useMemo(() => players.find((p) => p.id === myPlayerId), [players, myPlayerId]);

  const timeLeft = useMemo(() => {
    if (!room?.question_started_at || !question) return 0;
    const elapsed = (now - new Date(room.question_started_at).getTime()) / 1000;
    return Math.max(0, Math.ceil(question.time_limit - elapsed));
  }, [now, room?.question_started_at, question]);

  const answer = async (choice: Choice) => {
    if (!room || !question || !me || myAnswer || timeLeft <= 0) return;
    const elapsedMs = now - new Date(room.question_started_at!).getTime();
    const ratio = Math.max(0, 1 - elapsedMs / (question.time_limit * 1000));
    const awarded = choice.is_correct ? Math.round(question.points * (0.5 + 0.5 * ratio)) : 0;
    setMyAnswer({ choiceId: choice.id, isCorrect: choice.is_correct });
    await supabase.from("room_answers").insert({
      room_id: room.id, question_id: question.id, client_id: getClientId(),
      username: me.username, choice_id: choice.id, is_correct: choice.is_correct, score_awarded: awarded,
    });
  };

  if (loading) return <div className="min-h-screen grid place-items-center bg-sky-gradient"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const myScore = me ? scores[me.username] ?? 0 : 0;

  return (
    <div className="min-h-screen bg-sky-gradient">
      <header className="px-4 pt-4">
        <div className="mx-auto max-w-7xl rounded-3xl bg-card/80 backdrop-blur-md border border-border shadow-soft px-4 py-3 flex items-center justify-between">
          <SparkLogo />
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"><ArrowLeft className="h-4 w-4" /> {t("nav.home")}</Link>
        </div>
      </header>

      <main className="px-4 py-10 max-w-2xl mx-auto">
        {!room ? (
          <div className="rounded-3xl bg-card border border-border shadow-float p-10 text-center animate-pop-in">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-[oklch(0.95_0.05_25)] grid place-items-center"><X className="h-8 w-8 text-coral" /></div>
            <h1 className="mt-4 font-display text-2xl font-bold">{t("play.invalidCode")}</h1>
            <p className="mt-2 text-muted-foreground">{t("play.noRoom")} <span className="font-bold text-foreground">{code}</span>.</p>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop">{t("play.backHome")}</Link>
          </div>
        ) : !myPlayerId ? (
          <div className="rounded-3xl bg-card border border-border shadow-float p-8 sm:p-10 text-center animate-pop-in">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Code</p>
            <div className="mt-2 font-display text-5xl font-bold tracking-[0.25em] bg-clip-text text-transparent bg-primary-gradient">{room.code}</div>
            <h1 className="mt-6 font-display text-2xl font-bold">{t("play.choosePseudo")}</h1>
            <p className="mt-2 text-muted-foreground text-sm">{t("play.visible")}</p>
            <form onSubmit={join} className="mt-6 flex flex-col gap-3">
              <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} required placeholder="Pseudo" className="h-14 rounded-2xl border-2 border-border bg-background px-5 text-lg font-display font-semibold text-center focus:outline-none focus:border-primary transition" />
              <button type="submit" disabled={joining} className="h-14 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold text-lg shadow-pop hover:shadow-float transition flex items-center justify-center gap-2 disabled:opacity-60">
                {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />} {t("join.cta")}
              </button>
            </form>
          </div>
        ) : room.status === "ended" ? (
          <FinalRanking sorted={sorted} me={me?.username} t={t} />
        ) : room.status === "active" && question ? (
          <QuestionView question={question} timeLeft={timeLeft} myAnswer={myAnswer} onAnswer={answer} myScore={myScore} t={t} />
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
  );
}

function Lobby({ room, players, myPlayerId, onLeave, t }: any) {
  return (
    <div className="rounded-3xl bg-card border border-border shadow-float p-8 sm:p-10 animate-pop-in">
      <div className="text-center">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{t("play.waitingTitle")}</p>
        <div className="mt-2 font-display text-4xl font-bold tracking-[0.25em] bg-clip-text text-transparent bg-primary-gradient">{room.code}</div>
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-sky-soft px-5 py-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="font-semibold text-primary">{t("play.waitingFor")}</span>
        </div>
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> {t("play.playersConnected")}</h2>
          <span className="font-display text-2xl font-bold text-primary tabular-nums">{players.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
          {players.map((p: Player, i: number) => (
            <div key={p.id} style={{ animationDelay: `${i * 30}ms` }} className={`flex items-center gap-2 rounded-2xl px-3 py-2 animate-pop-in ${p.id === myPlayerId ? "bg-mint-gradient text-secondary-foreground" : "bg-sky-soft"}`}>
              <div className="h-7 w-7 rounded-lg bg-card/60 grid place-items-center font-bold text-sm">{p.username[0]?.toUpperCase()}</div>
              <span className="font-semibold text-sm truncate">{p.username}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onLeave} className="mt-6 w-full h-12 rounded-2xl border-2 border-border font-semibold hover:bg-accent transition">{t("play.leave")}</button>
    </div>
  );
}

function QuestionView({ question, timeLeft, myAnswer, onAnswer, myScore, t }: any) {
  const expired = timeLeft <= 0;
  return (
    <div className="space-y-4 animate-pop-in">
      <div className="rounded-3xl bg-card border border-border shadow-float p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-primary font-display text-xl font-bold">
            <Clock className="h-5 w-5" /> {timeLeft}s
          </div>
          <div className="text-sm text-muted-foreground">{t("play.you")}: <span className="font-bold text-primary">{myScore} {t("play.points")}</span></div>
        </div>
        <div className="h-2 w-full bg-sky-soft rounded-full overflow-hidden">
          <div className="h-full bg-primary-gradient transition-all" style={{ width: `${Math.max(0, (timeLeft / question.time_limit) * 100)}%` }} />
        </div>
        <h2 className="mt-5 font-display text-2xl sm:text-3xl font-bold">{question.text}</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {question.choices.map((c: Choice, i: number) => {
          const picked = myAnswer?.choiceId === c.id;
          const revealCorrect = (myAnswer || expired) && c.is_correct;
          const wrongPick = picked && !c.is_correct;
          return (
            <button
              key={c.id}
              onClick={() => onAnswer(c)}
              disabled={!!myAnswer || expired}
              className={`relative min-h-20 rounded-2xl px-5 py-4 text-left font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 ${CHOICE_COLORS[i % 4]} ${revealCorrect ? "ring-4 ring-[oklch(0.78_0.15_160)]" : ""} ${wrongPick ? "opacity-60" : ""}`}
            >
              <span className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-white/25 grid place-items-center font-display">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{c.text}</span>
                {revealCorrect && <Check className="h-5 w-5" />}
                {wrongPick && <X className="h-5 w-5" />}
              </span>
            </button>
          );
        })}
      </div>
      {myAnswer && (
        <div className={`rounded-2xl px-5 py-4 text-center font-display text-xl font-bold animate-pop-in ${myAnswer.isCorrect ? "bg-mint-gradient text-secondary-foreground" : "bg-[oklch(0.95_0.05_25)] text-coral"}`}>
          {myAnswer.isCorrect ? `🎉 ${t("play.correct")}` : `💔 ${t("play.wrong")}`}
        </div>
      )}
    </div>
  );
}

function FinalRanking({ sorted, me, t }: any) {
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
                <div className="h-9 w-9 rounded-xl bg-card/60 grid place-items-center font-bold">{name[0]?.toUpperCase()}</div>
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
