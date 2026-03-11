import { useState, lazy, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Leaf, TreeDeciduous } from "lucide-react";
import { useHarvestListings, CATEGORY_LABELS, AVAILABILITY_LABELS } from "@/hooks/use-harvest-listings";
import HarvestCard from "@/components/harvest/HarvestCard";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence } from "framer-motion";

const CreateHarvestForm = lazy(() => import("@/components/harvest/CreateHarvestForm"));

const HarvestPage = () => {
  const [user, setUser] = useState<{ id: string } | null>(null);

  useState(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ? { id: u.id } : null));
  });
  const [showCreate, setShowCreate] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const { data: listings, isLoading } = useHarvestListings({
    category: categoryFilter,
    status: statusFilter,
    availability: availabilityFilter,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-24 pb-20">
        {/* Hero section */}
        <section className="text-center space-y-3 mb-8">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TreeDeciduous className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">
            Guardian Harvest Exchange
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Discover produce grown by tree guardians — fruits, nuts, seeds, and more,
            rooted in the land and connected to the living atlas.
          </p>
        </section>

        {/* Filters + Create */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px] text-xs h-8">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, { label, emoji }]) => (
                <SelectItem key={key} value={key}>{emoji} {label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] text-xs h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">🌱 Upcoming</SelectItem>
              <SelectItem value="available">✅ Available</SelectItem>
              <SelectItem value="finished">🍂 Finished</SelectItem>
            </SelectContent>
          </Select>

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-[140px] text-xs h-8">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(AVAILABILITY_LABELS).map(([key, { label, emoji }]) => (
                <SelectItem key={key} value={key}>{emoji} {label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {user && (
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Offer Harvest
            </Button>
          )}
        </div>

        {/* Listings grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <HarvestCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <Leaf className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">
              No harvests listed yet. The first fruit is always the sweetest.
            </p>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreate(true)}
                className="text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Offer the first harvest
              </Button>
            )}
          </div>
        )}
      </main>
      <Footer />

      {/* Create form overlay */}
      <AnimatePresence>
        {showCreate && (
          <Suspense fallback={null}>
            <CreateHarvestForm onClose={() => setShowCreate(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HarvestPage;
