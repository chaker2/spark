import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/hooks/useAuth";
import { SparkLogo } from "@/components/SparkLogo";
import { ArrowLeft, Loader2, LogIn, Users, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

type Room = { id: string; code: string; status: "waiting" | "active" | "ended" };
type Player = { id: string; username: string };

export const Route = createFileRoute("/play/$code")({
  component: PlayPage,
  head: () => ({ meta: [{ title: "Salle de jeu — SPARK" }] }),
});

function PlayPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [joining, setJoining] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  // Resolve the room by code
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id, code, status")
        .eq("code", code)
        .in("status", ["waiting", "active"])
        .maybeSingle();
      setRoom((data as Room) ?? null);
      setLoading(false);
    })();
  }, [code]);

  // Subscribe to room + players once room known
  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    const loadPlayers = async () => {
      const { data } = await supabase
        .from("room_players")
        .select("id, username")
        .eq("room_id", room.id)
        .order("joined_at", { ascending: true });
      if (!cancelled) setPlayers((data as Player[]) ?? []);
    };
    loadPlayers();

    const ch = supabase
      .channel(`play-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` }, loadPlayers)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, (p) => {
        setRoom((r) => (r ? { ...r, ...(p.new as Room) } : r));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, () => {
        toast("La partie est terminée");
        setRoom(null);
      })
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [room?.id]);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      return toast.error("Pseudo entre 2 et 20 caractères");
    }
    setJoining(true);
    try {
      const { data, error } = await supabase
        .from("room_players")
        .insert({ room_id: room.id, username: trimmed, client_id: getClientId() })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Ce pseudo est déjà pris dans cette partie");
        throw error;
      }
      setMyPlayerId(data.id);
      toast.success("Vous avez rejoint la partie !");
    } catch (err: any) {
      toast.error(err.message ?? "Impossible de rejoindre");
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (!myPlayerId) return;
    await supabase.from("room_players").delete().eq("id", myPlayerId);
    setMyPlayerId(null);
    navigate({ to: "/" });
  };

  // States
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-sky-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-gradient">
      <header className="px-4 pt-4">
        <div className="mx-auto max-w-7xl rounded-3xl bg-card/80 backdrop-blur-md border border-border shadow-soft px-4 py-3 flex items-center justify-between">
          <SparkLogo />
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
        </div>
      </header>

      <main className="px-4 py-10 max-w-2xl mx-auto">
        {!room ? (
          <div className="rounded-3xl bg-card border border-border shadow-float p-10 text-center animate-pop-in">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-[oklch(0.95_0.05_25)] grid place-items-center">
              <X className="h-8 w-8 text-coral" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">Code invalide</h1>
            <p className="mt-2 text-muted-foreground">
              Aucune partie active n'a été trouvée pour le code <span className="font-bold text-foreground">{code}</span>.
            </p>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition">
              Retour à l'accueil
            </Link>
          </div>
        ) : !myPlayerId ? (
          <div className="rounded-3xl bg-card border border-border shadow-float p-8 sm:p-10 text-center animate-pop-in">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Partie</p>
            <div className="mt-2 font-display text-5xl font-bold tracking-[0.25em] bg-clip-text text-transparent bg-primary-gradient">
              {room.code}
            </div>
            <h1 className="mt-6 font-display text-2xl font-bold">Choisissez votre pseudo</h1>
            <p className="mt-2 text-muted-foreground text-sm">Il sera visible des autres joueurs.</p>

            <form onSubmit={join} className="mt-6 flex flex-col gap-3">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                required
                placeholder="Votre pseudo"
                className="h-14 rounded-2xl border-2 border-border bg-background px-5 text-lg font-display font-semibold text-center focus:outline-none focus:border-primary transition"
              />
              <button
                type="submit"
                disabled={joining}
                className="h-14 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold text-lg shadow-pop hover:shadow-float hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                Rejoindre la partie
              </button>
            </form>
          </div>
        ) : room.status === "active" ? (
          <div className="rounded-3xl bg-card border border-border shadow-float p-10 text-center animate-pop-in">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-mint-gradient grid place-items-center shadow-pop animate-pulse-soft">
              <Sparkles className="h-9 w-9 text-secondary-foreground" />
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold">La partie a commencé !</h1>
            <p className="mt-2 text-muted-foreground">Préparez-vous, le quiz arrive…</p>
          </div>
        ) : (
          <div className="rounded-3xl bg-card border border-border shadow-float p-8 sm:p-10 animate-pop-in">
            <div className="text-center">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Salle d'attente</p>
              <div className="mt-2 font-display text-4xl font-bold tracking-[0.25em] bg-clip-text text-transparent bg-primary-gradient">
                {room.code}
              </div>
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-sky-soft px-5 py-3">
                <div className="relative">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
                <span className="font-semibold text-primary">En attente du lancement par l'enseignant…</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Joueurs connectés
                </h2>
                <span className="font-display text-2xl font-bold text-primary tabular-nums">{players.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {players.map((p, i) => (
                  <div
                    key={p.id}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 animate-pop-in ${p.id === myPlayerId ? "bg-mint-gradient text-secondary-foreground" : "bg-sky-soft"}`}
                  >
                    <div className="h-7 w-7 rounded-lg bg-card/60 grid place-items-center font-bold text-sm">
                      {p.username[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm truncate">{p.username}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={leave}
              className="mt-6 w-full h-12 rounded-2xl border-2 border-border font-semibold hover:bg-accent transition"
            >
              Quitter la partie
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
