import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isImageAvatar, resolveAvatarUrl } from "@/lib/avatars";
import defaultAvatar from "@/assets/default-avatar.png.asset.json";

/**
 * Shows the teacher (room host) name + profile picture.
 * Falls back to the shared default silhouette when no avatar is set.
 */
export function TeacherBadge({
  hostId,
  label = "Enseignant",
  className = "",
}: {
  hostId: string | null | undefined;
  label?: string;
  className?: string;
}) {
  const [name, setName] = useState<string>("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!hostId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar")
        .eq("id", hostId)
        .maybeSingle();
      if (!active) return;
      setName(data?.display_name ?? "");
      const a = (data?.avatar as string | null) ?? null;
      setAvatar(a);
      if (isImageAvatar(a)) {
        const u = await resolveAvatarUrl(supabase, a);
        if (active) setImgUrl(u);
      }
    })();
    return () => {
      active = false;
    };
  }, [hostId]);

  const showEmoji = avatar && !isImageAvatar(avatar);
  const showImage = isImageAvatar(avatar) && imgUrl;

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-2xl bg-card/80 backdrop-blur border border-border shadow-soft px-3 py-2 ${className}`}
    >
      <div className="h-10 w-10 rounded-xl overflow-hidden bg-sky-soft grid place-items-center shrink-0 ring-1 ring-border/60">
        {showImage ? (
          <img src={imgUrl!} alt="" className="h-full w-full object-cover" />
        ) : showEmoji ? (
          <span className="text-2xl">{avatar}</span>
        ) : (
          <img src={defaultAvatar.url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="font-display font-bold text-sm truncate max-w-[160px]">
          {name || "—"}
        </div>
      </div>
    </div>
  );
}
