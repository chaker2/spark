import mascotBlue from "@/assets/mascot-blue.png";
import mascotGreen from "@/assets/mascot-green.png";
import trophy from "@/assets/trophy.png";
import { Sparkles, HelpCircle, Star, Triangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Hero() {
  const { t } = useTranslation();
  return (
    <section id="accueil" className="relative overflow-hidden pt-10 pb-20 px-4">
      {/* Floating quiz icons */}
      <FloatingIcon className="top-16 left-[8%] text-primary bg-sky-soft" delay="0s">
        <HelpCircle className="h-5 w-5" />
      </FloatingIcon>
      <FloatingIcon className="top-32 right-[10%] text-coral bg-[oklch(0.95_0.05_25)]" delay="1s">
        <Triangle className="h-5 w-5 fill-current" />
      </FloatingIcon>
      <FloatingIcon className="top-[55%] left-[5%] text-sunny bg-[oklch(0.96_0.08_95)]" delay="0.5s">
        <Star className="h-5 w-5 fill-current" />
      </FloatingIcon>
      <FloatingIcon className="top-[45%] right-[6%] text-mint bg-mint-soft" delay="1.5s">
        <Sparkles className="h-5 w-5" />
      </FloatingIcon>

      <div className="mx-auto max-w-7xl relative">
        <div className="grid lg:grid-cols-[1fr_minmax(420px,1.4fr)_1fr] items-center gap-6">
          {/* Mascot left */}
          <div className="hidden lg:flex justify-center animate-float">
            <img
              src={mascotBlue}
              alt="Mascotte bleue Spark"
              width={320}
              height={320}
              className="w-[280px] h-[280px] object-contain drop-shadow-2xl"
            />
          </div>

          {/* Center copy */}
          <div className="text-center animate-pop-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-1.5 text-xs font-bold text-muted-foreground shadow-soft">
              <span className="h-2 w-2 rounded-full bg-mint animate-pulse" /> {t("hero.badge")}
            </span>
            <h1 className="mt-5 font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05]">
              <span className="text-gradient-hero">{t("hero.title1")}</span>
              <br />
              <span className="text-gradient-mint">{t("hero.title2")}</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              {t("hero.subtitle")}
            </p>


            <div className="mt-7 flex items-center justify-center gap-3">
              <div className="flex -space-x-3">
                {["oklch(0.78_0.15_50)","oklch(0.65_0.15_30)","oklch(0.72_0.15_280)","oklch(0.7_0.15_140)"].map((c, i) => (
                  <div
                    key={i}
                    className="h-9 w-9 rounded-full border-[3px] border-background grid place-items-center text-xs font-bold text-white"
                    style={{ background: c }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span className="font-semibold text-sm">{t("hero.players")}</span>
              <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
            </div>
          </div>

          {/* Right side: trophy + green mascot */}
          <div className="hidden lg:flex flex-col items-center gap-2 relative">
            <img
              src={mascotGreen}
              alt="Mascotte verte Spark"
              width={200}
              height={200}
              className="w-[180px] h-[180px] object-contain drop-shadow-2xl animate-float-rev"
            />
            <img
              src={trophy}
              alt="Trophée"
              width={240}
              height={240}
              className="w-[220px] h-[220px] object-contain drop-shadow-2xl -mt-6 animate-float"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingIcon({
  children,
  className,
  delay,
}: { children: React.ReactNode; className: string; delay: string }) {
  return (
    <div
      className={`absolute hidden md:grid place-items-center h-12 w-12 rounded-2xl shadow-soft animate-float ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}
