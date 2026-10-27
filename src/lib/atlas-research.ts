import { supabase } from '@/integrations/supabase/client';
import COUNTRY_REGISTRY from '@/config/countryRegistry';

export interface AtlasCountryStats {
  country: string;
  total_research_records: number;
  research_records_with_coordinates: number;
  research_records_missing_coordinates: number;
  exact_precision_count: number;
  approximate_precision_count: number;
  unknown_precision_count: number;
  distinct_species_count: number;
  linked_ancient_friends_count: number;
  verification_task_open_count: number | null;
  verification_task_completed_count: number | null;
  source_count: number;
  data_confidence_score: number | null;
}
export const canonicalAtlasCountry = (country: string) =>
  COUNTRY_REGISTRY.find(e => e.country.toLowerCase() === country.trim().toLowerCase())?.country ?? country.trim();

const PAGE_SIZE = 500;
const MAX_RECORDS = 50_000;
// Existing public research only. Never read mapped Ancient Friends, offerings or verification tasks.
const SUMMARY_FIELDS = 'id,country,species_scientific,species_common,latitude,longitude,geo_precision,source_doc_url,source_program,source_doc_title,linked_tree_id,converted_tree_id,status';
export type ResearchSummaryRow = Pick<import('@/integrations/supabase/types').Database['public']['Tables']['research_trees']['Row'],
  'id' | 'country' | 'species_scientific' | 'species_common' | 'latitude' | 'longitude' | 'geo_precision' | 'source_doc_url' | 'source_program' | 'source_doc_title' | 'linked_tree_id' | 'converted_tree_id' | 'status'>;

export function aggregatePublicResearch(rows: ResearchSummaryRow[]): AtlasCountryStats[] {
  const groups = new Map<string, ResearchSummaryRow[]>();
  for (const row of rows) {
    if (typeof row.country !== 'string' || !row.country.trim()) throw new Error('Research country data unavailable');
    const country = canonicalAtlasCountry(row.country);
    if (!groups.has(country)) groups.set(country, []);
    groups.get(country)!.push(row);
  }
  return [...groups].map(([country, records]) => {
    const withCoordinates = records.filter(r => r.latitude != null && r.longitude != null).length;
    const exact = records.filter(r => ['exact','precise'].includes((r.geo_precision ?? '').toLowerCase())).length;
    const approximate = records.filter(r => ['approx','approximate','estimated'].includes((r.geo_precision ?? '').toLowerCase())).length;
    return { country, total_research_records: records.length,
      research_records_with_coordinates: withCoordinates, research_records_missing_coordinates: records.length - withCoordinates,
      exact_precision_count: exact, approximate_precision_count: approximate, unknown_precision_count: records.length - exact - approximate,
      distinct_species_count: new Set(records.map(r => r.species_scientific ?? r.species_common).filter(Boolean)).size,
      linked_ancient_friends_count: records.filter(r => r.linked_tree_id || r.converted_tree_id || r.status === 'verified_linked').length,
      source_count: new Set(records.map(r => r.source_doc_url || r.source_program || r.source_doc_title).filter(Boolean)).size,
      // Not derivable from these rows: unknown is not zero or a fabricated confidence score.
      verification_task_open_count: null, verification_task_completed_count: null, data_confidence_score: null };
  });
}

/** Stable, bounded pagination: fail rather than publish truncated counts. Uses the caller's existing RLS. */
async function readResearchPages<T>(select: string, country?: string | null): Promise<T[]> {
  const rows: T[] = []; let expected: number | null = null;
  for (let offset = 0; offset < MAX_RECORDS; offset += PAGE_SIZE) {
    let query = supabase.from('research_trees').select(select, {count:'exact'}).order('id').range(offset, offset + PAGE_SIZE - 1);
    if (country) query = query.ilike('country', canonicalAtlasCountry(country));
    const {data,error,count} = await query;
    if (error) throw error;
    if (!Array.isArray(data) || count == null || !Number.isSafeInteger(count) || count < 0 || count > MAX_RECORDS)
      throw new Error('Complete public research response unavailable');
    if (expected != null && expected !== count) throw new Error('Research changed during retrieval; retry');
    expected = count; rows.push(...data as T[]);
    if (rows.length === count) return rows;
    if (!data.length || rows.length > count) throw new Error('Incomplete public research response; retry');
  }
  throw new Error('Public research response exceeds safe retrieval limit');
}
export const fetchCountryResearch = (country: string) => readResearchPages<import('@/integrations/supabase/types').Database['public']['Tables']['research_trees']['Row']>('*', country);

export async function fetchAtlasCountryStats(country?: string | null): Promise<AtlasCountryStats[]> {
  const countryFilter = country?.trim() ? canonicalAtlasCountry(country) : null;
  const {data,error} = await (supabase.rpc as unknown as (name:string,args:Record<string,unknown>) => Promise<{data:unknown;error:{code?:string}|null}>)('public_atlas_country_stats',{country_filter:countryFilter});
  if (error) {
    // Proven deployed failure: missing signature/schema-cache entry. Never fallback on permission/auth/network errors.
    if (error.code !== 'PGRST202') throw error;
    return aggregatePublicResearch(await readResearchPages<ResearchSummaryRow>(SUMMARY_FIELDS,countryFilter));
  }
  if (!Array.isArray(data)) throw new Error('Atlas statistics response unavailable');
  const numericKeys = ['total_research_records','research_records_with_coordinates','research_records_missing_coordinates','exact_precision_count','approximate_precision_count','unknown_precision_count','distinct_species_count','linked_ancient_friends_count','verification_task_open_count','verification_task_completed_count','source_count','data_confidence_score'];
  const seen = new Set<string>();
  return data.map(row => {
    if (!row || typeof row.country !== 'string' || !row.country.trim() || numericKeys.some(k => !Number.isSafeInteger(row[k]) || row[k] < 0)) throw new Error('Atlas statistics response invalid');
    const canonical = canonicalAtlasCountry(row.country);
    if (seen.has(canonical)) throw new Error('Ambiguous country statistics; retry');
    seen.add(canonical); return {...row,country:canonical} as AtlasCountryStats;
  });
}
