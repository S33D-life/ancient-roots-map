import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { AlertCircle } from "lucide-react";

const ConversionStatus = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total trees
      const { count: total } = await supabase
        .from('trees')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // Get pending conversions
      const { count: pending } = await supabase
        .from('trees')
        .select('*', { count: 'exact', head: true })
        .is('latitude', null)
        .is('longitude', null)
        .eq('created_by', user.id);

      setTotalCount(total || 0);
      setPendingCount(pending || 0);
    };

    fetchCounts();

    // Subscribe to changes
    const channel = supabase
      .channel('conversion-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trees'
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (pendingCount === 0) return null;

  return (
    <Card className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-amber-900/90 backdrop-blur border-amber-700">
      <div className="flex items-center gap-2 px-4 py-2">
        <AlertCircle className="h-4 w-4 text-amber-300" />
        <span className="text-sm text-amber-100">
          {pendingCount} of {totalCount} trees need coordinate conversion
        </span>
      </div>
    </Card>
  );
};

export default ConversionStatus;
