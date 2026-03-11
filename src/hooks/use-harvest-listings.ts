import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ── Types ──────────────────────────────────────── */
export type HarvestCategory = "fruit" | "nut" | "seed" | "leaf" | "bark" | "resin" | "flower" | "bean" | "oil" | "honey" | "other";
export type AvailabilityType = "for_sale" | "for_exchange" | "free_collection" | "information";
export type HarvestStatus = "upcoming" | "available" | "finished";

export interface HarvestListing {
  id: string;
  guardian_id: string;
  tree_id: string | null;
  produce_name: string;
  description: string | null;
  category: HarvestCategory;
  photos: string[];
  availability_type: AvailabilityType;
  status: HarvestStatus;
  harvest_month_start: number | null;
  harvest_month_end: number | null;
  quantity_note: string | null;
  price_note: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  pickup_instructions: string | null;
  shipping_available: boolean;
  contact_method: string | null;
  external_link: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  guardian_name?: string;
  guardian_avatar?: string;
  tree_name?: string;
  tree_species?: string;
}

export type CreateHarvestInput = {
  produce_name: string;
  description?: string;
  category: HarvestCategory;
  tree_id?: string;
  availability_type: AvailabilityType;
  status?: HarvestStatus;
  harvest_month_start?: number;
  harvest_month_end?: number;
  quantity_note?: string;
  price_note?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  pickup_instructions?: string;
  shipping_available?: boolean;
  contact_method?: string;
  external_link?: string;
  photos?: string[];
};

/* ── Constants ──────────────────────────────────── */
export const CATEGORY_LABELS: Record<HarvestCategory, { label: string; emoji: string }> = {
  fruit: { label: "Fruit", emoji: "🍎" },
  nut: { label: "Nut", emoji: "🥜" },
  seed: { label: "Seed", emoji: "🌱" },
  leaf: { label: "Leaf", emoji: "🍃" },
  bark: { label: "Bark", emoji: "🪵" },
  resin: { label: "Resin", emoji: "💧" },
  flower: { label: "Flower", emoji: "🌸" },
  bean: { label: "Bean", emoji: "☕" },
  oil: { label: "Oil", emoji: "🫒" },
  honey: { label: "Honey", emoji: "🍯" },
  other: { label: "Other", emoji: "🌿" },
};

export const AVAILABILITY_LABELS: Record<AvailabilityType, { label: string; emoji: string }> = {
  for_sale: { label: "For Sale", emoji: "💰" },
  for_exchange: { label: "For Exchange", emoji: "🔄" },
  free_collection: { label: "Free Collection", emoji: "🤲" },
  information: { label: "Information Only", emoji: "ℹ️" },
};

export const STATUS_LABELS: Record<HarvestStatus, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: "text-amber-600" },
  available: { label: "Available", color: "text-emerald-600" },
  finished: { label: "Finished", color: "text-muted-foreground" },
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Queries ────────────────────────────────────── */
async function fetchListings(filters?: { category?: string; status?: string; availability?: string }) {
  let q = supabase
    .from("harvest_listings" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.category && filters.category !== "all") {
    q = q.eq("category", filters.category);
  }
  if (filters?.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  if (filters?.availability && filters.availability !== "all") {
    q = q.eq("availability_type", filters.availability);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as unknown as HarvestListing[];
}

async function fetchListingById(id: string) {
  const { data, error } = await supabase
    .from("harvest_listings" as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Harvest listing not found");
  return data as unknown as HarvestListing;
}

async function fetchMyListings(userId: string) {
  const { data, error } = await supabase
    .from("harvest_listings" as any)
    .select("*")
    .eq("guardian_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as HarvestListing[];
}

async function createListing(input: CreateHarvestInput & { guardian_id: string }) {
  const { data, error } = await supabase
    .from("harvest_listings" as any)
    .insert(input as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as HarvestListing;
}

async function deleteListing(id: string) {
  const { error } = await supabase
    .from("harvest_listings" as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/* ── Hooks ──────────────────────────────────────── */
export function useHarvestListings(filters?: { category?: string; status?: string; availability?: string }) {
  return useQuery({
    queryKey: ["harvest-listings", filters],
    queryFn: () => fetchListings(filters),
    staleTime: 60_000,
  });
}

export function useHarvestListing(id: string | undefined) {
  return useQuery({
    queryKey: ["harvest-listing", id],
    queryFn: () => fetchListingById(id!),
    enabled: !!id,
  });
}

export function useMyHarvestListings(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-harvest-listings", userId],
    queryFn: () => fetchMyListings(userId!),
    enabled: !!userId,
  });
}

export function useCreateHarvestListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["harvest-listings"] });
      qc.invalidateQueries({ queryKey: ["my-harvest-listings"] });
    },
  });
}

export function useDeleteHarvestListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["harvest-listings"] });
      qc.invalidateQueries({ queryKey: ["my-harvest-listings"] });
    },
  });
}
