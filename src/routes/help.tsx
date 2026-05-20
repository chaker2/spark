import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sparkles, GraduationCap, Users, Rocket } from "lucide-react";

export const Route = createFileRoute("/help")({
  component: HelpPage,
  head: () => ({ meta: [
    { title: "Aide & À propos — SPARK" },
    { name: "description", content: "Guide d'utilisation, mission éducative et FAQ de la plateforme SPARK." },
  ] }),
});

function HelpPage() {
  const { t } = useTranslation();
  const steps = [t("help.g1"), t("help.g2"), t("help.g3"), t("help.g4")];
  const faqs = [
    { q: t("help.q1"), a: t("help.a1") },
    { q: t("help.q2"), a: t("help.a2") },
    { q: t("help.q3"), a: t("help.a3") },
  ];

  return (
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main className="px-4 py-12 max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-pop-in">
          <div className="inline-flex h-16 w-16 rounded-3xl bg-primary-gradient items-center justify-center shadow-pop animate-float mb-4"><Sparkles className="h-8 w-8 text-primary-foreground" /></div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gradient-hero">{t("help.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("help.subtitle")}</p>
        </div>

        <section className="rounded-3xl bg-card border border-border shadow-float p-8 mb-6 animate-pop-in">
          <div className="flex items-center gap-3 mb-3">
            <Rocket className="h-6 w-6 text-primary" />
            <h2 className="font-display text-2xl font-bold">{t("help.missionTitle")}</h2>
          </div>
          <p className="text-muted-foreground">{t("help.mission")}</p>
        </section>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <section className="rounded-3xl bg-card border border-border shadow-soft p-7 animate-pop-in">
            <GraduationCap className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-display text-xl font-bold">{t("help.teacherTitle")}</h3>
            <p className="mt-2 text-muted-foreground text-sm">{t("help.teacher")}</p>
          </section>
          <section className="rounded-3xl bg-card border border-border shadow-soft p-7 animate-pop-in">
            <Users className="h-8 w-8 text-secondary-foreground mb-3" />
            <h3 className="font-display text-xl font-bold">{t("help.studentTitle")}</h3>
            <p className="mt-2 text-muted-foreground text-sm">{t("help.student")}</p>
          </section>
        </div>

        <section className="rounded-3xl bg-card border border-border shadow-float p-8 mb-6 animate-pop-in">
          <h2 className="font-display text-2xl font-bold mb-4">{t("help.guideTitle")}</h2>
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="h-8 w-8 shrink-0 rounded-xl bg-mint-gradient text-secondary-foreground font-display font-bold grid place-items-center">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-3xl bg-card border border-border shadow-float p-8 animate-pop-in">
          <h2 className="font-display text-2xl font-bold mb-4">{t("help.faqTitle")}</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details key={i} className="group rounded-2xl bg-sky-soft p-4 cursor-pointer">
                <summary className="font-semibold list-none flex items-center justify-between"><span>{f.q}</span><span className="text-primary group-open:rotate-45 transition-transform">+</span></summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
