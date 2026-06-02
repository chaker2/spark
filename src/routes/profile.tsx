import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { PasswordInput } from "@/components/PasswordInput";
import { Loader2, Save, User as UserIcon, Check, Upload } from "lucide-react";
import { notify } from "@/lib/notify";
import {
  AVATARS,
  type Avatar,
  isImageAvatar,
  resolveAvatarUrl,
  toImageAvatar,
  compressImage,
} from "@/lib/avatars";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profil — SPARK" }] }),
});

function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<Avatar>("🦊");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameStatus, setNameStatus] = useState<"idle" | "ok" | "taken" | "checking">("idle");
  const [initial, setInitial] = useState<{ name: string; avatar: string }>({ name: "", avatar: "🦊" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    (async () => {
      const { data } = await supabase.from("profiles").select("display_name, avatar").eq("id", user.id).maybeSingle();
      const n = data?.display_name ?? "";
      const a = (data?.avatar as Avatar) ?? "🦊";
      setDisplayName(n); setAvatar(a); setInitial({ name: n, avatar: a });
      setAvatarUrl(await resolveAvatarUrl(supabase, a));
    })();
  }, [user]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return notify.error("upload.failed");
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const path = `${user.id}/avatar.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const value = toImageAvatar(path);
      setAvatar(value);
      setAvatarUrl(await resolveAvatarUrl(supabase, value));
    } catch (err: any) {
      notify.raw(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!displayName.trim() || displayName.trim() === initial.name) { setNameStatus("idle"); return; }
    setNameStatus("checking");
    const id = setTimeout(async () => {
      const { data } = await supabase.rpc("is_display_name_available", { _name: displayName.trim() });
      setNameStatus(data ? "ok" : "taken");
    }, 400);
    return () => clearTimeout(id);
  }, [displayName, initial.name]);

  const save = async () => {
    if (!user) return;
    if (nameStatus === "taken") return notify.error("auth.name_taken");
    setSaving(true);
    try {
      const { error: pe } = await supabase.from("profiles").update({ display_name: displayName.trim(), avatar }).eq("id", user.id);
      if (pe) throw pe;
      if (email && email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) {
          if (/already|registered|exist/i.test(error.message)) { notify.error("auth.email_taken"); return; }
          throw error;
        }
      }
      if (newPassword) {
        if (newPassword.length < 6) { notify.error("auth.invalid_password"); return; }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword("");
      }
      setInitial({ name: displayName.trim(), avatar });
      notify.success("auth.profile_updated");
    } catch (e: any) { notify.raw(e.message, "error"); } finally { setSaving(false); }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center bg-sky-gradient"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="rounded-3xl bg-card border border-border shadow-float p-8 animate-pop-in">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-mint-gradient grid place-items-center text-4xl shadow-pop overflow-hidden">
              {isImageAvatar(avatar) && avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                avatar
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2"><UserIcon className="h-5 w-5 text-primary" /> {t("profile.title")}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>


          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">{t("profile.displayName")}</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} className="mt-1 w-full h-12 rounded-2xl border-2 border-border bg-background px-4 font-semibold focus:outline-none focus:border-primary transition" />
              {nameStatus === "ok" && <span className="text-xs text-mint font-semibold flex items-center gap-1 mt-1"><Check className="h-3 w-3" /> {t("profile.nameAvailable")}</span>}
              {nameStatus === "taken" && <span className="text-xs text-destructive font-semibold mt-1 block">{t("profile.nameTaken")}</span>}
            </label>

            <div>
              <span className="text-sm font-semibold">{t("profile.avatar")}</span>
              <div className="mt-2 grid grid-cols-8 gap-2">
                {AVATARS.map((a) => (
                  <button key={a} type="button" onClick={() => setAvatar(a)} className={`h-12 rounded-xl text-2xl transition ${avatar === a ? "bg-mint-gradient shadow-pop ring-2 ring-mint scale-110" : "bg-sky-soft hover:scale-105"}`}>{a}</button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-semibold">{t("profile.email")}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full h-12 rounded-2xl border-2 border-border bg-background px-4 font-semibold focus:outline-none focus:border-primary transition" />
            </label>

            <div>
              <span className="text-sm font-semibold">{t("profile.newPassword")}</span>
              <div className="mt-1">
                <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" />
              </div>
            </div>

            <button onClick={save} disabled={saving || nameStatus === "taken"} className="w-full h-12 rounded-2xl bg-mint-gradient text-secondary-foreground font-bold shadow-pop hover:shadow-float transition flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("profile.save")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
