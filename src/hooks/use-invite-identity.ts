/**
 * useInviteIdentity — derives a shareable invite ref from the user's profile.
 *
 * Treats `full_name` as the username / referral handle.
 * Returns a clean `@handle` display, a `ref` param value,
 * and helpers to build invite links.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { APP_URL } from "@/utils/ogMeta";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getSiteBase(): string {
  try {
    const env = (import.meta as any)?.env?.VITE_PUBLIC_SITE_URL;
    if (env) return env.replace(/\/+$/, "");
  } catch {}
  return APP_URL;
}

export interface InviteIdentity {
  /** Display string like "@riverkeeper" */
  displayHandle: string | null;
  /** URL-safe ref value */
  ref: string | null;
  /** Full name as stored */
  fullName: string | null;
  /** Build an invite link, optionally with a path */
  buildInviteLink: (path?: string) => string | null;
  /** Copy-ready invite text for a tree context */
  treeInviteText: (treeName: string) => string;
  /** Copy-ready invite text for a staff context */
  staffInviteText: () => string;
  /** Copy-ready invite text for an offering context */
  offeringInviteText: () => string;
  /** Generic invite text */
  genericInviteText: () => string;
  isLoading: boolean;
}

export function useInviteIdentity(): InviteIdentity {
  const { userId } = useCurrentUser();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["invite-identity", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  const fullName = profile?.full_name ?? null;
  const ref = fullName ? slugify(fullName) : null;
  const displayHandle = ref ? `@${ref}` : null;

  const buildInviteLink = (path?: string): string | null => {
    if (!ref) return null;
    const base = getSiteBase();
    const p = path || "/";
    const sep = p.includes("?") ? "&" : "?";
    return `${base}${p}${sep}ref=${encodeURIComponent(ref)}`;
  };

  const treeInviteText = (treeName: string) =>
    `🌳 I found this tree — come visit it with me\n\n${treeName}`;

  const staffInviteText = () =>
    `🌿 Come walk with me`;

  const offeringInviteText = () =>
    `💛 I left something here`;

  const genericInviteText = () =>
    `🌳 Join me in the Living Atlas`;

  return {
    displayHandle,
    ref,
    fullName,
    buildInviteLink,
    treeInviteText,
    staffInviteText,
    offeringInviteText,
    genericInviteText,
    isLoading,
  };
}
