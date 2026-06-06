import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isImageAvatar, resolveAvatarUrl } from "@/lib/avatars";

/**
 * Renders a player avatar that may be either an emoji (default) or an uploaded
 * image stored in the private avatars bucket. The wrapping element controls the
 * size; this component fills it.
 */
export function PlayerAvatar({ avatar, className = "" }: { avatar?: string | null; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (isImageAvatar(avatar)) {
      resolveAvatarUrl(supabase, avatar).then((u) => { if (active) setUrl(u); });
    } else {
      setUrl(null);
    }
    return () => { active = false; };
  }, [avatar]);

  if (isImageAvatar(avatar) && url) {
    return <img src={url} alt="" className={`h-full w-full object-cover rounded-[inherit] ${className}`} />;
  }
  return <span className={className}>{avatar || "🦊"}</span>;
}
