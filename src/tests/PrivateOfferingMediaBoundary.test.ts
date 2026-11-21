/** Synthetic contract examples only. Real RLS/object/role authority is exercised
 * in scripts/audit-tests/grove.mjs against PostgreSQL, not established by mirrors.
 */
import { describe, it, expect } from "vitest";
import { privateObjectPath } from "../../supabase/functions/offering-media/objectPath";
import { isPrivateOfferingMedia, bucketForVisibility } from "@/utils/offeringMedia";

const BASE = "https://example.supabase.co/storage/v1/object/public";

// ── Mirror of storage.objects SELECT policy on offerings-private ──
function storageSelectAllowed(callerId: string | null, objectPath: string): boolean {
  if (!callerId) return false;
  const offering=world.offerings.find(o=>o.mediaUrl?.endsWith("/offerings-private/"+objectPath));
  return !!offering && canViewOffering(world,offering.id,callerId);
}

// ── Mirror of public.can_view_life_grove_offering() ───────────────
interface Offering {
  id: string;
  contributorId: string;
  groveId: string;
  visibility: "public" | "private" | "family_only" | "tribe";
  hidden?: boolean;
  mediaUrl: string | null;
}
interface World {
  offerings: Offering[];
  groves: Record<string, { privacy: "public" | "private" }>;
  /** grove id -> active member/steward user ids */
  members: Record<string, string[]>;
}

function canViewOffering(world: World, offeringId: string, userId: string | null): boolean {
  const o = world.offerings.find((x) => x.id === offeringId);
  if (!o || o.hidden) return false;
  if (world.groves[o.groveId]?.privacy === "public" && o.visibility === "public") return true;
  return !!userId && (world.members[o.groveId] ?? []).includes(userId) && (o.visibility === "family_only" || o.contributorId === userId);
}

/** Mirror of the offering-media function's request handling. */
function requestMedia(
  world: World,
  args: { callerId: string | null; offeringId?: string; objectPath?: string },
): { status: number; signedPath?: string } {
  if (!args.offeringId || !/^[0-9a-f-]{36}$/i.test(args.offeringId)) return { status: 400 };
  if (!canViewOffering(world, args.offeringId, args.callerId)) return { status: 403 };
  // Path comes from the record, never from the caller.
  const o = world.offerings.find((x) => x.id === args.offeringId)!;
  const path=privateObjectPath(o.mediaUrl,o.contributorId,o.groveId);
  return path ? {status:200,signedPath:path} : {status:404};
}

const OWNER = "11111111-1111-1111-1111-111111111111";
const FAMILY = "22222222-2222-2222-2222-222222222222";
const STRANGER = "33333333-3333-3333-3333-333333333333";
const PRIVATE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const PUBLIC_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const PRIVATE_PATH = `${OWNER}/grove-1/1700000000.jpg`;

const world: World = {
  groves: { "grove-1": { privacy: "private" }, "grove-2": { privacy: "public" } },
  members: { "grove-1": [OWNER, FAMILY] },
  offerings: [
    {
      id: PRIVATE_ID,
      contributorId: OWNER,
      groveId: "grove-1",
      visibility: "family_only",
      mediaUrl: `${BASE}/offerings-private/${PRIVATE_PATH}`,
    },
    {
      id: PUBLIC_ID,
      contributorId: OWNER,
      groveId: "grove-2",
      visibility: "public",
      mediaUrl: `${BASE}/offerings/${OWNER}/grove-2/pub.jpg`,
    },
  ],
};

describe("Private offering media — who may obtain a link", () => {
  it("refuses an anonymous viewer", () => {
    expect(requestMedia(world, { callerId: null, offeringId: PRIVATE_ID }).status).toBe(403);
    expect(storageSelectAllowed(null, PRIVATE_PATH)).toBe(false);
  });

  it("refuses an unrelated signed-in viewer even with the exact object path", () => {
    expect(requestMedia(world, { callerId: STRANGER, offeringId: PRIVATE_ID }).status).toBe(403);
    expect(storageSelectAllowed(STRANGER, PRIVATE_PATH)).toBe(false);
  });

  it("lets the owner read their own upload", () => {
    expect(requestMedia(world, { callerId: OWNER, offeringId: PRIVATE_ID }).status).toBe(200);
    expect(storageSelectAllowed(OWNER, PRIVATE_PATH)).toBe(true);
  });

  it("lets an authorised family/tribe viewer through the checked path", () => {
    const res = requestMedia(world, { callerId: FAMILY, offeringId: PRIVATE_ID });
    expect(res.status).toBe(200);
    expect(res.signedPath).toBe(PRIVATE_PATH);
    // Direct storage also requires the exact authorised memory.
    expect(storageSelectAllowed(FAMILY, PRIVATE_PATH)).toBe(true);
  });

  it("refuses a family/tribe viewer who is not a member of that circle", () => {
    const revoked: World = { ...world, members: { "grove-1": [OWNER] } };
    expect(requestMedia(revoked, { callerId: FAMILY, offeringId: PRIVATE_ID }).status).toBe(403);
  });

  it("refuses a hidden offering", () => {
    const hidden: World = {
      ...world,
      offerings: world.offerings.map((o) => (o.id === PRIVATE_ID ? { ...o, hidden: true } : o)),
    };
    expect(requestMedia(hidden, { callerId: FAMILY, offeringId: PRIVATE_ID }).status).toBe(403);
  });
});

describe("Private offering media — caller-supplied paths are never trusted", () => {
  it("ignores an arbitrary object path and rejects the request without an offering id", () => {
    expect(
      requestMedia(world, { callerId: STRANGER, objectPath: PRIVATE_PATH }).status,
    ).toBe(400);
  });

  it("signs only the path recorded on the authorised offering", () => {
    const res = requestMedia(world, {
      callerId: FAMILY,
      offeringId: PRIVATE_ID,
      objectPath: `${STRANGER}/somebody-elses.jpg`,
    });
    expect(res.signedPath).toBe(PRIVATE_PATH);
  });
});

describe("Public offering media is unchanged", () => {
  it("keeps public visibility on the public bucket", () => {
    expect(bucketForVisibility("public")).toBe("offerings");
    expect(bucketForVisibility(null)).toBe("offerings");
    expect(bucketForVisibility("family_only")).toBe("offerings-private");
  });

  it("needs no signing for public media", () => {
    const pub = world.offerings.find((o) => o.id === PUBLIC_ID)!;
    expect(isPrivateOfferingMedia(pub.mediaUrl)).toBe(false);
    expect(canViewOffering(world, PUBLIC_ID, null)).toBe(true);
  });
});

describe("Exact audiences",()=>{
 it("does not let a family member read Only me",()=>{const privateWorld:World={...world,offerings:world.offerings.map(o=>o.id===PRIVATE_ID?{...o,visibility:"private"}:o)};expect(requestMedia(privateWorld,{callerId:FAMILY,offeringId:PRIVATE_ID}).status).toBe(403);expect(requestMedia(privateWorld,{callerId:OWNER,offeringId:PRIVATE_ID}).status).toBe(200);});
 it("permits anonymous signing only for the explicitly public memory",()=>{const publicWorld:World={...world,offerings:world.offerings.map(o=>o.id===PUBLIC_ID?{...o,mediaUrl:`${BASE}/offerings-private/${OWNER}/grove-2/pub.jpg`}:o)};expect(requestMedia(publicWorld,{callerId:null,offeringId:PUBLIC_ID}).status).toBe(200);expect(requestMedia(publicWorld,{callerId:null,offeringId:PRIVATE_ID}).status).toBe(403);});
});
