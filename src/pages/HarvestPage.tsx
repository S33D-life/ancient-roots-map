import { useState, lazy, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Leaf, TreeDeciduous, Calendar, MapPin, ArrowRight } from "lucide-react";
import { useHarvestListings, CATEGORY_LABELS, AVAILABILITY_LABELS } from "@/hooks/use-harvest-listings";
import { useSeasonalEvents } from "@/hooks/use-seasonal-events";
import HarvestCard from "@/components/harvest/HarvestCard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import SeasonalLensBanner from "@/components/seasonal/SeasonalLensBanner";

const CreateHarvestForm = lazy(() => import("@/components/harvest/CreateHarvestForm"));

const HarvestPage = () => {
  const { user } = useCurrentUser();

  const [showCreate, setShowCreate] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const { data: listings, isLoading } = useHarvestListings({
    category: categoryFilter,
    status: statusFilter,
    availability: availabilityFilter,
  });

  // Seasonal context — show what's blooming/fruiting this month
  const { bloomEvents } = useSeasonalEvents();
  const currentMonthName = new Date().toLocaleDateString(undefined, { month: "long" });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pb-20" style={{ paddingTop: 'var(--content-top)' }}>
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

        {/* Seasonal Lens banner */}
        <div className="mb-4">
          <SeasonalLensBanner context="harvest" />
        </div>

        {/* Seasonal context bar */}
        {bloomEvents.length > 0 && (
          <div className="mb-6 rounded-xl bg-card/40 border border-border/20 p-3">
            <p className="text-[10px] font-serif text-muted-foreground/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Leaf className="w-3 h-3 text-primary/50" />
              Seasonal rhythms — {currentMonthName}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {bloomEvents.slice(0, 8).map(e => (
                <span key={e.id} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/5 text-primary/70 font-serif border border-primary/10">
                  {e.emoji} {e.title}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Link to="/cosmic/calendar" className="text-[9px] text-primary/50 hover:text-primary font-serif flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" /> Cosmic Calendar
              </Link>
              <Link to="/map" className="text-[9px] text-primary/50 hover:text-primary font-serif flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" /> View on map
              </Link>
            </div>
          </div>
        )}

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

        {/* Cross-navigation footer */}
        <div className="grid grid-cols-2 gap-2 mt-8">
          <Link
            to="/cosmic/calendar"
            className="flex items-center gap-2 p-3 rounded-xl bg-card/30 border border-border/20 hover:border-primary/20 transition-all no-underline"
          >
            <Calendar className="w-4 h-4 text-primary/60" />
            <div>
              <p className="text-[10px] font-serif text-foreground/70">Cosmic Calendar</p>
              <p className="text-[9px] text-muted-foreground/50">Seasonal rhythms</p>
            </div>
          </Link>
          <Link
            to="/map"
            className="flex items-center gap-2 p-3 rounded-xl bg-card/30 border border-border/20 hover:border-primary/20 transition-all no-underline"
          >
            <MapPin className="w-4 h-4 text-primary/60" />
            <div>
              <p className="text-[10px] font-serif text-foreground/70">Living Atlas</p>
              <p className="text-[9px] text-muted-foreground/50">Explore the map</p>
            </div>
          </Link>
        </div>
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
