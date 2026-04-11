/**
 * Map popup HTML builders — extracted from LeafletFallbackMap for
 * maintainability and to allow caching/memoization.
 */
import { escapeHtml } from "@/utils/escapeHtml";
import { type TreeTier, getTreeTier, TIER_LABELS, getSpeciesHue } from "@/utils/treeCardTypes";
import { resolveSpeciesSync } from "@/services/speciesResolver";
import { haversineKm } from "@/utils/mapGeometry";
import type { ExternalTreeCandidate } from "@/utils/externalTreeSources";
import { getSourceById } from "@/utils/externalTreeSources";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import type { Rootstone } from "@/data/rootstones";

/* ── Proximity status for popup lights ── */
const PROXIMITY_M = 500;
const GRACE_HOURS = 12;
const GRACE_MS = GRACE_HOURS * 60 * 60 * 1000;
const VISITS_KEY = "s33d-tree-visits";

/** Derive a quick presence status light for a given tree using localStorage visits + proximity */
export function getPopupStatusLight(
  treeId: string,
  treeLat: number,
  treeLng: number,
  userLatLng: [number, number] | null,
): PopupStatusLight {
  // Check if user is currently near the tree
  if (userLatLng) {
    const distM = haversineKm(userLatLng[0], userLatLng[1], treeLat, treeLng) * 1000;
    if (distM < PROXIMITY_M) return "green";
  }

  // Check grace period from localStorage
  try {
    const visits = JSON.parse(localStorage.getItem(VISITS_KEY) || "{}");
    const lastVisit = visits[treeId];
    if (lastVisit && (Date.now() - lastVisit) < GRACE_MS) return "orange";
  } catch { /* silent */ }

  return "red";
}

/* ── Popup HTML cache — avoids rebuilding for the same tree state ── */
const POPUP_CACHE = new Map<string, string>();
const MAX_POPUP_CACHE = 200;

/** Presence signal for popup display */
export interface PopupPresenceSignal {
  presence_state: "here_now" | "recently_met";
  presence_count: number;
}

function cacheKey(treeId: string, offerings: number, age: number, birdsongCount: number, whisperCount: number, hasPhoto: boolean, distKm: number | null, statusLight: string | null, heartCount?: number, presence?: PopupPresenceSignal | null): string {
  const dKey = distKm != null ? Math.round(distKm * 10) : "x";
  const pKey = presence ? `${presence.presence_state}:${presence.presence_count}` : "n";
  return `${treeId}:${offerings}:${age}:${birdsongCount}:${whisperCount}:${hasPhoto ? 1 : 0}:${dKey}:${statusLight || "n"}:${heartCount ?? 0}:${pKey}`;
}

export interface PopupTree {
  id: string;
  name: string;
  species: string;
  species_key?: string | null;
  latitude: number;
  longitude: number;
  what3words: string;
  description?: string;
  estimated_age?: number | null;
}

export type PopupStatusLight = "green" | "orange" | "red" | null;

export function buildPopupHtml(
  tree: PopupTree,
  offerings: number,
  age: number,
  photoUrl?: string,
  birdsongCount?: number,
  whisperCount?: number,
  userLatLng?: [number, number] | null,
  statusLight?: PopupStatusLight,
  heartCount?: number,
  presenceSignal?: PopupPresenceSignal | null,
): string {
  if (!tree?.name && !tree?.species)
    return '<div style="padding:12px;font-family:sans-serif;color:#999;">Tree data unavailable</div>';

  const distKm = userLatLng ? haversineKm(userLatLng[0], userLatLng[1], tree.latitude, tree.longitude) : null;
  const key = cacheKey(tree.id, offerings, age, birdsongCount ?? 0, whisperCount ?? 0, !!photoUrl, distKm, statusLight ?? null, heartCount, presenceSignal);
  const cached = POPUP_CACHE.get(key);
  if (cached) return cached;

  const tier = getTreeTier(age, offerings);
  const tierLabel = TIER_LABELS[tier];
  const tierBg =
    tier === "ancient"
      ? "hsla(42,80%,55%,0.15)"
      : tier === "storied"
        ? "hsla(42,60%,50%,0.1)"
        : "hsla(0,0%,50%,0.08)";
  const tierColor =
    tier === "ancient"
      ? "hsl(42,80%,60%)"
      : tier === "storied"
        ? "hsl(42,60%,55%)"
        : "hsl(0,0%,55%)";
  const speciesHue = getSpeciesHue(tree.species);
  const hive = getHiveForSpecies(tree.species);
  const ageText = age > 0 ? `🌿 ~${age}y` : "";
  const offeringText =
    offerings > 0 ? `<span style="color:hsl(42,80%,60%);">✦ ${offerings}</span>` : "";
  const birdsongLine =
    (birdsongCount ?? 0) > 0 ? `<span>🐦 ${birdsongCount}</span>` : "";
  const whisperLine =
    (whisperCount ?? 0) > 0
      ? `<span style="color:hsl(200,30%,55%);">🌬️ ${whisperCount}</span>`
      : "";
  const desc = tree.description
    ? `<p style="margin:0;font-size:11px;color:hsl(0,0%,62%);line-height:1.5;font-family:sans-serif;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${escapeHtml(tree.description.substring(0, 120))}${tree.description.length > 120 ? "…" : ""}</p>`
    : "";

  const thumbnail = photoUrl
    ? `<div style="position:relative;width:100%;height:130px;overflow:hidden;border-radius:14px 14px 0 0;">
        <img src="${escapeHtml(photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
        <div style="position:absolute;inset:0;background:linear-gradient(to top,hsl(28,18%,9%) 0%,hsla(28,18%,9%,0.4) 40%,transparent 100%);pointer-events:none;"></div>
        <span style="position:absolute;top:8px;left:8px;font-size:9px;font-family:'Cinzel',serif;letter-spacing:0.06em;padding:3px 8px;border-radius:6px;background:${tierBg};color:${tierColor};border:1px solid ${tierColor}22;backdrop-filter:blur(6px);">${tierLabel}</span>
      </div>`
    : `<div style="position:relative;width:100%;height:90px;overflow:hidden;border-radius:14px 14px 0 0;background:linear-gradient(160deg,hsl(30,18%,13%),hsl(28,15%,9%));display:flex;align-items:center;justify-content:center;">
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none" style="opacity:0.2;"><path d="M24 6C24 6 14 16 14 26a10 10 0 0020 0C34 16 24 6 24 6z" fill="hsl(42,40%,45%)"/><rect x="22" y="30" width="4" height="10" rx="2" fill="hsl(30,25%,30%)"/></svg>
        <div style="position:absolute;bottom:0;left:0;right:0;height:24px;background:linear-gradient(to top,hsl(28,18%,9%),transparent);pointer-events:none;"></div>
        <span style="position:absolute;top:8px;left:8px;font-size:9px;font-family:'Cinzel',serif;letter-spacing:0.06em;padding:3px 8px;border-radius:6px;background:${tierBg};color:${tierColor};border:1px solid ${tierColor}22;">${tierLabel}</span>
      </div>`;

  const whisperHref = `/tree/${encodeURIComponent(tree.id)}?whisper=1&context=map`;
  const wishBtnId = `wish-${tree.id}`;

  /* ── Presence signal line ── */
  const presenceLine = presenceSignal
    ? presenceSignal.presence_state === "here_now"
      ? `<div style="display:flex;align-items:center;gap:5px;font-size:10px;font-family:sans-serif;color:hsl(145,50%,55%);margin-top:2px;">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:hsl(145,55%,48%);box-shadow:0 0 6px hsla(145,55%,48%,0.5);animation:statusPulse 2s ease-in-out infinite;"></span>
          ${presenceSignal.presence_count > 1 ? `${presenceSignal.presence_count} wanderers here now` : "Someone is here now"}
        </div>`
      : `<div style="display:flex;align-items:center;gap:5px;font-size:10px;font-family:sans-serif;color:hsl(210,30%,55%);margin-top:2px;">
          <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:hsl(210,35%,58%);opacity:0.7;"></span>
          ${presenceSignal.presence_count > 1 ? `${presenceSignal.presence_count} wanderers here recently` : "Recently met"}
        </div>`
    : "";

  /* ── Metadata line — age · offerings · birdsong · whispers ── */
  const metaParts = [ageText, offeringText, birdsongLine, whisperLine].filter(Boolean);
  const metaLine = metaParts.length > 0
    ? `<div style="display:flex;align-items:center;gap:8px;font-size:10px;font-family:sans-serif;color:hsl(0,0%,50%);margin-top:2px;">${metaParts.map(p => `<span>${p}</span>`).join('<span style="color:hsl(0,0%,30%);">·</span>')}</div>`
    : "";

  /* ── Location line ── */
  const locationLine = distKm != null
    ? `<p style="margin:0;font-size:10px;color:hsl(120,25%,50%);font-family:sans-serif;display:flex;align-items:center;gap:4px;">
        <span style="opacity:0.7;">📍</span>
        <span>~${distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}</span>
        <span style="color:hsl(0,0%,35%);">·</span>
        <span style="color:hsl(0,0%,45%);">~${distKm < 1 ? `${Math.max(1, Math.round(distKm * 1000 / 80))} min walk` : `${Math.round(distKm * 12)} min walk`}</span>
      </p>`
    : tree.what3words
      ? `<p style="margin:0;font-size:10px;color:hsl(42,30%,45%);font-family:sans-serif;opacity:0.8;">📍 /${escapeHtml(tree.what3words)}</p>`
      : "";

  const totalVisits = offerings + (birdsongCount ?? 0) + (whisperCount ?? 0);
  const visitLine = totalVisits > 0
    ? `<p style="margin:0;font-size:10px;color:hsl(142,30%,55%);font-family:sans-serif;display:flex;align-items:center;gap:4px;">🌿 Visited ${totalVisits} time${totalVisits !== 1 ? "s" : ""}</p>`
    : "";

  const html = `<div style="padding:0;font-family:'Cinzel',serif;width:260px;background:hsl(28,18%,9%);border-radius:14px;border:1px solid hsla(42,30%,30%,0.25);overflow:hidden;box-shadow:0 8px 32px hsla(0,0%,0%,0.45),0 0 0 1px hsla(42,40%,30%,0.08);animation:popIn .2s ease-out;">
    ${thumbnail}

    <!-- Content body -->
    <div style="padding:14px 16px 10px;display:flex;flex-direction:column;gap:6px;">
      <!-- Tree name -->
      <h3 style="margin:0;font-size:16px;color:hsl(42,65%,62%);line-height:1.35;font-weight:700;letter-spacing:0.02em;">${escapeHtml(tree.name)}</h3>

      <!-- Species -->
      <p style="margin:0;font-size:11px;color:hsl(${speciesHue},35%,50%);font-style:italic;opacity:0.85;">${escapeHtml(tree.species)}</p>

      ${presenceLine}

      <!-- Status + Hive (left) + Metadata (right) -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
        <!-- Left: status + hive — use grid for icon alignment -->
        <div style="display:grid;grid-template-columns:7px 1fr;gap:4px 5px;align-items:center;min-width:0;">
          ${statusLight ? `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${statusLight === "green" ? "hsl(142,60%,45%)" : statusLight === "orange" ? "hsl(30,85%,55%)" : "hsl(0,55%,50%)"};box-shadow:0 0 4px ${statusLight === "green" ? "hsla(142,60%,45%,0.5)" : statusLight === "orange" ? "hsla(30,85%,55%,0.4)" : "transparent"};${statusLight === "green" ? "animation:statusPulse 2s ease-in-out infinite;" : ""}"></span><span style="font-size:10px;font-family:sans-serif;color:${statusLight === "green" ? "hsl(142,50%,55%)" : statusLight === "orange" ? "hsl(30,70%,60%)" : "hsl(0,0%,50%)"};display:flex;align-items:center;gap:3px;">${statusLight === "green" ? "Here now" : statusLight === "orange" ? "Recently met" : "Not yet met"}${(whisperCount ?? 0) > 0 ? '<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:hsl(260,50%,60%);box-shadow:0 0 3px hsla(260,50%,60%,0.5);" title="Whisper waiting"></span>' : ""}</span>` : ""}
          ${hive ? `<span style="display:flex;align-items:center;justify-content:center;width:7px;font-size:10px;line-height:1;">${hive.icon}</span><a href="/hive/${escapeHtml(hive.slug)}" style="display:inline-flex;align-items:center;font-size:9px;font-family:sans-serif;color:hsl(${escapeHtml(hive.accentHsl)});text-decoration:none;padding:2px 7px;border-radius:5px;background:hsl(${escapeHtml(hive.accentHsl)} / 0.08);border:1px solid hsl(${escapeHtml(hive.accentHsl)} / 0.12);transition:all .2s;width:fit-content;">${escapeHtml(hive.displayName)}</a>` : ""}
        </div>
        <!-- Right: age, offerings, visits — use grid for leaf alignment -->
        <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 4px;align-items:center;flex-shrink:0;justify-items:end;">
          ${metaParts.length > 0 ? `<span style="font-size:10px;line-height:1;">🌿</span><span style="font-size:10px;font-family:sans-serif;color:hsl(0,0%,50%);display:flex;align-items:center;gap:5px;">${[ageText ? `~${age}y` : "", offeringText].filter(Boolean).join(' <span style="color:hsl(0,0%,30%);">·</span> ')}</span>` : ""}
          ${totalVisits > 0 ? `<span style="font-size:10px;line-height:1;">🌿</span><span style="font-size:10px;color:hsl(142,30%,55%);font-family:sans-serif;">Visited ${totalVisits} time${totalVisits !== 1 ? "s" : ""}</span>` : ""}
        </div>
      </div>

      ${locationLine}

      <!-- Description -->
      ${desc}
    </div>

    <!-- Hearts available — collect CTA or guidance -->
    ${(heartCount ?? 0) > 0 && (statusLight === "green" || statusLight === "orange") ? `
    <div style="padding:4px 16px 6px;">
      <style>
        @keyframes heartPulseGlow { 0%,100% { box-shadow: 0 0 8px hsla(140,40%,50%,0.12), 0 0 2px hsla(42,70%,50%,0.08); } 50% { box-shadow: 0 0 16px hsla(140,40%,50%,0.22), 0 0 6px hsla(42,70%,50%,0.14); } }
      </style>
      <button data-collect-hearts="${escapeHtml(tree.id)}" data-tree-name="${escapeHtml(tree.name)}" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:12px 0;font-size:12px;color:hsl(140,40%,58%);background:linear-gradient(135deg,hsla(140,35%,30%,0.1),hsla(42,70%,50%,0.06));border:1px solid hsla(140,35%,40%,0.22);border-radius:10px;cursor:pointer;font-family:sans-serif;font-weight:700;transition:all .2s;animation:heartPulseGlow 2.5s ease-in-out infinite;">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="hsl(140,45%,50%)" style="flex-shrink:0;"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 8 4.5 3.5 3.5 0 0 1 13.5 7C13.5 10.5 8 14 8 14z"/></svg>
        Collect ${heartCount} Heart${heartCount !== 1 ? "s" : ""} →
      </button>
    </div>` : (heartCount ?? 0) > 0 ? `
    <div style="padding:4px 16px 6px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 0;font-size:10px;color:hsl(0,0%,48%);font-family:sans-serif;">
        <svg width="10" height="10" viewBox="0 0 16 16" fill="hsl(0,0%,42%)" style="flex-shrink:0;opacity:0.6;"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 8 4.5 3.5 3.5 0 0 1 13.5 7C13.5 10.5 8 14 8 14z"/></svg>
        ${heartCount} heart${heartCount !== 1 ? "s" : ""} · visit to collect
      </div>
    </div>` : ""}

    <!-- Primary CTA — Meet This Tree -->
    <div style="padding:4px 16px 8px;">
      <a href="/tree/${encodeURIComponent(tree.id)}" style="display:flex;align-items:center;justify-content:center;padding:12px 0;font-size:12px;color:hsl(35,20%,10%);background:linear-gradient(135deg,hsl(42,70%,48%),hsl(45,80%,55%));border-radius:10px;text-decoration:none;letter-spacing:0.04em;font-weight:700;font-family:'Cinzel',serif;box-shadow:0 2px 10px hsla(42,70%,50%,0.25);">Meet This Tree ⟶</a>
    </div>

    <!-- Action row — Check In · Whisper · Wish -->
    <div style="padding:4px 16px 10px;display:flex;gap:6px;">
      <button data-checkin-tree="${escapeHtml(tree.id)}" data-tree-name="${escapeHtml(tree.name)}" aria-label="Check in" title="Check in" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;flex:1;height:34px;font-size:10px;color:hsl(142,50%,65%);background:hsla(142,40%,22%,0.2);border:1px solid hsla(142,40%,35%,0.2);border-radius:8px;cursor:pointer;font-family:sans-serif;font-weight:600;transition:all .2s;">📍 Check In</button>
      <a href="${whisperHref}" aria-label="Whisper" title="Whisper" style="display:inline-flex;align-items:center;justify-content:center;gap:3px;flex:1;height:34px;font-size:10px;text-decoration:none;color:hsl(200,30%,55%);background:transparent;border:1px solid hsla(200,30%,40%,0.15);border-radius:8px;font-family:sans-serif;transition:all .15s;">🌬️ Whisper</a>
      <button data-wish-tree="${escapeHtml(tree.id)}" id="${wishBtnId}" aria-label="Wish" title="Save to wishes" style="display:inline-flex;align-items:center;justify-content:center;gap:3px;flex:1;height:34px;font-size:10px;color:hsl(42,50%,55%);background:transparent;border:1px solid hsla(42,50%,45%,0.15);border-radius:8px;cursor:pointer;font-family:sans-serif;transition:all .15s;">⭐ Wish</button>
    </div>

    <!-- Secondary actions — tucked for calmer first encounter -->
    <details style="padding:2px 16px 14px;">
      <summary style="display:flex;align-items:center;justify-content:center;gap:4px;height:28px;font-size:9px;color:hsl(0,0%,45%);font-family:sans-serif;cursor:pointer;list-style:none;-webkit-appearance:none;user-select:none;transition:color .15s;" onmouseover="this.style.color='hsl(42,60%,60%)'" onmouseout="this.style.color='hsl(0,0%,45%)'">
        <span>More actions</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </summary>
      <div style="display:flex;gap:4px;justify-content:center;padding-top:6px;">
        <a href="/tree/${encodeURIComponent(tree.id)}?add=photo" style="display:inline-flex;align-items:center;justify-content:center;gap:3px;flex:1;height:28px;font-size:9px;text-decoration:none;color:hsl(0,0%,45%);background:transparent;border:1px solid hsla(0,0%,40%,0.1);border-radius:7px;font-family:sans-serif;transition:all .15s;" title="Add Photo">📷 Photo</a>
        <a href="/tree/${encodeURIComponent(tree.id)}?add=song" style="display:inline-flex;align-items:center;justify-content:center;gap:3px;flex:1;height:28px;font-size:9px;text-decoration:none;color:hsl(0,0%,45%);background:transparent;border:1px solid hsla(0,0%,40%,0.1);border-radius:7px;font-family:sans-serif;transition:all .15s;" title="Add Song">🎵 Song</a>
        <a href="/tree/${encodeURIComponent(tree.id)}?tab=encounters&refine=1" style="display:inline-flex;align-items:center;justify-content:center;gap:3px;flex:1;height:28px;font-size:9px;text-decoration:none;color:hsl(142,40%,50%);background:transparent;border:1px solid hsla(142,40%,40%,0.12);border-radius:7px;font-family:sans-serif;transition:all .15s;" title="Refine location">📍 Refine</a>
        <button data-share-tree="${encodeURIComponent(tree.id)}" style="display:inline-flex;align-items:center;justify-content:center;gap:3px;flex:1;height:28px;font-size:9px;background:transparent;border:1px solid hsla(0,0%,40%,0.1);border-radius:7px;cursor:pointer;color:hsl(0,0%,45%);font-family:sans-serif;transition:all .15s;" title="Share">↗️ Share</button>
      </div>
    </details>
  </div>`;
  // Cache the result
  if (POPUP_CACHE.size >= MAX_POPUP_CACHE) {
    const firstKey = POPUP_CACHE.keys().next().value;
    if (firstKey) POPUP_CACHE.delete(firstKey);
  }
  POPUP_CACHE.set(key, html);

  return html;
}

export function buildExternalPopupHtml(tree: ExternalTreeCandidate): string {
  const displayName = tree.title || tree.species || tree.genus || "Unknown Tree";
  const source = getSourceById(tree.source);
  const sourceName = source?.attribution || tree.source;
  const dotColor = source?.style.color || "hsl(180,60%,50%)";
  const speciesLine = tree.species
    ? `<p style="margin:0;font-size:11px;color:hsl(180,40%,55%);font-style:italic;">${escapeHtml(tree.species)}</p>`
    : tree.genus
      ? `<p style="margin:0;font-size:11px;color:hsl(180,40%,55%);font-style:italic;">Genus: ${escapeHtml(tree.genus)}</p>`
      : "";
  const heightLine = tree.height
    ? `<span style="display:flex;align-items:center;gap:3px;">📏 ~${tree.height}m tall</span>`
    : "";
  const classLine = tree.classification
    ? `<span style="display:flex;align-items:center;gap:3px;">🏛️ ${escapeHtml(tree.classification)}</span>`
    : "";

  return `<div style="padding:0;font-family:'Cinzel',serif;width:220px;background:hsl(200,15%,12%);border-radius:12px;border:1px solid hsla(180,40%,30%,0.5);overflow:hidden;animation:popIn .2s ease-out;">
    <div style="padding:12px 14px 8px;display:flex;flex-direction:column;gap:5px;">
      <div style="display:flex;align-items:center;gap-6px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};margin-right:6px;flex-shrink:0;"></span>
        <h3 style="margin:0;font-size:14px;color:hsl(180,50%,70%);line-height:1.3;font-weight:700;">${escapeHtml(displayName)}</h3>
      </div>
      ${speciesLine}
      <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:11px;font-family:sans-serif;color:hsl(0,0%,55%);">
        ${heightLine}
        ${classLine}
        <span style="display:flex;align-items:center;gap:3px;">🗺️ ${escapeHtml(sourceName)}</span>
      </div>
    </div>
    <div style="padding:6px 14px 12px;">
      <p style="margin:0;font-size:10px;color:hsl(180,30%,45%);font-family:sans-serif;line-height:1.4;">
        Discover recorded elders nearby. Bloom hearts with this Ancient Friend.
      </p>
    </div>
    <div style="padding:0 14px 12px;">
      <a href="/map?tree=${encodeURIComponent(tree.id)}&treeId=${encodeURIComponent(tree.id)}&lat=${tree.lat}&lng=${tree.lng}&zoom=18&arrival=tree&journey=1" style="display:flex;align-items:center;justify-content:center;padding:9px 0;font-size:12px;color:hsl(200,15%,12%);background:linear-gradient(135deg,hsl(180,60%,45%),hsl(180,70%,55%));border-radius:8px;text-decoration:none;letter-spacing:0.04em;font-weight:700;font-family:sans-serif;">🌱 Bloom Hearts Here</a>
    </div>
  </div>`;
}

export interface ResearchTree {
  id: string;
  species_scientific: string;
  species_common: string | null;
  tree_name: string | null;
  locality_text: string;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  geo_precision: string;
  description: string | null;
  height_m: number | null;
  girth_or_stem: string | null;
  crown_spread: string | null;
  designation_type: string;
  source_doc_title: string;
  source_doc_url: string;
  source_doc_year: number;
  source_program: string;
  status: string;
}

export function buildResearchPopupHtml(rt: ResearchTree): string {
  const name = rt.tree_name || rt.species_common || rt.species_scientific;
  const precisionBadge =
    rt.geo_precision === "exact"
      ? '<span style="color:hsl(120,55%,50%);font-size:9px;">● Exact</span>'
      : rt.geo_precision === "approx"
        ? '<span style="color:hsl(45,70%,50%);font-size:9px;">◐ Approx</span>'
        : '<span style="color:hsl(0,50%,55%);font-size:9px;">○ Unverified</span>';

  const measurements = [
    rt.height_m ? `📏 ${rt.height_m}m tall` : "",
    rt.girth_or_stem ? `⊙ ${escapeHtml(rt.girth_or_stem)}` : "",
    rt.crown_spread ? `🌳 ${escapeHtml(rt.crown_spread)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const desc = rt.description
    ? `<p style="margin:4px 0 0;font-size:11px;color:hsl(0,0%,62%);line-height:1.5;font-family:sans-serif;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">${escapeHtml(rt.description.substring(0, 200))}${rt.description.length > 200 ? "…" : ""}</p>`
    : "";

  return `<div style="padding:0;font-family:'Cinzel',serif;width:260px;background:hsl(25,18%,10%);border-radius:12px;border:1px solid hsla(35,60%,40%,0.5);overflow:hidden;animation:popIn .2s ease-out;">
    <div style="padding:10px 14px 6px;background:linear-gradient(135deg,hsla(35,50%,30%,0.15),hsla(35,60%,20%,0.05));">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="font-size:16px;">📜</span>
        <span style="font-size:9px;font-family:sans-serif;padding:2px 6px;border-radius:4px;background:hsla(35,60%,40%,0.15);color:hsl(35,70%,60%);border:1px solid hsla(35,60%,40%,0.3);">Research Layer</span>
        ${precisionBadge}
      </div>
      <h3 style="margin:0;font-size:15px;color:hsl(35,70%,60%);line-height:1.3;font-weight:700;letter-spacing:0.03em;">${escapeHtml(name)}</h3>
      <p style="margin:2px 0 0;font-size:11px;color:hsl(35,45%,50%);font-style:italic;">${escapeHtml(rt.species_scientific)}</p>
      ${rt.species_common && rt.species_common !== name ? `<p style="margin:0;font-size:10px;color:hsl(35,40%,45%);">(${escapeHtml(rt.species_common)})</p>` : ""}
    </div>
    <div style="padding:6px 14px 8px;display:flex;flex-direction:column;gap:4px;">
      <p style="margin:0;font-size:10px;color:hsl(35,40%,48%);font-family:sans-serif;">📍 ${escapeHtml(rt.locality_text)}${rt.province ? `, ${escapeHtml(rt.province)}` : ""}</p>
      ${measurements ? `<p style="margin:0;font-size:10px;color:hsl(0,0%,55%);font-family:sans-serif;">${measurements}</p>` : ""}
      ${desc}
      <div style="margin-top:6px;padding:6px 8px;background:hsla(35,40%,20%,0.3);border-radius:6px;border:1px solid hsla(35,40%,30%,0.2);">
        <p style="margin:0;font-size:9px;color:hsl(35,50%,55%);font-family:sans-serif;line-height:1.4;">
          <strong>Lineage:</strong> This is a Research Layer record from ${escapeHtml(rt.source_program)}. It becomes an Ancient Friend only after a wanderer verifies it in person.
        </p>
        <p style="margin:4px 0 0;font-size:9px;color:hsl(35,40%,48%);font-family:sans-serif;">
          📄 <a href="${escapeHtml(rt.source_doc_url)}" target="_blank" rel="noopener" style="color:hsl(35,60%,55%);text-decoration:underline;">${escapeHtml(rt.source_doc_title)}</a> (${rt.source_doc_year})
        </p>
      </div>
    </div>
    <div style="padding:0 14px 12px;display:flex;flex-direction:column;gap:6px;">
      <a href="/tree/research/${encodeURIComponent(rt.id)}" style="display:flex;align-items:center;justify-content:center;padding:9px 0;font-size:12px;color:hsl(25,15%,8%);background:linear-gradient(135deg,hsl(35,70%,45%),hsl(40,80%,55%));border-radius:8px;text-decoration:none;letter-spacing:0.04em;font-weight:700;font-family:sans-serif;">🌳 View Ancient Friend Page</a>
      <a href="/map?tree=${encodeURIComponent(rt.id)}&treeId=${encodeURIComponent(rt.id)}&lat=${rt.latitude}&lng=${rt.longitude}&zoom=18&arrival=tree&journey=1&research=on" style="display:flex;align-items:center;justify-content:center;padding:7px 0;font-size:11px;color:hsl(35,60%,55%);background:hsla(35,40%,20%,0.3);border-radius:8px;text-decoration:none;letter-spacing:0.04em;font-weight:600;font-family:sans-serif;border:1px solid hsla(35,60%,40%,0.3);">🔍 Verify This Tree In Person</a>
      <button onclick="window.dispatchEvent(new CustomEvent('s33d-whisper-research',{detail:{treeId:'${encodeURIComponent(rt.id)}',treeName:'${escapeHtml(name).replace(/'/g, "\\'")}',species:'${escapeHtml(rt.species_scientific).replace(/'/g, "\\'")}'}}));this.closest('.leaflet-popup').querySelector('.leaflet-popup-close-button')?.click();" style="display:flex;align-items:center;justify-content:center;padding:7px 0;font-size:11px;color:hsl(120,40%,55%);background:hsla(120,30%,20%,0.2);border-radius:8px;cursor:pointer;letter-spacing:0.04em;font-weight:600;font-family:sans-serif;border:1px solid hsla(120,40%,35%,0.3);width:100%;">💨 Whisper to this Tree</button>
    </div>
  </div>`;
}

export function buildRootstonePopupHtml(stone: Rootstone): string {
  const title = escapeHtml(stone.name);
  const lore = escapeHtml(stone.lore);
  const place = escapeHtml(stone.location.place || stone.country);
  const sourceName = escapeHtml(stone.source.name);
  const sourceUrl = escapeHtml(stone.source.url);
  const mapsUrl = stone.location.mapsUrl ? escapeHtml(stone.location.mapsUrl) : "";
  const tags = stone.tags.slice(0, 5).map((tag) => `#${escapeHtml(tag)}`).join(" ");
  const badge = stone.type === "tree" ? "🌳 Rootstone Tree" : "🌲 Rootstone Grove";

  return `<div style="padding:0;font-family:'Cinzel',serif;width:260px;background:hsl(28,16%,10%);border-radius:12px;border:1.5px solid hsla(42,70%,45%,0.45);overflow:hidden;">
    <div style="padding:10px 14px 6px;background:linear-gradient(135deg,hsla(42,45%,24%,0.18),hsla(42,55%,16%,0.06));">
      <span style="font-size:9px;font-family:sans-serif;padding:2px 6px;border-radius:4px;background:hsla(42,80%,50%,0.15);color:hsl(42,80%,60%);border:1px solid hsla(42,80%,50%,0.3);">${badge}</span>
      <h3 style="margin:6px 0 2px;font-size:14px;color:hsl(42,80%,60%);line-height:1.35;">${title}</h3>
      <p style="margin:0;font-size:11px;color:hsl(42,45%,52%);font-family:sans-serif;">${place}</p>
    </div>
    <div style="padding:8px 14px 10px;display:flex;flex-direction:column;gap:6px;">
      <p style="margin:0;font-size:11px;color:hsl(0,0%,75%);font-family:sans-serif;line-height:1.45;white-space:pre-line;">${lore}</p>
      <p style="margin:0;font-size:10px;color:hsl(42,45%,52%);font-family:sans-serif;">${tags}</p>
      <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:hsl(190,60%,65%);text-decoration:none;font-family:sans-serif;">Source: ${sourceName}</a>
      ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:hsl(145,55%,60%);text-decoration:none;font-family:sans-serif;">Open maps ↗</a>` : ""}
    </div>
  </div>`;
}
