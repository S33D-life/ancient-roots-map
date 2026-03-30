/**
 * Hooks for the Seed Library directory.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export interface SeedLibrary {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  contact_link: string | null;
  library_type: string;
  description: string | null;
  photo_url: string | null;
  status: string;
  verification_status: string;
  is_featured: boolean;
  verification_count: number;
  testimonial_count: number;
  last_community_activity: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeedLibraryVerification {
  id: string;
  library_id: string;
  user_id: string;
  verification_type: string;
  note: string | null;
  verified_date: string | null;
  created_at: string;
}

export interface SeedLibraryTestimonial {
  id: string;
  library_id: string;
  user_id: string;
  content: string;
  display_name: string | null;
  is_anonymous: boolean;
  photo_url: string | null;
  created_at: string;
}

export interface SeedLibraryFilters {
  search?: string;
  country?: string;
  libraryType?: string;
  verificationStatus?: string;
  hasTestimonials?: boolean;
  recentlyUpdated?: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) + "-" + Date.now().toString(36);
}

export function useSeedLibraries(filters: SeedLibraryFilters = {}) {
  return useQuery({
    queryKey: ["seed-libraries", filters],
    queryFn: async () => {
      let query = supabase
        .from("seed_libraries")
        .select("*")
        .eq("is_hidden", false)
        .neq("status", "hidden")
        .order("is_featured", { ascending: false })
        .order("verification_count", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters.country) {
        query = query.eq("country", filters.country);
      }
      if (filters.libraryType) {
        query = query.eq("library_type", filters.libraryType);
      }
      if (filters.verificationStatus) {
        query = query.eq("verification_status", filters.verificationStatus);
      }
      if (filters.hasTestimonials) {
        query = query.gt("testimonial_count", 0);
      }
      if (filters.recentlyUpdated) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("updated_at", thirtyDaysAgo);
      }
      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data ?? []) as SeedLibrary[];
    },
  });
}

export function useSeedLibrary(slug: string | undefined) {
  return useQuery({
    queryKey: ["seed-library", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("seed_libraries")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as SeedLibrary | null;
    },
    enabled: !!slug,
  });
}

export function useSeedLibraryVerifications(libraryId: string | undefined) {
  return useQuery({
    queryKey: ["seed-library-verifications", libraryId],
    queryFn: async () => {
      if (!libraryId) return [];
      const { data, error } = await supabase
        .from("seed_library_verifications")
        .select("*")
        .eq("library_id", libraryId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SeedLibraryVerification[];
    },
    enabled: !!libraryId,
  });
}

export function useSeedLibraryTestimonials(libraryId: string | undefined) {
  return useQuery({
    queryKey: ["seed-library-testimonials", libraryId],
    queryFn: async () => {
      if (!libraryId) return [];
      const { data, error } = await supabase
        .from("seed_library_testimonials")
        .select("*")
        .eq("library_id", libraryId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SeedLibraryTestimonial[];
    },
    enabled: !!libraryId,
  });
}

export function useSubmitSeedLibrary() {
  const qc = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      country: string;
      city?: string;
      region?: string;
      website?: string;
      contact_link?: string;
      library_type?: string;
      description?: string;
    }) => {
      if (!userId) throw new Error("Must be signed in");
      const slug = generateSlug(input.name);
      const { data, error } = await supabase
        .from("seed_libraries")
        .insert({
          slug,
          name: input.name,
          country: input.country,
          city: input.city || null,
          region: input.region || null,
          website: input.website || null,
          contact_link: input.contact_link || null,
          library_type: input.library_type || "seed_library",
          description: input.description || null,
          status: "pending",
          verification_status: "unverified",
          submitted_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Seed library submitted for review");
      qc.invalidateQueries({ queryKey: ["seed-libraries"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddVerification() {
  const qc = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      library_id: string;
      verification_type: string;
      note?: string;
    }) => {
      if (!userId) throw new Error("Must be signed in");
      const { error } = await supabase
        .from("seed_library_verifications")
        .insert({
          library_id: input.library_id,
          user_id: userId,
          verification_type: input.verification_type,
          note: input.note || null,
        });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success("Verification added — thank you!");
      qc.invalidateQueries({ queryKey: ["seed-library-verifications", vars.library_id] });
      qc.invalidateQueries({ queryKey: ["seed-libraries"] });
    },
    onError: (e: Error) => {
      if (e.message.includes("duplicate")) {
        toast.error("You've already verified this library");
      } else {
        toast.error(e.message);
      }
    },
  });
}

export function useAddTestimonial() {
  const qc = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      library_id: string;
      content: string;
      display_name?: string;
      is_anonymous?: boolean;
    }) => {
      if (!userId) throw new Error("Must be signed in");
      const { error } = await supabase
        .from("seed_library_testimonials")
        .insert({
          library_id: input.library_id,
          user_id: userId,
          content: input.content,
          display_name: input.display_name || null,
          is_anonymous: input.is_anonymous ?? false,
        });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success("Testimonial shared — thank you!");
      qc.invalidateQueries({ queryKey: ["seed-library-testimonials", vars.library_id] });
      qc.invalidateQueries({ queryKey: ["seed-libraries"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Distinct countries from existing libraries */
export function useSeedLibraryCountries() {
  return useQuery({
    queryKey: ["seed-library-countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seed_libraries")
        .select("country")
        .eq("is_hidden", false)
        .neq("status", "hidden");
      if (error) throw error;
      const countries = [...new Set((data ?? []).map((d: any) => d.country))].sort();
      return countries as string[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** All libraries for curator moderation (including hidden/pending) */
export function useSeedLibrariesAdmin() {
  return useQuery({
    queryKey: ["seed-libraries-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seed_libraries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as SeedLibrary[];
    },
  });
}

export function useUpdateSeedLibrary() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("seed_libraries")
        .update(input.updates)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Library updated");
      qc.invalidateQueries({ queryKey: ["seed-libraries"] });
      qc.invalidateQueries({ queryKey: ["seed-libraries-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
