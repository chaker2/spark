import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, BarChart3, Loader2 } from "lucide-react";

type Choice = { id: string; text: string; pos: number };
type Dist = { choice_id: string; count: number; is_correct: boolean };

const BAR_COLORS = [
  "bg-[oklch(0.7_0.18_25)]",
  "bg-[oklch(0.7_0.18_240)]",
  "bg-[oklch(0.78_0.15_160)]",
  "bg-[oklch(0.88_0.16_85)]",
  "bg-[oklch(0.65_0.2_300)]",
  "bg-[oklch(0.7_0.18_140)]",
];

export function AnswerDistribution({
  roomId,
  questionId,
  reveal,
  totalPlayers,
  t,
}: {
  roomId: string;
  questionId: string;
  reveal: boolean;
  totalPlayers: number;
  t: any;
}) {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [dist, setDist] = useState<Dist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ data: ch }, { data: d }] = await Promise.all([
        supabase.rpc("get_question_choices", { _question_id: questionId }),
        supabase.rpc("get_answer_distribution", { _question_id: questionId, _room_id: roomId }),
      ]);
      if (cancelled) return;
      setChoices(((ch as any[]) ?? []).map((c) => ({ id: c.id, text: c.text, pos: c.pos })));
      setDist((d as Dist[]) ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`dist-${roomId}-${questionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_answers", filter: `room_id=eq.${roomId}` },
        load,
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [roomId, questionId]);

  const countFor = (id: string) => dist.find((d) => d.choice_id === id)?.count ?? 0;
  const total = dist.reduce((s, d) => s + Number(d.count), 0);
  const max = Math.max(1, ...choices.map((c) => countFor(c.id)));
  const answered = total;

  return (
    <div className="rounded-3xl bg-card border border-border shadow-float p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> {t("teacher.distribution")}
        </h3>
        <span className="text-sm font-semibold text-muted-foreground tabular-nums">
          {answered}/{totalPlayers} {t("teacher.answered")}
        </span>
      </div>

      {loading ? (
        <div className="py-8 grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : choices.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">—</p>
      ) : (
        <div className="space-y-3">
          {choices.map((c, i) => {
            const count = countFor(c.id);
            const pct = Math.round((count / max) * 100);
            const sharePct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isCorrect = dist.find((d) => d.choice_id === c.id)?.is_correct;
            return (
              <div key={c.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold flex items-center gap-2 truncate">
                    {reveal && isCorrect && <Check className="h-4 w-4 text-mint shrink-0" />}
                    <span className="truncate">{c.text || `#${i + 1}`}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground shrink-0 ml-2">
                    {count} · {sharePct}%
                  </span>
                </div>
                <div className="h-7 w-full rounded-xl bg-sky-soft overflow-hidden">
                  <div
                    className={`h-full rounded-xl transition-all duration-500 ${
                      reveal && isCorrect ? "bg-mint-gradient" : BAR_COLORS[i % BAR_COLORS.length]
                    } ${reveal && !isCorrect ? "opacity-50" : ""}`}
                    style={{ width: `${Math.max(count > 0 ? 8 : 0, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
