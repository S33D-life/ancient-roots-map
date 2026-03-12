/**
 * FoundingStaffRoots — Visual ceremonial display of the 36 founding patron staffs
 * as root nodes feeding the S33D ecosystem. Used on the Value Tree / Living Economy tab.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getSpiralStaffs } from "@/utils/staffRoomData";
import { SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";
import {
  PATRON_DONATION_GBP,
  PATRON_STARTING_HEARTS,
} from "@/data/staffPatronValue";

/** Assign a deterministic hue based on species index for visual variety */
const speciesHue = (code: string, i: number) => {
  const hues = [42, 120, 150, 30, 280, 200, 60, 340, 90, 170];
  return `hsl(${hues[i % hues.length]}, 70%, 50%)`;
};

const FoundingStaffRoots = () => {
  const staffs = useMemo(() => getSpiralStaffs(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-primary/15 bg-card/30 backdrop-blur-sm overflow-hidden"
    >
      {/* Gold root line */}
      <div
        className="h-0.5"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.4), hsl(120 45% 50% / 0.2), transparent)",
        }}
      />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-primary/5">
            <Crown className="w-3 h-3" style={{ color: "hsl(42, 85%, 55%)" }} />
            <span className="text-[9px] font-serif text-foreground tracking-widest uppercase">Founding Staff Roots</span>
          </div>
          <p className="text-[11px] font-serif text-muted-foreground leading-relaxed max-w-md mx-auto">
            The first 36 patron staffs form the root system of the S33D forest.
            Each donation of <span className="text-foreground">£{PATRON_DONATION_GBP.toLocaleString()}</span> seeds{" "}
            <span className="text-foreground">{PATRON_STARTING_HEARTS.toLocaleString()} S33D Hearts</span> into the living economy.
          </p>
        </div>

        {/* Ceremonial circle of 36 staffs */}
        <div className="relative mx-auto" style={{ width: "min(100%, 320px)", aspectRatio: "1" }}>
          {/* Center glow */}
          <div
            className="absolute inset-1/4 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(42 85% 55% / 0.08), transparent 70%)",
              border: "1px solid hsl(42 85% 55% / 0.06)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-serif font-bold text-foreground">36</span>
              <p className="text-[7px] font-serif text-muted-foreground uppercase tracking-widest">Root Nodes</p>
            </div>
          </div>

          {/* Staff nodes in a circle */}
          {staffs.map((staff, i) => {
            const angle = (i / 36) * Math.PI * 2 - Math.PI / 2;
            const radius = 42;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const color = speciesHue(staff.code, i);

            return (
              <motion.div
                key={staff.code}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.02, type: "spring", stiffness: 200 }}
                className="absolute group"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Link to={`/staff/${staff.code}`} className="block">
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center transition-all group-hover:scale-150 group-hover:z-10"
                    style={{
                      borderColor: `${color}40`,
                      backgroundColor: `${color}15`,
                      boxShadow: `0 0 8px ${color}20`,
                    }}
                  >
                    <span className="text-[6px] sm:text-[7px] font-mono" style={{ color }}>
                      {i < 12 ? "◈" : "·"}
                    </span>
                  </div>
                </Link>
                {/* Tooltip on hover */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block z-20 pointer-events-none">
                  <div className="bg-card border border-border rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                    <p className="text-[8px] font-serif text-foreground">{staff.displayCode}</p>
                    <p className="text-[7px] font-serif text-muted-foreground">{staff.species}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Flow note */}
        <div className="flex items-center justify-center gap-2 text-[9px] font-serif text-muted-foreground">
          <span>Donation</span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span>Staff Claim</span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span>Seed Hearts</span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span className="text-foreground">Living Economy</span>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/patron-offering"
            className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all"
          >
            <span className="text-[10px] font-serif text-foreground group-hover:text-primary transition-colors">
              About the Founding Patron Offering
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default FoundingStaffRoots;
