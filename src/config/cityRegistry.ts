/**
 * City Registry — reusable city template layer within Country Portals.
 *
 * To add a new city, add an entry here.
 * The CityTemplatePage picks it up automatically via slug lookup.
 */

export interface CityRegistryEntry {
  /** Display name */
  name: string;
  /** URL slug for /country/:countrySlug/:citySlug */
  slug: string;
  /** Parent country slug (must match countryRegistry) */
  countrySlug: string;
  /** Parent country display name */
  countryName: string;
  /** Region / administrative area */
  region: string;
  /** Bounding box [south, west, north, east] for map filtering */
  bbox: [number, number, number, number];
  /** Centre point [lat, lng] */
  center: [number, number];
  /** Short tagline */
  tagline: string;
  /** Dominant tree palette hint for theming */
  treePalette: string[];
  /** Optional river / waterway name for atmosphere */
  waterway?: string;
}

const CITY_REGISTRY: CityRegistryEntry[] = [
  {
    name: "London",
    slug: "london",
    countrySlug: "united-kingdom",
    countryName: "United Kingdom",
    region: "Greater London",
    bbox: [51.28, -0.51, 51.69, 0.33],
    center: [51.5074, -0.1278],
    tagline: "A local grove within the global forest.",
    treePalette: ["Oak", "London Plane", "Yew"],
    waterway: "Thames",
  },
  {
    name: "Paris",
    slug: "paris",
    countrySlug: "france",
    countryName: "France",
    region: "Île-de-France",
    bbox: [48.35, 2.05, 48.95, 2.80],
    center: [48.8566, 2.3522],
    tagline: "Ancient roots beneath the city of light.",
    treePalette: ["Cedar", "Oak", "Robinia"],
    waterway: "Seine",
  },
];

export default CITY_REGISTRY;

/** Lookup helpers */
export const getCityBySlug = (
  countrySlug: string,
  citySlug: string
): CityRegistryEntry | undefined =>
  CITY_REGISTRY.find(
    (c) => c.countrySlug === countrySlug && c.slug === citySlug
  );

export const getCitiesByCountry = (countrySlug: string): CityRegistryEntry[] =>
  CITY_REGISTRY.filter((c) => c.countrySlug === countrySlug);
