import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar } from "lucide-react";
import {
  type HarvestListing,
  CATEGORY_LABELS,
  AVAILABILITY_LABELS,
  STATUS_LABELS,
  MONTHS,
} from "@/hooks/use-harvest-listings";

interface HarvestCardProps {
  listing: HarvestListing;
}

const HarvestCard = ({ listing }: HarvestCardProps) => {
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
    <Link to={`/harvest/${listing.id}`} className="no-underline block group">
      <Card className="hover:border-primary/30 transition-all duration-300 hover:shadow-md overflow-hidden h-full">
        {/* Photo strip */}
        {listing.photos && listing.photos.length > 0 && (
          <div className="h-32 overflow-hidden">
            <img
              src={listing.photos[0]}
              alt={listing.produce_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <CardContent className="p-4 space-y-2.5">
          {/* Category + Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/8 text-primary">
              {cat.emoji} {cat.label}
            </span>
            <span className={`text-[10px] font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-serif font-medium text-foreground leading-snug line-clamp-2">
            {listing.produce_name}
          </h3>

          {/* Description preview */}
          {listing.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {listing.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground/70">
            {listing.location_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.location_name}
              </span>
            )}
            {seasonText && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {seasonText}
              </span>
            )}
          </div>

          {/* Availability badge */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-border/30 text-muted-foreground">
              {avail.emoji} {avail.label}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default HarvestCard;
