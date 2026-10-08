import { Link, useLocation, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import GrowthFolio from "@/components/crown/GrowthFolio";
import { ParchmentGrain } from "@/components/crown/MaturityGlyph";
import { findGrowth } from "@/data/crown/growths";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { returnTarget } from "@/lib/crown/returnPath";
import "@/components/crown/living-parchment.css";

const GrowthFolioPage = () => {
  const { growthId } = useParams();
  const location = useLocation();
  const growth = findGrowth(growthId);
  const back = returnTarget(location.state);
  useDocumentTitle(growth ? `${growth.title} · Growth folio` : "Growth folio");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-20 pb-0">
        <TetolBreadcrumb pageLabel={growth ? growth.title : "Growth folio"} />
        <div className="lp lp-ground-folio relative overflow-hidden mt-2">
          <ParchmentGrain id="lp-folio-grain" />
          <div className="lp-page">
            {growth ? <GrowthFolio growth={growth} returnTo={back} /> : (
              <div className="flex flex-col gap-2.5 py-12 max-w-[560px]" role="status">
                <span className="text-[30px] text-[color:var(--lp-ink)]">This growth is not in the Crown.</span>
                <span className="lp-meta text-[18px]">It may have been renamed, or never recorded. Nothing is inferred.</span>
                <Link to={back.to} className="lp-return self-start">↩ {back.label}</Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GrowthFolioPage;
