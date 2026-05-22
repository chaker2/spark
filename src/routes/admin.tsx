import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Loader2, Shield, Trash2, BookOpen, Users, Gamepad2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — SPARK" }] }),
});

type Quiz = { id: string; title: string; category: string | null; owner_id: string; is_public: boolean; created_at: string };
type Profile = { id: string; display_name: string | null; total_xp: number; is_admin: boolean };
type Room = { id: string; code: string; status: string; created_at: string };

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"quizzes" | "users" | "rooms" | "stats">("quizzes");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState({ quizzes: 0, users: 0, rooms: 0, answers: 0 });

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      setIsAdmin(!!data?.is_admin);
    })();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [q, u, r, a] = await Promise.all([
        supabase.from("quizzes").select("id, title, category, owner_id, is_public, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("profiles").select("id, display_name, total_xp, is_admin").order("total_xp", { ascending: false }).limit(200),
        supabase.from("rooms").select("id, code, status, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("room_answers").select("id", { count: "exact", head: true }),
      ]);
      setQuizzes((q.data as Quiz[]) ?? []);
      setUsers((u.data as Profile[]) ?? []);
      setRooms((r.data as Room[]) ?? []);
      setStats({ quizzes: q.data?.length ?? 0, users: u.data?.length ?? 0, rooms: r.data?.length ?? 0, answers: a.count ?? 0 });
    })();
  }, [isAdmin, tab]);

  const deleteQuiz = async (id: string) => {
    if (!confirm("Supprimer ce quiz ?")) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setQuizzes((qs) => qs.filter((q) => q.id !== id));
    toast.success("Supprimé");
  };

  const deleteRoom = async (id: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRooms((rs) => rs.filter((r) => r.id !== id));
  };

  if (loading || isAdmin === null) return <div className="min-h-screen grid place-items-center bg-sky-gradient"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-sky-gradient">
        <Header />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="rounded-3xl bg-card border border-border shadow-float p-10">
            <Shield className="h-12 w-12 mx-auto text-coral" />
            <h1 className="mt-4 font-display text-2xl font-bold">Accès refusé</h1>
            <p className="mt-2 text-muted-foreground text-sm">Réservé aux administrateurs.</p>
            <Link to="/" className="mt-6 inline-block h-12 leading-[3rem] px-6 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop">Retour</Link>
          </div>
        </main>
      </div>
    );
  }

  const tabs: { id: typeof tab; label: string; icon: any }[] = [
    { id: "quizzes", label: "Quiz", icon: BookOpen },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "rooms", label: "Salles", icon: Gamepad2 },
    { id: "stats", label: "Stats", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary-gradient grid place-items-center shadow-pop"><Shield className="h-6 w-6 text-primary-foreground" /></div>
          <div>
            <h1 className="font-display text-3xl font-bold">Administration</h1>
            <p className="text-sm text-muted-foreground">Contrôle complet de la plateforme</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex items-center gap-2 px-4 h-11 rounded-2xl font-semibold whitespace-nowrap transition ${tab === tb.id ? "bg-mint-gradient text-secondary-foreground shadow-pop" : "bg-card border border-border hover:bg-accent"}`}>
              <tb.icon className="h-4 w-4" /> {tb.label}
            </button>
          ))}
        </div>

        {tab === "stats" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Quiz", val: stats.quizzes }, { label: "Utilisateurs", val: stats.users },
              { label: "Salles", val: stats.rooms }, { label: "Réponses", val: stats.answers },
            ].map((s) => (
              <div key={s.label} className="rounded-3xl bg-card border border-border shadow-soft p-5 text-center">
                <div className="font-display text-3xl font-bold text-primary">{s.val}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "quizzes" && (
          <div className="rounded-3xl bg-card border border-border shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sky-soft text-left"><tr><th className="p-3">Titre</th><th className="p-3 hidden sm:table-cell">Catégorie</th><th className="p-3 hidden md:table-cell">Public</th><th className="p-3"></th></tr></thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q.id} className="border-t border-border">
                    <td className="p-3 font-semibold">{q.title}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{q.category ?? "—"}</td>
                    <td className="p-3 hidden md:table-cell">{q.is_public ? "✅" : "🔒"}</td>
                    <td className="p-3 text-right"><button onClick={() => deleteQuiz(q.id)} className="h-9 w-9 rounded-lg border border-destructive/40 text-destructive grid place-items-center hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
                {quizzes.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aucun quiz.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "users" && (
          <div className="rounded-3xl bg-card border border-border shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sky-soft text-left"><tr><th className="p-3">Nom</th><th className="p-3">XP</th><th className="p-3">Admin</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-3 font-semibold">{u.display_name ?? "—"}</td>
                    <td className="p-3 tabular-nums">{u.total_xp}</td>
                    <td className="p-3">{u.is_admin ? "👑" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "rooms" && (
          <div className="rounded-3xl bg-card border border-border shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sky-soft text-left"><tr><th className="p-3">Code</th><th className="p-3">Statut</th><th className="p-3 hidden sm:table-cell">Créée</th><th className="p-3"></th></tr></thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 font-display font-bold">{r.code}</td>
                    <td className="p-3"><span className="inline-block px-2 py-1 rounded-lg bg-sky-soft text-primary text-xs font-bold">{r.status}</span></td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right"><button onClick={() => deleteRoom(r.id)} className="h-9 w-9 rounded-lg border border-destructive/40 text-destructive grid place-items-center hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
                {rooms.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aucune salle.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
