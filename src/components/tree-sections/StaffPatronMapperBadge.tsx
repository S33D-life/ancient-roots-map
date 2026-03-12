/**
 * StaffPatronMapperBadge — Shows a discreet badge on tree pages
 * when the tree was mapped by a staff patron. Queries the staffs table
 * to check if the mapper has an active staff.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  mapperId: string | null;
}

interface StaffInfo {
  id: string;
  species: string;
  is_origin_spiral: boolean;
}

const StaffPatronMapperBadge = ({ mapperId }: Props) => {
  const [staff, setStaff] = useState<StaffInfo | null>(null);

  useEffect(() => {
    if (!mapperId) return;
    const check = async () => {
      const { data } = await supabase
        .from("staffs" as any)
        .select("id, species, is_origin_spiral")
        .eq("owner_user_id", mapperId)
        .limit(1)
        .maybeSingle();
      if (data) setStaff(data as unknown as StaffInfo);
    };
    check();
  }, [mapperId]);

  if (!staff) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
    >
      <Link
        to={`/staff/${staff.id}`}
        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/15 bg-primary/5 hover:border-primary/30 transition-all"
      >
        <Wand2 className="w-3 h-3" style={{ color: "hsl(42, 85%, 55%)" }} />
        <span className="text-[9px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">
          Mapped by Staff Patron
        </span>
        <span className="text-[8px] font-mono text-primary/50">{staff.id}</span>
      </Link>
    </motion.div>
  );
};

export default StaffPatronMapperBadge;
