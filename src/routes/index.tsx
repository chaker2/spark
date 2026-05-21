import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { JoinGame } from "@/components/JoinGame";
import { GameModes } from "@/components/GameModes";
import { Footer } from "@/components/Footer";
import { Particles } from "@/components/Particles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPARK — Apprenez. Jouez. Gagnez ensemble !" },
      {
        name: "description",
        content:
          "SPARK, la plateforme de quiz interactive et ludique. Rejoignez une partie avec un code à 5 chiffres et jouez en temps réel.",
      },
      { property: "og:title", content: "SPARK — Apprenez. Jouez. Gagnez ensemble !" },
      { property: "og:description", content: "Quiz multijoueur en temps réel, modes variés, design moderne et ludique." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-sky-gradient relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse-soft" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-mint/25 blur-3xl animate-pulse-soft" style={{ animationDelay: "1.5s" }} aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[oklch(0.88_0.16_95)]/25 blur-3xl animate-pulse-soft" style={{ animationDelay: "3s" }} aria-hidden="true" />
      <Particles count={22} />
      <div className="relative">
        <Header />
        <main>
          <Hero />
          <JoinGame />
          <GameModes />
        </main>
        <Footer />
      </div>
    </div>
  );
}
