import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CouncilOfLifePage = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur"
          onClick={() => setIsFullscreen(false)}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
        <iframe
          src="https://clammy-viscount-ddb.notion.site/ebd//1e415b58480d8042a722ef57e01e3228"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          title="Council of Life"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="h-4 w-4" />
              Full Screen
            </Button>
          </div>
          <iframe
            src="https://clammy-viscount-ddb.notion.site/ebd//1e415b58480d8042a722ef57e01e3228"
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
