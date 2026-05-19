import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { JoinGame } from "@/components/JoinGame";
import { GameModes } from "@/components/GameModes";
import { Footer } from "@/components/Footer";

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
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main>
        <Hero />
        <JoinGame />
        <GameModes />
      </main>
      <Footer />
    </div>
  );
}
