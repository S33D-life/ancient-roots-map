import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CouncilOfLifePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <iframe
            src=""
            width="100%"
            height="800"
            frameBorder="0"
            allowFullScreen
            className="rounded-xl border border-border/40"
            title="Council of Life"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CouncilOfLifePage;
