import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const AssetsPage = () => {
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
          src="https://clammy-viscount-ddb.notion.site/ebd/24515b58480d80e7808cdda1195e863a"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          title="Assets"
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
            src="https://clammy-viscount-ddb.notion.site/ebd/24515b58480d80e7808cdda1195e863a"
            width="100%"
            height="800"
            frameBorder="0"
            allowFullScreen
            className="rounded-xl border border-border/40"
            title="Assets"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AssetsPage;
