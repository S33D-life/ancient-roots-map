import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export type SeedUseCategory = "food" | "medicinal" | "tree" | "wild";

export interface SeedGrowthStage {
  stage: string;
  label: string;
  description: string;
}

export interface SeedRelationshipNotes {
  pollinators?: string;
  soil?: string;
  uses?: string;
  companions?: string;
}

export interface SeedLifeEntry {
  id: string;
  slug: string;
  common_name: string;
  latin_name: string | null;
  origin_label: string | null;
  species_group: string;
  use_category: string;
  region_label: string | null;
  description: string | null;
  image_path: string | null;
  image_thumb_path: string | null;
  image_alt: string | null;
  image_credit: string | null;
  seed_size: string | null;
  germination_notes: string | null;
  storage_notes: string | null;
  archive_link: string | null;
  growth_journey: SeedGrowthStage[];
  relationship_notes: SeedRelationshipNotes;
  verification_status: string;
  validation_count: number;
  status: string;
  is_featured: boolean;
  is_hidden: boolean;
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

export interface SeedLifeGuardian {
  id: string;
  seed_id: string;
  library_id: string | null;
  pod_name: string | null;
  relationship_type: string;
  note: string | null;
  created_at: string;
  library?: {
    id: string;
    slug: string;
    name: string;
    country: string;
    region: string | null;
    city: string | null;
  } | null;
}

export interface SeedLifeNote {
  id: string;
  seed_id: string;
  user_id: string;
  title: string | null;
  content: string;
  cultivation_stage: string | null;
  is_hidden: boolean;
  validation_count: number;
  created_at: string;
  updated_at: string;
}

export interface SeedLifeFilters {
  search?: string;
  species?: string;
  useCategory?: string;
  region?: string;
}

export interface SeedLifeFilterOptions {
  species: string[];
  uses: string[];
  regions: string[];
}

export interface SeedLifeValidationSummary {
  count: number;
  validatedByCurrentUser: boolean;
}

function generateSlug(name: string): string {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72)}-${Date.now().toString(36)}`;
}

function normaliseEntry(row: any): SeedLifeEntry {
  return {
    ...row,
    archive_link: row.archive_link ?? null,
    growth_journey: Array.isArray(row.growth_journey) ? row.growth_journey : [],
    relationship_notes:
      row.relationship_notes && typeof row.relationship_notes === "object" ? row.relationship_notes : {},
  } as SeedLifeEntry;
}

function sanitiseFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function getSeedLifeImageUrl(path: string | null | undefined) {
  if (!path) return null;
  const { data } = supabase.storage.from("seed-life-gallery").getPublicUrl(path);
  return data.publicUrl;
}

export function useSeedLifeEntries(filters: SeedLifeFilters = {}) {
  return useQuery({
    queryKey: ["seed-life-entries", filters],
    queryFn: async () => {
      let query = (supabase.from as any)(
        "seed_life_entries",
      )
        .select("*")
        .order("is_featured", { ascending: false })
        .order("validation_count", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters.species) query = query.eq("species_group", filters.species);
      if (filters.useCategory) query = query.eq("use_category", filters.useCategory);
      if (filters.region) query = query.eq("region_label", filters.region);
      if (filters.search) {
        const safe = filters.search.replace(/[,%]/g, " ").trim();
        if (safe) query = query.or(`common_name.ilike.%${safe}%,latin_name.ilike.%${safe}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data ?? []).map(normaliseEntry);
    },
  });
}

export function useSeedLifeFilterOptions() {
  return useQuery({
    queryKey: ["seed-life-filter-options"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("seed_life_entries")
        .select("species_group, use_category, region_label")
        .limit(300);
      if (error) throw error;

      return {
        species: [...new Set((data ?? []).map((row: any) => row.species_group).filter(Boolean))].sort(),
        uses: [...new Set((data ?? []).map((row: any) => row.use_category).filter(Boolean))].sort(),
        regions: [...new Set((data ?? []).map((row: any) => row.region_label).filter(Boolean))].sort(),
      } satisfies SeedLifeFilterOptions;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSeedLifeEntry(slug: string | undefined) {
  return useQuery({
    queryKey: ["seed-life-entry", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await (supabase.from as any)("seed_life_entries")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? normaliseEntry(data) : null;
    },
    enabled: !!slug,
  });
}

export function useSeedLifeGuardians(seedId: string | undefined) {
  return useQuery({
    queryKey: ["seed-life-guardians", seedId],
    queryFn: async () => {
      if (!seedId) return [] as SeedLifeGuardian[];
      const { data, error } = await (supabase.from as any)("seed_life_guardians")
        .select("id, seed_id, library_id, pod_name, relationship_type, note, created_at, library:seed_libraries(id, slug, name, country, region, city)")
        .eq("seed_id", seedId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SeedLifeGuardian[];
    },
    enabled: !!seedId,
  });
}

export function useSeedLifeNotes(seedId: string | undefined) {
  return useQuery({
    queryKey: ["seed-life-notes", seedId],
    queryFn: async () => {
      if (!seedId) return [] as SeedLifeNote[];
      const { data, error } = await (supabase.from as any)("seed_life_notes")
        .select("*")
        .eq("seed_id", seedId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SeedLifeNote[];
    },
    enabled: !!seedId,
  });
}

export function useSeedLifeValidationSummary(targetIds: string[]) {
  const { userId } = useCurrentUser();

  return useQuery({
    queryKey: ["seed-life-validations", userId, targetIds],
    queryFn: async () => {
      if (targetIds.length === 0) return {} as Record<string, SeedLifeValidationSummary>;
      const { data, error } = await (supabase.from as any)("seed_life_validations")
        .select("target_id, user_id")
        .in("target_id", targetIds);
      if (error) throw error;

      const summary: Record<string, SeedLifeValidationSummary> = {};
      for (const id of targetIds) {
        summary[id] = { count: 0, validatedByCurrentUser: false };
      }

      for (const row of data ?? []) {
        const current = summary[row.target_id] ?? { count: 0, validatedByCurrentUser: false };
        current.count += 1;
        if (userId && row.user_id === userId) current.validatedByCurrentUser = true;
        summary[row.target_id] = current;
      }

      return summary;
    },
    enabled: targetIds.length > 0,
  });
}

export function useCreateSeedLifeEntry() {
  const qc = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      common_name: string;
      latin_name?: string;
      origin_label?: string;
      species_group: string;
      use_category: string;
      region_label?: string;
      description?: string;
      seed_size?: string;
      germination_notes?: string;
      storage_notes?: string;
      archive_link?: string;
      image_alt?: string;
      image_credit?: string;
      image_file?: File | null;
      growthStages?: Partial<Record<"seed" | "plant" | "flower" | "fruit", string>>;
      relationshipNotes?: SeedRelationshipNotes;
      guardianLibraryId?: string;
      guardianPodName?: string;
      guardianNote?: string;
    }) => {
      if (!userId) throw new Error("Must be signed in");

      let imagePath: string | null = null;
      if (input.image_file) {
        const ext = input.image_file.name.split(".").pop() || "jpg";
        imagePath = `${userId}/${Date.now()}-${sanitiseFileName(input.common_name)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("seed-life-gallery")
          .upload(imagePath, input.image_file, {
            cacheControl: "3600",
            upsert: false,
            contentType: input.image_file.type || undefined,
          });
        if (uploadError) throw uploadError;
      }

      const growth_journey = [
        { stage: "seed", label: "Seed", description: input.growthStages?.seed?.trim() },
        { stage: "plant", label: "Plant", description: input.growthStages?.plant?.trim() },
        { stage: "flower", label: "Flower", description: input.growthStages?.flower?.trim() },
        { stage: "fruit", label: "Fruit", description: input.growthStages?.fruit?.trim() },
      ].filter((stage): stage is SeedGrowthStage => Boolean(stage.description));

      const relationship_notes: SeedRelationshipNotes = {
        pollinators: input.relationshipNotes?.pollinators?.trim() || undefined,
        soil: input.relationshipNotes?.soil?.trim() || undefined,
        uses: input.relationshipNotes?.uses?.trim() || undefined,
        companions: input.relationshipNotes?.companions?.trim() || undefined,
      };

      const slug = generateSlug(input.common_name);

      const { data, error } = await (supabase.from as any)("seed_life_entries")
        .insert({
          slug,
          common_name: input.common_name.trim(),
          latin_name: input.latin_name?.trim() || null,
          origin_label: input.origin_label?.trim() || null,
          species_group: input.species_group,
          use_category: input.use_category,
          region_label: input.region_label?.trim() || null,
          description: input.description?.trim() || null,
          image_path: imagePath,
          image_thumb_path: imagePath,
          image_alt: input.image_alt?.trim() || input.common_name.trim(),
          image_credit: input.image_credit?.trim() || null,
          seed_size: input.seed_size?.trim() || null,
          germination_notes: input.germination_notes?.trim() || null,
          storage_notes: input.storage_notes?.trim() || null,
          archive_link: input.archive_link?.trim() || null,
          growth_journey,
          relationship_notes,
          submitted_by: userId,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.guardianLibraryId || input.guardianPodName?.trim()) {
        const { error: guardianError } = await (supabase.from as any)("seed_life_guardians").insert({
          seed_id: data.id,
          library_id: input.guardianLibraryId || null,
          pod_name: input.guardianPodName?.trim() || null,
          note: input.guardianNote?.trim() || null,
          added_by: userId,
          relationship_type: "held_by",
        });
        if (guardianError) throw guardianError;
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Seed added for community review");
      qc.invalidateQueries({ queryKey: ["seed-life-entries"] });
      qc.invalidateQueries({ queryKey: ["seed-life-filter-options"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddSeedLifeNote() {
  const qc = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: { seed_id: string; title?: string; content: string; cultivation_stage?: string }) => {
      if (!userId) throw new Error("Must be signed in");
      const { error } = await (supabase.from as any)("seed_life_notes").insert({
        seed_id: input.seed_id,
        user_id: userId,
        title: input.title?.trim() || null,
        content: input.content.trim(),
        cultivation_stage: input.cultivation_stage || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success("Growing note added");
      qc.invalidateQueries({ queryKey: ["seed-life-notes", variables.seed_id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddSeedLifeValidation() {
  const qc = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: { targetType: "seed" | "note"; targetId: string; seedId: string }) => {
      if (!userId) throw new Error("Must be signed in");
      const { error } = await (supabase.from as any)("seed_life_validations").insert({
        target_type: input.targetType,
        target_id: input.targetId,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success("Validation added");
      qc.invalidateQueries({ queryKey: ["seed-life-entry"] });
      qc.invalidateQueries({ queryKey: ["seed-life-entries"] });
      qc.invalidateQueries({ queryKey: ["seed-life-notes", variables.seedId] });
      qc.invalidateQueries({ queryKey: ["seed-life-validations"] });
    },
    onError: (error: Error) => {
      if (error.message.toLowerCase().includes("duplicate") || error.message.toLowerCase().includes("unique")) {
        toast.error("You already validated this");
      } else {
        toast.error(error.message);
      }
    },
  });
}