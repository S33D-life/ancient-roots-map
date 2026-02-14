import { supabase } from "@/integrations/supabase/client";

export interface ArchiveBranch {
  key: string;
  label: string;
  icon: string;
  count: number;
  lastUpdated: string | null;
  status: "synced" | "partial" | "missing";
  data: any[];
}

export interface FullArchive {
  version: "1.0.0";
  exportedAt: string;
  userId: string;
  profile: any;
  branches: ArchiveBranch[];
  checksum: string;
}

/** Simple hash for integrity verification */
async function computeChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Gather all user data across every table */
export async function gatherArchiveData(userId: string): Promise<FullArchive> {
  const queries = {
    profile: supabase.from("profiles").select("*").eq("id", userId).single(),
    trees: supabase.from("trees").select("*").eq("created_by", userId).order("created_at", { ascending: false }),
    offerings: supabase.from("offerings").select("*").eq("created_by", userId).order("created_at", { ascending: false }),
    heartTransactions: supabase.from("heart_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    speciesHearts: supabase.from("species_heart_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    influence: supabase.from("influence_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ceremonyLogs: supabase.from("ceremony_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    vaultItems: supabase.from("vault_items").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    meetings: supabase.from("meetings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    plantedSeeds: supabase.from("planted_seeds").select("*").eq("planter_id", userId).order("created_at", { ascending: false }),
    wishlist: supabase.from("tree_wishlist").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    savedSongs: supabase.from("saved_songs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    greenhouse: supabase.from("greenhouse_plants").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    fireVotes: supabase.from("digital_fire_votes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    birdsong: supabase.from("birdsong_offerings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    draftSeeds: supabase.from("draft_seeds").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    staffs: supabase.from("staffs").select("*").eq("owner_user_id", userId).order("created_at", { ascending: false }),
    siteVisits: supabase.from("site_visits").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    referrals: supabase.from("referrals").select("*").or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`).order("created_at", { ascending: false }),
  };

  const results = await Promise.all(
    Object.entries(queries).map(async ([key, promise]) => {
      const { data, error } = await promise;
      if (error) console.warn(`Archive: error fetching ${key}:`, error.message);
      return [key, data] as [string, any];
    })
  );

  const dataMap = Object.fromEntries(results);

  const getLatest = (arr: any[]) =>
    arr?.length ? arr.reduce((a, b) => (a.created_at > b.created_at ? a : b)).created_at : null;

  const makeBranch = (key: string, label: string, icon: string, data: any[]): ArchiveBranch => ({
    key,
    label,
    icon,
    count: data?.length ?? 0,
    lastUpdated: getLatest(data ?? []),
    status: data === null ? "missing" : "synced",
    data: data ?? [],
  });

  const branches: ArchiveBranch[] = [
    makeBranch("trees", "Ancient Friends", "🌳", dataMap.trees),
    makeBranch("offerings", "Seeds & Offerings", "🌱", dataMap.offerings),
    makeBranch("heartTransactions", "S33D Hearts Ledger", "💚", dataMap.heartTransactions),
    makeBranch("speciesHearts", "Species Hive Hearts", "🌲", dataMap.speciesHearts),
    makeBranch("influence", "Influence Tokens", "⚖️", dataMap.influence),
    makeBranch("staffs", "Staff NFTs", "🪵", dataMap.staffs),
    makeBranch("ceremonyLogs", "Ceremony Logs", "📜", dataMap.ceremonyLogs),
    makeBranch("vaultItems", "Vault Items", "🔐", dataMap.vaultItems),
    makeBranch("meetings", "Map Check-ins", "🗺", dataMap.meetings),
    makeBranch("plantedSeeds", "Planted Seeds", "🌰", dataMap.plantedSeeds),
    makeBranch("savedSongs", "Music Offerings", "🎶", dataMap.savedSongs),
    makeBranch("birdsong", "Birdsong Records", "🐦", dataMap.birdsong),
    makeBranch("greenhouse", "Greenhouse Plants", "🌿", dataMap.greenhouse),
    makeBranch("fireVotes", "Council Votes", "🔥", dataMap.fireVotes),
    makeBranch("wishlist", "Wishlist", "⭐", dataMap.wishlist),
    makeBranch("referrals", "Referrals", "🤝", dataMap.referrals),
    makeBranch("siteVisits", "Site Visits", "👣", dataMap.siteVisits),
    makeBranch("draftSeeds", "Draft Seeds", "📝", dataMap.draftSeeds),
  ];

  const archive: Omit<FullArchive, "checksum"> = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    userId,
    profile: dataMap.profile,
    branches,
  };

  const checksum = await computeChecksum(JSON.stringify(archive));

  return { ...archive, checksum };
}

/** Download archive as JSON file */
export function downloadArchiveJSON(archive: FullArchive) {
  const json = JSON.stringify(archive, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `s33d-archive-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Encrypt and download archive as an encrypted blob */
export async function downloadEncryptedArchive(archive: FullArchive, password: string) {
  const json = JSON.stringify(archive);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);

  // Derive key from password
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

  // Pack salt + iv + ciphertext
  const packed = new Uint8Array(salt.length + iv.length + new Uint8Array(encrypted).length);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(new Uint8Array(encrypted), salt.length + iv.length);

  const blob = new Blob([packed], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `s33d-archive-encrypted-${new Date().toISOString().split("T")[0]}.s33d`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Decrypt an encrypted archive file */
export async function decryptArchive(file: File, password: string): Promise<FullArchive> {
  const buffer = await file.arrayBuffer();
  const packed = new Uint8Array(buffer);

  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const ciphertext = packed.slice(28);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json);
}

/** Verify archive integrity */
export async function verifyChecksum(archive: FullArchive): Promise<boolean> {
  const { checksum, ...rest } = archive;
  const computed = await computeChecksum(JSON.stringify(rest));
  return computed === checksum;
}

/** Generate a human-readable summary for PDF-like display */
export function generateArchiveSummary(archive: FullArchive): string {
  const lines: string[] = [
    "═══════════════════════════════════════",
    "   S33D — Personal Living Archive",
    "═══════════════════════════════════════",
    "",
    `Wanderer: ${archive.profile?.full_name || "Anonymous"}`,
    `Exported: ${new Date(archive.exportedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    `Checksum: ${archive.checksum.slice(0, 16)}…`,
    "",
    "── Data Branches ──────────────────────",
    "",
  ];

  for (const branch of archive.branches) {
    const status = branch.status === "synced" ? "●" : branch.status === "partial" ? "◐" : "○";
    const updated = branch.lastUpdated
      ? new Date(branch.lastUpdated).toLocaleDateString("en-GB")
      : "—";
    lines.push(`  ${branch.icon} ${branch.label.padEnd(22)} ${String(branch.count).padStart(5)} records   ${status}  ${updated}`);
  }

  const totalRecords = archive.branches.reduce((sum, b) => sum + b.count, 0);
  lines.push("");
  lines.push(`── Total: ${totalRecords} records across ${archive.branches.length} branches ──`);
  lines.push("");
  lines.push("Your path is woven into the Living Archive.");

  return lines.join("\n");
}
