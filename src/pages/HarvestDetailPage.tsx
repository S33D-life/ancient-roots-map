import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Package, Send, ExternalLink, TreeDeciduous, Truck } from "lucide-react";
import {
  useHarvestListing,
  CATEGORY_LABELS,
  AVAILABILITY_LABELS,
  STATUS_LABELS,
  MONTHS,
} from "@/hooks/use-harvest-listings";
import { useTeotagPageContext } from "@/hooks/use-teotag-page-context";

const HarvestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, error } = useHarvestListing(id);

  // Feed TEOTAG context with harvest listing data
  useTeotagPageContext(
    listing
      ? {
          harvest: {
            id: listing.id,
            produceName: listing.produce_name,
            category: listing.category,
            availabilityType: listing.availability_type,
            treeId: listing.tree_id ?? undefined,
            locationName: listing.location_name ?? undefined,
            seasonStart: listing.harvest_month_start ?? undefined,
            seasonEnd: listing.harvest_month_end ?? undefined,
          },
        }
      : {},
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-20" style={{ paddingTop: 'var(--content-top)' }}>
          <div className="space-y-4">
            <div className="h-48 rounded-xl bg-muted/30 animate-pulse" />
            <div className="h-6 w-2/3 rounded bg-muted/30 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted/20 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-24 pb-20 text-center">
          <p className="text-sm text-muted-foreground mt-20">Listing not found.</p>
          <Link to="/harvest" className="text-xs text-primary hover:underline mt-2 inline-block">
            ← Back to Harvest Exchange
          </Link>
        </main>
      </div>
    );
  }

  const cat = CATEGORY_LABELS[listing.category] || CATEGORY_LABELS.other;
  const avail = AVAILABILITY_LABELS[listing.availability_type] || AVAILABILITY_LABELS.information;
  const statusInfo = STATUS_LABELS[listing.status] || STATUS_LABELS.upcoming;

  const seasonText =
    listing.harvest_month_start && listing.harvest_month_end
      ? `${MONTHS[listing.harvest_month_start - 1]} – ${MONTHS[listing.harvest_month_end - 1]}`
      : listing.harvest_month_start
        ? MONTHS[listing.harvest_month_start - 1]
        : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-24 pb-20 space-y-6">
        {/* Back link */}
        <Link to="/harvest" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Harvest Exchange
        </Link>

        {/* Photo */}
        {listing.photos && listing.photos.length > 0 && (
          <div className="rounded-xl overflow-hidden aspect-video">
            <img src={listing.photos[0]} alt={listing.produce_name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary">
            {cat.emoji} {cat.label}
          </span>
          <span className={`text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground">
            {avail.emoji} {avail.label}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-serif font-semibold text-foreground leading-snug">
          {listing.produce_name}
        </h1>

        {/* Description */}
        {listing.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {listing.description}
          </p>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {listing.location_name && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/20 bg-card/50">
              <MapPin className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Location</p>
                <p className="text-sm text-foreground">{listing.location_name}</p>
              </div>
            </div>
          )}

          {seasonText && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/20 bg-card/50">
              <Calendar className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Harvest Season</p>
                <p className="text-sm text-foreground">{seasonText}</p>
              </div>
            </div>
          )}

          {listing.quantity_note && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/20 bg-card/50">
              <Package className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Quantity</p>
                <p className="text-sm text-foreground">{listing.quantity_note}</p>
              </div>
            </div>
          )}

          {listing.price_note && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/20 bg-card/50">
              <span className="text-primary/60 mt-0.5 shrink-0 text-sm">£</span>
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Price</p>
                <p className="text-sm text-foreground">{listing.price_note}</p>
              </div>
            </div>
          )}

          {listing.shipping_available && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/20 bg-card/50">
              <Truck className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Shipping</p>
                <p className="text-sm text-foreground">Available</p>
              </div>
            </div>
          )}
        </div>

        {/* Pickup instructions */}
        {listing.pickup_instructions && (
          <div className="rounded-xl border border-border/20 bg-card/40 p-4 space-y-1.5">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary/60" />
              Pickup Instructions
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {listing.pickup_instructions}
            </p>
          </div>
        )}

        {/* Tree connection */}
        {listing.tree_id && (
          <Link
            to={`/map?treeId=${listing.tree_id}`}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-primary/15 bg-primary/5 hover:bg-primary/8 transition-colors no-underline"
          >
            <TreeDeciduous className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">View source tree on the map →</span>
          </Link>
        )}

        {/* Contact / External link */}
        <div className="flex flex-wrap gap-3 pt-2">
          {listing.contact_method && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Send className="w-3.5 h-3.5 text-primary/60" />
              <span>{listing.contact_method}</span>
            </div>
          )}
          {listing.external_link && (
            <a
              href={listing.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              External link <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HarvestDetailPage;
