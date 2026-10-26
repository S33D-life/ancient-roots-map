import { useQuery } from '@tanstack/react-query';
import { canonicalAtlasCountry, fetchAtlasCountryStats } from '@/lib/atlas-research';
export type { AtlasCountryStats } from '@/lib/atlas-research';

export function useAtlasCountryStats(country?: string | null, enabled = true) {
  const countryFilter = country?.trim() ? canonicalAtlasCountry(country) : null;
  return useQuery({
    queryKey: ['atlas-country-stats', countryFilter], enabled, staleTime: 5 * 60_000,
    retry: 1, queryFn: () => fetchAtlasCountryStats(countryFilter),
  });
}
