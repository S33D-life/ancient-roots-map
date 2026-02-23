import { Link } from "react-router-dom";
import { useMarkets } from "@/hooks/use-markets";
import MarketCard from "@/components/MarketCard";
import { Loader2 } from "lucide-react";

interface TreeMarketsProps {
  treeId: string;
  treeSpecies?: string;
}

const TreeMarkets = ({ treeId, treeSpecies }: TreeMarketsProps) => {
  const { markets, loading } = useMarkets({ treeId });

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (markets.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)" }} />
        <h2 className="text-lg font-serif text-primary tracking-widest uppercase flex items-center gap-2">
          🌀 Cycle Markets
        </h2>
        <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.4), transparent)" }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {markets.slice(0, 4).map((m, i) => (
          <MarketCard key={m.id} market={m} index={i} />
        ))}
      </div>
      {markets.length > 4 && (
        <Link to="/markets" className="block text-center text-xs text-primary hover:underline font-serif mt-3">
          View all {markets.length} markets →
        </Link>
      )}
    </div>
  );
};

export default TreeMarkets;
