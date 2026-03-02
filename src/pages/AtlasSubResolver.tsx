/**
 * AtlasSubResolver — resolves /atlas/:countrySlug/:subSlug
 * to either a SubRegionPortalPage or CityTemplatePage based on registry lookups.
 */
import { useParams } from "react-router-dom";
import { getSubRegionBySlug } from "@/config/subRegionRegistry";
import { getCityBySlug } from "@/config/cityRegistry";
import { lazy, Suspense } from "react";

const SubRegionPortalPage = lazy(() => import("./SubRegionPortalPage"));
const CityTemplatePage = lazy(() => import("./CityTemplatePage"));

const AtlasSubResolver = () => {
  const { countrySlug, subSlug } = useParams<{ countrySlug: string; subSlug: string }>();

  const isSubRegion = !!getSubRegionBySlug(countrySlug || "", subSlug || "");

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>}>
      {isSubRegion ? <SubRegionPortalPage /> : <CityTemplatePage />}
    </Suspense>
  );
};

export default AtlasSubResolver;
