/**
 * PageSkeleton — contextual skeleton screens that replace generic spinners.
 * Each variant mirrors the layout of its target page for perceived speed.
 */
import { Skeleton } from "@/components/ui/skeleton";

type SkeletonVariant = "default" | "map" | "gallery" | "dashboard" | "detail" | "ledger";

interface PageSkeletonProps {
  variant?: SkeletonVariant;
}

const DefaultSkeleton = () => (
  <div className="min-h-screen bg-background pt-20 px-4 space-y-6 max-w-4xl mx-auto">
    <Skeleton className="h-8 w-48 mx-auto" />
    <Skeleton className="h-4 w-64 mx-auto" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  </div>
);

const MapSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Skeleton className="h-14 w-full" />
    <Skeleton className="h-[calc(100dvh-3.5rem)] w-full rounded-none" />
  </div>
);

const GallerySkeleton = () => (
  <div className="min-h-screen bg-background pt-20 px-4 space-y-6 max-w-7xl mx-auto">
    <div className="flex items-center justify-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-6 w-40" />
    </div>
    <Skeleton className="h-10 w-full max-w-md mx-auto rounded-lg" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background pt-20 px-4 space-y-6 max-w-4xl mx-auto">
    <div className="flex items-center gap-3">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-48 rounded-xl" />
  </div>
);

const DetailSkeleton = () => (
  <div className="min-h-screen bg-background pt-20 px-4 space-y-6 max-w-3xl mx-auto">
    <Skeleton className="h-64 w-full rounded-xl" />
    <Skeleton className="h-8 w-56" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="grid grid-cols-2 gap-3 pt-2">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  </div>
);

const LedgerSkeleton = () => (
  <div className="min-h-screen bg-background pt-20 px-4 space-y-6 max-w-7xl mx-auto">
    <Skeleton className="h-8 w-36 mx-auto" />
    <Skeleton className="h-4 w-64 mx-auto" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-10 w-48 mx-auto rounded-lg" />
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  </div>
);

const VARIANTS: Record<SkeletonVariant, React.FC> = {
  default: DefaultSkeleton,
  map: MapSkeleton,
  gallery: GallerySkeleton,
  dashboard: DashboardSkeleton,
  detail: DetailSkeleton,
  ledger: LedgerSkeleton,
};

const PageSkeleton = ({ variant = "default" }: PageSkeletonProps) => {
  const Component = VARIANTS[variant];
  return <Component />;
};

export { PageSkeleton };
