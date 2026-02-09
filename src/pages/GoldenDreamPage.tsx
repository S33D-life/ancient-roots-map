import Header from "@/components/Header";
import Footer from "@/components/Footer";

const GoldenDreamPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <iframe
            src="https://clammy-viscount-ddb.notion.site/ebd//21615b58480d802187b2cff864277413"
            width="100%"
            height="800"
            frameBorder="0"
            allowFullScreen
            className="rounded-xl border border-border/40"
            title="yOur Golden Dream"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GoldenDreamPage;
