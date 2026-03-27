/**
 * HeartwoodRoomPage — Route handler for /library/:room.
 * Lazy-loads each room component inside the shared HeartwoodRoomShell.
 * Each room is a distinct chamber — not a tab in a monolith.
 */
import { lazy, Suspense, useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import HeartwoodRoomShell from "@/components/library/HeartwoodRoomShell";
import { supabase } from "@/integrations/supabase/client";

// Lazy room components — each loads independently
const StaffRoomGallery = lazy(() => import("@/components/StaffRoomGallery"));
const EarthRadioRoom = lazy(() => import("@/components/EarthRadioRoom"));
const Greenhouse = lazy(() => import("@/components/Greenhouse"));
const WishingTreeUnified = lazy(() => import("@/components/WishingTreeUnified"));
const SeedCellarRoom = lazy(() => import("@/components/library/SeedCellarRoom"));
const ScrollsRoom = lazy(() => import("@/components/library/ScrollsRoom"));
const VaultRoom = lazy(() => import("@/components/library/VaultRoom"));
const AncientFriendsRoom = lazy(() => import("@/components/library/AncientFriendsRoom"));
const PersonalBookshelf = lazy(() => import("@/components/PersonalBookshelf"));
const CreatorsPath = lazy(() => import("@/components/CreatorsPath"));
const TreeResources = lazy(() => import("@/components/TreeResources"));
const CycleMarketRoom = lazy(() => import("@/components/CycleMarketRoom"));
const DevRoom = lazy(() => import("@/components/library/DevRoom"));

// Room aliases for backward compatibility
const ROOM_ALIASES: Record<string, string> = {
  "ancient-friends": "gallery",
  "resources": "creators-path",
  "tree-resources": "creators-path",
  "tree-data-commons": "redirect:/tree-data-commons",
  "wishing-tree": "wishlist",
  "ledger": "scrolls",
  "volumes": "scrolls",
  "archive": "scrolls",
  "markets": "rhythms",
  "cycle-market": "rhythms",
  "cycle-markets": "rhythms",
};

const ROOM_LABELS: Record<string, string> = {
  "staff-room": "Staff Room",
  "gallery": "Ancient Friends",
  "music-room": "Music Room",
  "greenhouse": "Greenhouse",
  "wishlist": "Wishing Tree",
  "seed-cellar": "Seed Cellar",
  "creators-path": "Creator's Path",
  "scrolls": "Scrolls & Records",
  "vault": "Vaults",
  "bookshelf": "Bookshelf",
  "rhythms": "Rhythms",
  "tap-root": "Dev Room",
};

/** Ordered room sequence for swipe navigation */
const ROOM_SEQUENCE = [
  "gallery",
  "staff-room",
  "bookshelf",
  "seed-cellar",
  "music-room",
  "greenhouse",
  "wishlist",
  "scrolls",
  "vault",
  "creators-path",
  "rhythms",
  "tap-root",
];

const VALID_ROOMS = Object.keys(ROOM_LABELS);

/**
 * AncientFriendsWrapper — self-contained wrapper that fetches its own data.
 */
function AncientFriendsWrapper() {
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [tribeUserIds, setTribeUserIds] = useState<string[]>([]);
  const [treesWithStaff, setTreesWithStaff] = useState<Record<string, string[]>>({});
  const [staffCodes, setStaffCodes] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const [treesRes, userRes] = await Promise.all([
        supabase.from("trees").select("*").order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ]);
      setTrees(treesRes.data || []);
      setLoading(false);

      const user = userRes.data.user;
      if (user) {
        setCurrentUserId(user.id);
        const [followsRes, companionsRes, staffRes] = await Promise.all([
          supabase.from("follows").select("following_id").eq("follower_id", user.id),
          supabase.from("grove_companions").select("requester_id, recipient_id")
            .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq("status", "accepted"),
          supabase.from("offerings").select("sealed_by_staff, tree_id").not("sealed_by_staff", "is", null),
        ]);
        const ids = new Set<string>();
        followsRes.data?.forEach(f => ids.add(f.following_id));
        companionsRes.data?.forEach(c => ids.add(c.requester_id === user.id ? c.recipient_id : c.requester_id));
        setTribeUserIds(Array.from(ids));

        const codes = new Set<string>();
        const map: Record<string, string[]> = {};
        (staffRes.data || []).forEach((o: any) => {
          if (o.sealed_by_staff) {
            codes.add(o.sealed_by_staff);
            if (!map[o.tree_id]) map[o.tree_id] = [];
            if (!map[o.tree_id].includes(o.sealed_by_staff)) map[o.tree_id].push(o.sealed_by_staff);
          }
        });
        setStaffCodes(Array.from(codes).sort());
        setTreesWithStaff(map);
      }
    };
    load();
  }, []);

  return (
    <AncientFriendsRoom
      trees={trees}
      loading={loading}
      currentUserId={currentUserId}
      tribeUserIds={tribeUserIds}
      treesWithStaff={treesWithStaff}
      staffCodes={staffCodes}
      onSelectTree={(tree) => navigate(`/tree/${tree.id}`)}
    />
  );
}

/**
 * CreatorsPathWrapper — self-contained wrapper.
 */
function CreatorsPathWrapper() {
  const [userId, setUserId] = useState<string | undefined>();
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);
  return (
    <div className="space-y-6">
      <CreatorsPath userId={userId} />
      <TreeResources />
    </div>
  );
}

/**
 * BookshelfWrapper — self-contained wrapper.
 */
function BookshelfWrapper() {
  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);
  return <PersonalBookshelf userId={userId} />;
}

const HeartwoodRoomPage = () => {
  const { room: rawRoom } = useParams<{ room: string }>();
  const navigate = useNavigate();
  const resolvedRoom = rawRoom ? (ROOM_ALIASES[rawRoom] || rawRoom) : null;

  // Handle redirect aliases (e.g. tree-data-commons → /tree-data-commons)
  if (resolvedRoom?.startsWith("redirect:")) {
    return <Navigate to={resolvedRoom.slice(9)} replace />;
  }

  if (!resolvedRoom || !VALID_ROOMS.includes(resolvedRoom)) {
    return <Navigate to="/library" replace />;
  }

  const label = ROOM_LABELS[resolvedRoom] || resolvedRoom;

  const handleRoomNavigate = (room: string) => {
    navigate(`/library/${room}`, { replace: true });
  };

  return (
    <HeartwoodRoomShell
      roomLabel={label}
      currentRoom={resolvedRoom}
      roomSequence={ROOM_SEQUENCE}
      roomLabels={ROOM_LABELS}
      onNavigateRoom={handleRoomNavigate}
    >
      <Suspense fallback={<PageSkeleton variant="default" />}>
        {resolvedRoom === "staff-room" && <StaffRoomGallery />}
        {resolvedRoom === "music-room" && <EarthRadioRoom />}
        {resolvedRoom === "greenhouse" && <Greenhouse />}
        {resolvedRoom === "wishlist" && <WishingTreeUnified />}
        {resolvedRoom === "seed-cellar" && <SeedCellarRoom />}
        {resolvedRoom === "scrolls" && <ScrollsRoom />}
        {resolvedRoom === "vault" && <VaultRoom />}
        {resolvedRoom === "gallery" && <AncientFriendsWrapper />}
        {resolvedRoom === "bookshelf" && <BookshelfWrapper />}
        {resolvedRoom === "creators-path" && <CreatorsPathWrapper />}
        {resolvedRoom === "rhythms" && <CycleMarketRoom />}
        {resolvedRoom === "tap-root" && <DevRoom />}
      </Suspense>
    </HeartwoodRoomShell>
  );
};

export default HeartwoodRoomPage;
