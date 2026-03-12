/**
 * SeedCellarRoom — Standalone room for the Seed Cellar.
 * Extracted from GalleryPage.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import seedCellarWindow from "@/assets/seed-cellar-window.png";

const SeedCellarRoom = () => {
  const [showEmbed, setShowEmbed] = useState(false);

  return (
    <div className="space-y-6">
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer group border border-amber-700/40 hover:border-primary/60 transition-all duration-500"
        onClick={() => setShowEmbed(!showEmbed)}
      >
        <img
          src={seedCellarWindow}
          alt="Seed Cellar"
          className="w-full h-64 md:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-end pb-6">
          <h3 className="text-2xl md:text-3xl font-serif text-primary drop-shadow-lg">🌱 The Seed Cellar</h3>
          <p className="text-sm text-foreground/70 mt-1 font-serif">
            {showEmbed ? "Click to close" : "Enter the living data archive"}
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
    </div>
  );
};

export default SeedCellarRoom;
