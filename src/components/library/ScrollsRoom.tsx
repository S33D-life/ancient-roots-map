/**
 * ScrollsRoom — Standalone room for Scrolls & Records.
 * Contains: Tree Ledger link, Council embed, Collaborator Volumes.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CollaboratorShelf from "@/components/CollaboratorShelf";
import councilImage from "@/assets/council-of-life.jpeg";
import councilLedgerWindow from "@/assets/council-ledger-window.jpeg";
import { supabase } from "@/integrations/supabase/client";

const ScrollsRoom = () => {
  const [showCouncilEmbed, setShowCouncilEmbed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Tree Ledger Link — primary entry */}
      <Link
        to="/ledger"
        className="relative block rounded-xl overflow-hidden group border border-primary/30 hover:border-primary/60 transition-all duration-500"
      >
        <img
          src={councilLedgerWindow}
          alt="Tree Ledger"
          className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-end pb-6">
          <h3 className="text-2xl md:text-3xl font-serif text-primary drop-shadow-lg">Tree Ledger</h3>
          <p className="text-sm text-foreground/70 mt-1">Open the transparency explorer →</p>
        </div>
      </Link>

      {/* Heart Reservoir Rankings */}
      <TreeReservoirLeaderboard />

      {/* Council of Life Window */}
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer group border border-primary/30 hover:border-primary/60 transition-all duration-500"
        onClick={() => setShowCouncilEmbed(!showCouncilEmbed)}
      >
        <img
          src={councilImage}
          alt="Council of Life"
          className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-end pb-6">
          <h3 className="text-2xl md:text-3xl font-serif text-primary drop-shadow-lg">Council of Life</h3>
          <p className="text-sm text-foreground/70 mt-1">
            {showCouncilEmbed ? "Click to close" : "Click to open the Council"}
          </p>
        </div>
      </div>
      {showCouncilEmbed && (
        <div className="animate-fade-in">
          <iframe
            src="https://clammy-viscount-ddb.notion.site/ebd/1e415b58480d8042a722ef57e01e3228"
            width="100%"
            height="600"
            frameBorder="0"
            allowFullScreen
            className="rounded-xl border border-border/40"
            title="Council of Life"
          />
        </div>
      )}

      {/* Collaborator Volumes */}
      <div className="pt-4">
        <h2 className="text-xl font-serif text-foreground/90 tracking-wide mb-4">Collaborator Volumes</h2>
        {currentUserId ? (
          <CollaboratorShelf userId={currentUserId} />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground font-serif">Sign in to manage your Collaborator Volumes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrollsRoom;
