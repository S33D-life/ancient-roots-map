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

    // Plant seed button
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
