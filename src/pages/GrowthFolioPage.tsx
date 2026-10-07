import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import GrowthFolio from "@/components/crown/GrowthFolio";
import { findGrowth } from "@/data/crown/growths";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ROUTES } from "@/lib/routes";

const GrowthFolioPage = () => {
  const { growthId } = useParams();
  const growth = findGrowth(growthId);
  useDocumentTitle(growth ? `${growth.title} · Growth folio` : "Growth folio");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-20 pb-12">
        <TetolBreadcrumb pageLabel={growth ? growth.title : "Growth folio"} />
        <div className="px-4 pt-4">
          {growth ? <GrowthFolio growth={growth} /> : (
            <div className="max-w-xl mx-auto text-center py-16">
              <p className="font-serif text-lg">This growth is not in the Crown.</p>
              <Link to={ROUTES.GOLDEN_DREAM} className="underline underline-offset-2 text-sm mt-3 inline-block">Return to the Crown</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GrowthFolioPage;
