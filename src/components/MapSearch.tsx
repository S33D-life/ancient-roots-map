import { useState, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { autosuggest, convertToCoordinates } from "@/utils/what3words";
import { useToast } from "@/hooks/use-toast";

interface MapSearchProps {
  onLocationSelect: (lat: number, lng: number, what3words: string) => void;
}

const MapSearch = ({ onLocationSelect }: MapSearchProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchInput.length >= 3) {
        const results = await autosuggest(searchInput);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchInput]);

  const handleSearch = async (words: string) => {
    const location = await convertToCoordinates(words);
    
    if (location) {
      onLocationSelect(
        location.coordinates.lat,
        location.coordinates.lng,
        location.words
      );
      setSearchInput(location.words);
      setShowSuggestions(false);
      toast({
        title: "Location found",
        description: `Navigating to ${location.words}`,
      });
    } else {
      toast({
        title: "Location not found",
        description: "Please check the what3words address",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="absolute top-6 left-6 z-10 w-96">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by what3words (e.g., filled.count.soap)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchInput) {
                  handleSearch(searchInput);
                }
              }}
              className="pl-9 bg-background/95 backdrop-blur border-primary/20"
            />
          </div>
          <Button
            onClick={() => handleSearch(searchInput)}
            disabled={!searchInput}
            variant="mystical"
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-background/95 backdrop-blur border border-primary/20 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSearch(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSearch;
