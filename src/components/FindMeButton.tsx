import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddTreeDialog from "./AddTreeDialog";

interface FindMeButtonProps {
  onLocationFound?: (lat: number, lng: number) => void;
  autoOpen?: boolean;
}

const FindMeButton = ({ onLocationFound, autoOpen }: FindMeButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (autoOpen) {
      handleFindMe();
    }
  }, [autoOpen]);

  const handleFindMe = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        onLocationFound?.(latitude, longitude);
        setLoading(false);
        // Dialog opens with adjust mode triggered inside AddTreeDialog
        setDialogOpen(true);
      },
      (error) => {
        setLoading(false);
        let message = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Please allow location access to add a tree";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            break;
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <Button
        onClick={handleFindMe}
        disabled={loading}
        variant="mystical"
        className="shadow-lg bg-[hsl(120,30%,15%)] hover:bg-[hsl(120,30%,20%)] text-[hsl(42,95%,55%)] border border-[hsl(42,60%,40%)]"
        style={{ textShadow: '0 0 8px hsla(42, 95%, 55%, 0.6), 0 0 16px hsla(42, 95%, 55%, 0.3)' }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="10" width="20" height="10" rx="1" />
            <path d="M2 14h20" />
            <path d="M12 10v10" />
            <path d="M10 14h4v3h-4z" fill="currentColor" />
            <path d="M4 10l2-6h12l2 6" />
            <path d="M9 4h6" />
          </svg>
        )}
        Find Me & Add Tree
      </Button>

      <AddTreeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        latitude={location?.lat || null}
        longitude={location?.lng || null}
      />
    </>
  );
};

export default FindMeButton;
