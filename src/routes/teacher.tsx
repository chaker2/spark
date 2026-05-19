import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SparkLogo } from "@/components/SparkLogo";
import { Loader2, LogOut, Plus, Users, Play, X, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Room = {
  id: string;
  code: string;
  status: "waiting" | "active" | "ended";
  created_at: string;
};

type Player = { id: string; username: string; joined_at: string };

export const Route = createFileRoute("/teacher")({
  component: TeacherDashboard,
  head: () => ({ meta: [{ title: "Tableau de bord — SPARK" }] }),
});

function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // Load any existing waiting/active room for this teacher
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("host_id", user.id)
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setActiveRoom(data as Room);
    })();
  }, [user]);

  // Subscribe to players + room status changes
  useEffect(() => {
    if (!activeRoom) return;
    let cancelled = false;

    const loadPlayers = async () => {
      const { data } = await supabase
        .from("room_players")
        .select("id, username, joined_at")
        .eq("room_id", activeRoom.id)
        .order("joined_at", { ascending: true });
      if (!cancelled) setPlayers((data as Player[]) ?? []);
    };
    loadPlayers();

    const ch = supabase
      .channel(`room-${activeRoom.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${activeRoom.id}` }, loadPlayers)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${activeRoom.id}` }, (p) => {
        setActiveRoom((r) => (r ? { ...r, ...(p.new as Room) } : r));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [activeRoom]);

  const createRoom = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const { data: codeData, error: codeErr } = await supabase.rpc("generate_room_code");
      if (codeErr) throw codeErr;
      const { data, error } = await supabase
        .from("rooms")
        .insert({ code: codeData as string, host_id: user.id })
        .select()
        .single();
      if (error) throw error;
      setActiveRoom(data as Room);
      setPlayers([]);
      toast.success(`Partie créée — code ${data.code}`);
    } catch (err: any) {
      toast.error(err.message ?? "Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const startGame = async () => {
    if (!activeRoom) return;
    const { error } = await supabase
      .from("rooms")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", activeRoom.id);
    if (error) return toast.error(error.message);
    toast.success("Partie lancée !");
  };

  const endGame = async () => {
    if (!activeRoom) return;
    const { error } = await supabase
      .from("rooms")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", activeRoom.id);
    if (error) return toast.error(error.message);
    // Optional hard-delete to free the code immediately
    await supabase.from("rooms").delete().eq("id", activeRoom.id);
    setActiveRoom(null);
    setPlayers([]);
    toast.success("Partie terminée");
  };

  const copyCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.code);
    toast.success("Code copié");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-sky-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-gradient">
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto max-w-7xl rounded-3xl bg-card/80 backdrop-blur-md border border-border shadow-soft px-4 py-3 flex items-center justify-between">
          <SparkLogo />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-semibold text-muted-foreground">{user.email}</span>
            <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-accent transition">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-10 max-w-5xl mx-auto">
        <div className="text-center mb-8 animate-pop-in">
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Tableau de bord</h1>
          <p className="mt-2 text-muted-foreground">Créez une partie en direct et invitez vos élèves.</p>
        </div>

        {!activeRoom ? (
          <div className="rounded-3xl bg-card border border-border shadow-float p-10 text-center animate-pop-in">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-primary-gradient grid place-items-center shadow-pop animate-float">
              <Sparkles className="h-9 w-9 text-primary-foreground" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Aucune partie en cours</h2>
            <p className="mt-2 text-muted-foreground">Lancez une nouvelle session de quiz en un clic.</p>
            <button
              onClick={createRoom}
              disabled={creating}
              className="mt-6 inline-flex items-center gap-2 h-14 px-8 rounded-2xl bg-mint-gradient text-secondary-foreground font-display font-bold text-lg shadow-pop hover:shadow-float hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              Créer une nouvelle partie
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 animate-pop-in">
            <div className="rounded-3xl bg-card border border-border shadow-float p-8 text-center">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Code de la partie</p>
              <div className="mt-4 font-display text-6xl sm:text-7xl font-bold tracking-[0.25em] bg-clip-text text-transparent bg-primary-gradient">
                {activeRoom.code}
              </div>
              <button
                onClick={copyCode}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-soft text-primary px-4 py-2 text-sm font-bold hover:bg-primary/10 transition"
              >
                <Copy className="h-4 w-4" /> Copier le code
              </button>
              <p className="mt-4 text-sm text-muted-foreground">
                Statut :{" "}
                <span className="font-bold text-foreground">
                  {activeRoom.status === "waiting" ? "En attente" : "En direct"}
                </span>
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {activeRoom.status === "waiting" && (
                  <button
                    onClick={startGame}
                    disabled={players.length === 0}
                    className="h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" /> Lancer
                  </button>
                )}
                <button
                  onClick={endGame}
                  className={`h-12 rounded-2xl border-2 border-destructive text-destructive font-bold hover:bg-destructive/10 transition flex items-center justify-center gap-2 ${activeRoom.status === "waiting" ? "" : "col-span-2"}`}
                >
                  <X className="h-4 w-4" /> Terminer la partie
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-card border border-border shadow-float p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" /> Joueurs
                </h2>
                <span className="font-display text-3xl font-bold text-primary tabular-nums">{players.length}</span>
              </div>
              <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto">
                {players.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    En attente de joueurs…
                  </div>
                ) : (
                  players.map((p, i) => (
                    <div
                      key={p.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="flex items-center gap-3 rounded-2xl bg-sky-soft px-4 py-3 animate-pop-in"
                    >
                      <div className="h-9 w-9 rounded-xl bg-primary-gradient grid place-items-center text-primary-foreground font-bold">
                        {p.username[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold">{p.username}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
