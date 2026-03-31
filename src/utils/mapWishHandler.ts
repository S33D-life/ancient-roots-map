/**
 * mapWishHandler — Handles popup wish-star, share, and plant-seed button clicks
 * via event delegation on the map container.
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Set up event delegation for popup buttons (wish + share + plant seed) */
export function setupPopupActions(container: HTMLElement): () => void {
  const handler = async (e: Event) => {
    const target = e.target as HTMLElement;

    // Wish button
    const wishBtn = target.closest<HTMLElement>("[data-wish-tree]");
    if (wishBtn) {
      e.preventDefault();
      e.stopPropagation();
      const treeId = wishBtn.dataset.wishTree;
      if (!treeId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.info("Sign in to save wishes", {
          description: "Create an account to build your wish list of Ancient Friends.",
        });
        return;
      }

      // Check if already wished
      const { data: existing } = await supabase
        .from("tree_wishlist")
        .select("id")
        .eq("tree_id", treeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Remove wish
        await supabase.from("tree_wishlist").delete().eq("id", existing.id);
        wishBtn.style.color = "hsl(42, 50%, 55%)";
        wishBtn.style.borderColor = "hsla(42, 70%, 55%, 0.25)";
        wishBtn.textContent = "⭐";
        toast("Wish removed", { description: "This tree has been removed from your wishes." });
      } else {
        // Add wish
        const { error } = await supabase.from("tree_wishlist").insert({
          tree_id: treeId,
          user_id: user.id,
        });
        if (error) {
          toast.error("Couldn't save wish");
          return;
        }
        wishBtn.style.color = "hsl(42, 90%, 60%)";
        wishBtn.style.borderColor = "hsla(42, 90%, 55%, 0.6)";
        wishBtn.style.background = "hsla(42, 50%, 20%, 0.9)";
        wishBtn.textContent = "⭐";
        toast.success("Wish saved!", { description: "This Ancient Friend has been added to your wishes." });
      }
      return;
    }

    // Check-in button
    const checkinBtn = target.closest<HTMLElement>("[data-checkin-tree]");
    if (checkinBtn) {
      e.preventDefault();
      e.stopPropagation();
      const treeId = checkinBtn.dataset.checkinTree;
      if (!treeId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.info("Sign in to check in");
        return;
      }

      checkinBtn.style.opacity = "0.5";
      checkinBtn.style.pointerEvents = "none";
      checkinBtn.textContent = "⏳ Checking in...";

      try {
        const month = new Date().getMonth();
        const seasonMap: Record<number, string> = { 0: "bare", 1: "bare", 2: "bud", 3: "bud", 4: "leaf", 5: "blossom", 6: "leaf", 7: "leaf", 8: "fruit", 9: "fruit", 10: "bare", 11: "bare" };

        const { error } = await supabase.from("tree_checkins").insert({
          tree_id: treeId,
          user_id: user.id,
          season_stage: seasonMap[month] || "other",
          checkin_method: "manual",
          privacy: "public",
          canopy_proof: false,
        });

        if (error) throw error;

        checkinBtn.textContent = "✓ Checked In";
        checkinBtn.style.opacity = "1";
        checkinBtn.style.background = "hsla(142,40%,30%,0.4)";
        checkinBtn.style.borderColor = "hsla(142,50%,50%,0.5)";
        toast.success("🌳 Checked in!", { description: checkinBtn.dataset.treeName || "Visit recorded" });
      } catch {
        toast.error("Check-in failed");
        checkinBtn.style.opacity = "1";
        checkinBtn.style.pointerEvents = "auto";
        checkinBtn.textContent = "📍 Check In";
      }
      return;
    }

    const seedBtn = target.closest<HTMLElement>("[data-plant-seed]");
    if (seedBtn) {
      e.preventDefault();
      e.stopPropagation();
      const treeId = seedBtn.dataset.plantSeed;
      const treeLat = parseFloat(seedBtn.dataset.treeLat || "");
      const treeLng = parseFloat(seedBtn.dataset.treeLng || "");
      if (!treeId || isNaN(treeLat) || isNaN(treeLng)) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.info("Sign in to plant seeds");
        return;
      }

      // Disable button while planting
      seedBtn.style.opacity = "0.5";
      seedBtn.style.pointerEvents = "none";
      seedBtn.textContent = "⏳ Planting...";

      try {
        // Check proximity
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        const R = 6371000;
        const dLat = ((treeLat - position.coords.latitude) * Math.PI) / 180;
        const dLon = ((treeLng - position.coords.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((position.coords.latitude * Math.PI) / 180) *
          Math.cos((treeLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        if (dist > 100) {
          toast.error("Move closer to plant a seed", { description: "You need to be within 100m of this tree." });
          seedBtn.style.opacity = "1";
          seedBtn.style.pointerEvents = "auto";
          seedBtn.textContent = "🌱 Plant Seed";
          return;
        }

        const { error } = await supabase.from("planted_seeds").insert({
          planter_id: user.id,
          tree_id: treeId,
          latitude: treeLat,
          longitude: treeLng,
        });

        if (error) {
          toast.error("Couldn't plant seed");
          seedBtn.style.opacity = "1";
          seedBtn.style.pointerEvents = "auto";
          seedBtn.textContent = "🌱 Plant Seed";
          return;
        }

        seedBtn.textContent = "🌱 Planted!";
        seedBtn.style.opacity = "1";
        seedBtn.style.background = "hsla(120,40%,30%,0.4)";
        seedBtn.style.borderColor = "hsla(120,50%,50%,0.5)";
        toast.success("Seed planted 🌱", { description: "It carries 33 hearts — blooming in 24 hours." });
      } catch {
        toast.error("Location required to plant a seed");
        seedBtn.style.opacity = "1";
        seedBtn.style.pointerEvents = "auto";
        seedBtn.textContent = "🌱 Plant Seed";
      }
      return;
    }

    // Collect hearts button
    const heartsBtn = target.closest<HTMLElement>("[data-collect-hearts]");
    if (heartsBtn) {
      e.preventDefault();
      e.stopPropagation();
      const treeId = heartsBtn.dataset.collectHearts;
      if (!treeId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.info("Sign in to collect hearts");
        return;
      }

      heartsBtn.style.opacity = "0.5";
      heartsBtn.style.pointerEvents = "none";
      heartsBtn.textContent = "⏳ Collecting...";

      try {
        const { data, error } = await supabase.rpc("claim_windfall_hearts", {
          p_tree_id: treeId,
          p_user_id: user.id,
        });
        if (error) throw error;
        const amount = typeof data === "number" ? data : 0;
        if (amount > 0) {
          heartsBtn.textContent = `✨ ${amount} hearts collected!`;
          heartsBtn.style.opacity = "1";
          heartsBtn.style.background = "hsl(120,50%,40%,0.15)";
          heartsBtn.style.borderColor = "hsl(120,40%,45%,0.3)";
          toast.success(`You collected ${amount} heart${amount !== 1 ? "s" : ""}!`, { icon: "💚" });
          window.dispatchEvent(new CustomEvent("s33d-hearts-earned", { detail: { amount } }));
        } else {
          heartsBtn.textContent = "No hearts ready yet";
          heartsBtn.style.opacity = "1";
          toast("No hearts ready to collect yet", { icon: "🌳" });
        }
      } catch {
        heartsBtn.textContent = "💚 Try again";
        heartsBtn.style.opacity = "1";
        heartsBtn.style.pointerEvents = "auto";
        toast.error("Could not collect hearts");
      }
      return;
    }

    // Share button
    const shareBtn = target.closest<HTMLElement>("[data-share-tree]");
    if (shareBtn) {
      e.preventDefault();
      e.stopPropagation();
      const treeId = shareBtn.dataset.shareTree;
      if (!treeId) return;

      const url = `${window.location.origin}/tree/${treeId}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: "Meet this Ancient Friend", url });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied!", { description: "Share this tree with a friend." });
        }
      } catch {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied!");
        } catch {
          toast.error("Couldn't copy link");
        }
      }
    }
  };

  container.addEventListener("click", handler);
  return () => container.removeEventListener("click", handler);
}
