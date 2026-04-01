/**
 * SeedCellarRoom — Standalone room for the Seed Cellar.
 * Now includes tabs for the embedded Airtable view and the new Seed Library directory.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import seedCellarWindow from "@/assets/seed-cellar-window.png";
import SeedLibraryDirectory from "@/components/seed-library/SeedLibraryDirectory";
import SeedLibraryCuratorPanel from "@/components/seed-library/SeedLibraryCuratorPanel";
import SeedLifeGallery from "@/components/seed-library/SeedLifeGallery";
import { useHasRole } from "@/hooks/use-role";

const SeedCellarRoom = () => {
  const [showEmbed, setShowEmbed] = useState(false);
  const { hasRole: isCurator } = useHasRole("curator");
  const { hasRole: isKeeper } = useHasRole("keeper");
  const canModerate = isCurator || isKeeper;

  return (
    <div className="space-y-6">
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer group border border-amber-700/40 hover:border-primary/60 transition-all duration-500"
        onClick={() => setShowEmbed(!showEmbed)}
      >
        <img
          src={seedCellarWindow}
          alt="Seed Cellar"
          className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-end pb-5">
          <h3 className="text-xl md:text-2xl font-serif text-primary drop-shadow-lg">🌱 The Seed Cellar</h3>
          <p className="text-xs text-foreground/70 mt-1 font-serif">
            {showEmbed ? "Click to close archive" : "Enter the living data archive"}
          </p>
        </div>
      </div>

      {showEmbed && (
        <Card className="border-mystical bg-card/50 backdrop-blur overflow-hidden animate-fade-in">
          <CardContent className="p-0">
            <iframe
              src="https://airtable.com/embed/appE4ajI4oqPaV8hl/shrTq2DuEhwOJblAB?viewControls=on"
              className="w-full border-t border-border"
              style={{ height: "70vh", minHeight: 500, background: "transparent" }}
              title="The Seed Cellar"
            />
          </CardContent>
        </Card>
      )}

      {/* Seed Library Directory + Curator Panel */}
      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="bg-muted/40 w-full justify-start">
          <TabsTrigger value="directory" className="text-xs">
            🌱 Seed Libraries
          </TabsTrigger>
          <TabsTrigger value="gallery" className="text-xs">
            🌰 Seed Life Gallery
          </TabsTrigger>
          {canModerate && (
            <TabsTrigger value="moderation" className="text-xs">
              🔧 Moderation
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="directory" className="mt-4">
          <SeedLibraryDirectory />
        </TabsContent>
        <TabsContent value="gallery" className="mt-4">
          <SeedLifeGallery />
        </TabsContent>
        {canModerate && (
          <TabsContent value="moderation" className="mt-4">
            <SeedLibraryCuratorPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SeedCellarRoom;
