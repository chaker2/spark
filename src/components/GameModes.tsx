import { Trophy, Swords, Timer, Puzzle, CheckCircle2, Shield, Gamepad2, ArrowRight, Users } from "lucide-react";

const modes = [
  {
    title: "Quiz Classique",
    desc: "Répondez correctement et gagnez des points",
    players: "2 – 50 joueurs",
    icon: Trophy,
    bg: "bg-sun-gradient",
    iconBg: "bg-grape/15 text-grape",
  },
  {
    title: "Duel en direct",
    desc: "Affrontez vos amis en temps réel",
    players: "2 joueurs",
    icon: Swords,
    bg: "bg-[linear-gradient(135deg,oklch(0.75_0.18_25),oklch(0.68_0.2_15))]",
    iconBg: "bg-white/25 text-white",
  },
  {
    title: "Course contre la montre",
    desc: "Répondez vite, gagnez plus !",
    players: "2 – 30 joueurs",
    icon: Timer,
    bg: "bg-primary-gradient",
    iconBg: "bg-white/25 text-white",
  },
  {
    title: "Puzzle Quiz",
    desc: "Répondez et complétez le puzzle",
    players: "2 – 20 joueurs",
    icon: Puzzle,
    bg: "bg-mint-gradient",
    iconBg: "bg-white/25 text-white",
  },
  {
    title: "Vrai ou Faux",
    desc: "Répondez vrai ou faux le plus rapidement",
    players: "2 – 50 joueurs",
    icon: CheckCircle2,
    bg: "bg-[linear-gradient(135deg,oklch(0.78_0.18_340),oklch(0.7_0.2_350))]",
    iconBg: "bg-white/25 text-white",
  },
  {
    title: "Survie",
    desc: "Restez jusqu'à la dernière question",
    players: "2 – 100 joueurs",
    icon: Shield,
    bg: "bg-sun-gradient",
    iconBg: "bg-white/30 text-foreground",
  },
];

export function GameModes() {
  return (
    <section id="jeux" className="px-4 py-16">
      <div className="mx-auto max-w-7xl rounded-[2rem] bg-card border border-border shadow-soft p-6 sm:p-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-sky-soft text-primary grid place-items-center">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Modes de jeu disponibles</h2>
          </div>
          <button className="flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2.5 transition-all">
            Voir tout <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {modes.map((m, i) => (
            <article
              key={m.title}
              className="group rounded-2xl bg-background border border-border p-4 hover:shadow-float hover:-translate-y-1.5 transition-all duration-300 animate-pop-in"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className={`relative h-28 w-full rounded-xl ${m.bg} grid place-items-center shadow-pop overflow-hidden`}>
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
                <m.icon className="h-12 w-12 text-white drop-shadow-lg relative" strokeWidth={2.2} />
              </div>
              <h3 className="mt-4 font-display font-bold text-base text-center">{m.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground text-center leading-relaxed min-h-[2.5rem]">
                {m.desc}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-sky-soft px-3 py-1.5 text-xs font-semibold text-primary">
                <Users className="h-3.5 w-3.5" /> {m.players}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
