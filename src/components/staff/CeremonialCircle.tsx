/**
 * CeremonialCircle — Displays the 36 founding patron staffs
 * as a sacred circle of glowing nodes in the Staff Room.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crown } from "lucide-react";
import { getSpiralStaffs } from "@/utils/staffRoomData";
import { SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";

const CeremonialCircle = () => {
  const staffs = useMemo(() => getSpiralStaffs().slice(0, 36), []);

  return (
    <div className="rounded-2xl border border-primary/15 bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Gold accent */}
      <div
        className="h-0.5"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.5), hsl(280 60% 55% / 0.2), transparent)",
        }}
      />

      <div className="p-5 sm:p-6 space-y-4">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <Crown className="w-4 h-4" style={{ color: "hsl(42, 85%, 55%)" }} />
            <h3 className="text-sm font-serif text-foreground tracking-wide">The Founding Circle</h3>
          </div>
          <p className="text-[10px] font-serif text-muted-foreground max-w-xs mx-auto">
            36 handcrafted staffs forming the root system of the Ancient Friends ecosystem.
            Each staff is a founding seed.
          </p>
        </div>

        {/* Sacred circle visualization */}
        <div className="relative mx-auto" style={{ width: "min(100%, 360px)", aspectRatio: "1" }}>
          {/* Outer ring glow */}
          <div
            className="absolute inset-[8%] rounded-full"
            style={{
              border: "1px solid hsl(42 85% 55% / 0.08)",
              background: "radial-gradient(circle, transparent 60%, hsl(42 85% 55% / 0.03))",
            }}
          />
          {/* Inner ring glow */}
          <div
            className="absolute inset-[30%] rounded-full"
            style={{
              border: "1px solid hsl(42 85% 55% / 0.05)",
              background: "radial-gradient(circle, hsl(42 85% 55% / 0.06), transparent 70%)",
            }}
          />
          {/* Center emblem */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-xs font-serif text-primary/40 tracking-widest uppercase">S33D</span>
            </div>
          </div>

          {/* Staff nodes */}
          {staffs.map((staff, i) => {
            const angle = (i / 36) * Math.PI * 2 - Math.PI / 2;
            const radius = 40;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const speciesInfo = SPECIES_MAP[staff.speciesCode as SpeciesCode];
            const color = speciesInfo?.accent || "hsl(42, 85%, 55%)";

            return (
              <motion.div
                key={staff.code}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.03, type: "spring", stiffness: 180 }}
                className="absolute group"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Link to={`/staff/${staff.code}`} className="block relative">
                  {/* Glow pulse */}
                  <div
                    className="absolute inset-[-4px] rounded-full animate-pulse"
                    style={{
                      background: `radial-gradient(circle, ${color}15, transparent 70%)`,
                      animationDuration: `${3 + (i % 5)}s`,
                    }}
                  />
                  <div
                    className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center transition-transform group-hover:scale-[1.8] group-hover:z-10"
                    style={{
                      borderColor: `${color}50`,
                      backgroundColor: `${color}20`,
                      boxShadow: `0 0 12px ${color}25, inset 0 0 6px ${color}10`,
                    }}
                  >
                    <span className="text-[7px] sm:text-[8px] font-serif font-bold" style={{ color }}>
                      {staff.isOriginSpiral ? "◈" : String(i + 1)}
                    </span>
                  </div>
                </Link>
                {/* Hover tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
                  <div className="bg-card/95 border border-border rounded-xl px-3 py-2 whitespace-nowrap shadow-xl text-center">
                    <p className="text-[9px] font-serif text-foreground font-medium">{staff.code}</p>
                    <p className="text-[8px] font-serif text-muted-foreground">{staff.speciesName}</p>
                    {staff.isOriginSpiral && (
                      <p className="text-[7px] font-serif text-primary/60 mt-0.5">Origin Spiral</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/patron-offering"
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/15 bg-primary/5 hover:bg-primary/10 transition-all"
          >
            <span className="text-[9px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">
              About the Founding Patron Offering
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CeremonialCircle;
