/**
 * GreetingCardPreview — Renders the actual visual card for screenshot/share.
 * Three variants: portrait, whisper, seasonal.
 */
import { forwardRef } from "react";
import { Heart, TreeDeciduous } from "lucide-react";

export type CardVariant = "portrait" | "whisper" | "seasonal";

interface GreetingCardPreviewProps {
  variant: CardVariant;
  treeName: string;
  species: string;
  imageUrl?: string | null;
  location?: string | null;
  whisperText?: string | null;
  customMessage?: string;
  season: string;
}

const SEASON_PALETTES: Record<string, { bg: string; accent: string; emoji: string }> = {
  spring: { bg: "from-[hsl(120,20%,14%)] to-[hsl(90,25%,18%)]", accent: "text-[hsl(90,60%,65%)]", emoji: "🌸" },
  summer: { bg: "from-[hsl(42,30%,14%)] to-[hsl(75,20%,16%)]", accent: "text-[hsl(42,95%,60%)]", emoji: "☀️" },
  autumn: { bg: "from-[hsl(25,25%,14%)] to-[hsl(42,20%,12%)]", accent: "text-[hsl(30,80%,60%)]", emoji: "🍂" },
  winter: { bg: "from-[hsl(210,15%,14%)] to-[hsl(220,18%,18%)]", accent: "text-[hsl(210,40%,70%)]", emoji: "❄️" },
};

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

const GreetingCardPreview = forwardRef<HTMLDivElement, GreetingCardPreviewProps>(
  ({ variant, treeName, species, imageUrl, location, whisperText, customMessage, season }, ref) => {
    const resolvedSeason = season || getCurrentSeason();
    const palette = SEASON_PALETTES[resolvedSeason] || SEASON_PALETTES.spring;

    if (variant === "portrait") {
      return (
        <div
          ref={ref}
          className={`relative w-[360px] h-[480px] rounded-2xl overflow-hidden bg-gradient-to-b ${palette.bg} border border-[hsl(42,60%,25%)]/40 shadow-2xl`}
        >
          {/* Tree image */}
          {imageUrl ? (
            <div className="h-[260px] overflow-hidden">
              <img src={imageUrl} alt={treeName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 h-[260px] bg-gradient-to-b from-transparent via-transparent to-[hsl(80,15%,10%)]" />
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center bg-[hsl(75,20%,12%)]">
              <TreeDeciduous className="w-20 h-20 text-[hsl(42,95%,55%)]/30" />
            </div>
          )}

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(42,95%,55%)]/60 font-serif">
              Ancient Friend
            </p>
            <h2 className="font-serif text-2xl text-[hsl(45,100%,85%)] leading-tight">{treeName}</h2>
            <p className="font-serif text-sm italic text-[hsl(45,40%,60%)]">{species}</p>
            {location && (
              <p className="text-xs text-[hsl(45,40%,55%)]">{location}</p>
            )}
            <div className="pt-3 flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-[hsl(42,95%,55%)]/50 fill-[hsl(42,95%,55%)]/20" />
              <span className="text-[9px] tracking-[0.2em] uppercase text-[hsl(42,95%,55%)]/40 font-serif">
                S33D · Ancient Friends
              </span>
            </div>
          </div>

          {/* Texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]" />
        </div>
      );
    }

    if (variant === "whisper") {
      return (
        <div
          ref={ref}
          className={`relative w-[360px] h-[480px] rounded-2xl overflow-hidden bg-gradient-to-br ${palette.bg} border border-[hsl(42,60%,25%)]/40 shadow-2xl flex flex-col items-center justify-center p-8`}
        >
          {/* Decorative top */}
          <div className="absolute top-6 left-0 right-0 flex justify-center">
            <span className="text-3xl">{palette.emoji}</span>
          </div>

          {/* Whisper content */}
          <div className="space-y-6 text-center max-w-[280px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(42,95%,55%)]/50 font-serif">
              A whisper from
            </p>
            <h3 className="font-serif text-xl text-[hsl(45,100%,85%)]">{treeName}</h3>

            <div className="relative">
              <div className="absolute -left-4 -top-2 text-[hsl(42,95%,55%)]/20 text-4xl font-serif">"</div>
              <p className="font-serif text-base leading-relaxed text-[hsl(45,95%,80%)] italic px-2">
                {whisperText || "The forest remembers what we forget."}
              </p>
              <div className="absolute -right-4 -bottom-2 text-[hsl(42,95%,55%)]/20 text-4xl font-serif">"</div>
            </div>

            <p className="font-serif text-xs italic text-[hsl(45,40%,55%)]">{species}</p>
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-[hsl(42,95%,55%)]/50 fill-[hsl(42,95%,55%)]/20" />
            <span className="text-[9px] tracking-[0.2em] uppercase text-[hsl(42,95%,55%)]/40 font-serif">
              S33D · Ancient Friends
            </span>
          </div>

          {/* Subtle texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]" />
        </div>
      );
    }

    // seasonal
    return (
      <div
        ref={ref}
        className={`relative w-[360px] h-[480px] rounded-2xl overflow-hidden bg-gradient-to-b ${palette.bg} border border-[hsl(42,60%,25%)]/40 shadow-2xl flex flex-col`}
      >
        {/* Season header */}
        <div className="pt-8 pb-4 text-center space-y-1">
          <span className="text-4xl">{palette.emoji}</span>
          <p className={`text-[10px] uppercase tracking-[0.3em] font-serif ${palette.accent}/70`}>
            {resolvedSeason} greeting
          </p>
        </div>

        {/* Tree image strip */}
        {imageUrl && (
          <div className="mx-6 h-[160px] rounded-xl overflow-hidden border border-[hsl(42,60%,25%)]/20">
            <img src={imageUrl} alt={treeName} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3 text-center">
          <h3 className="font-serif text-xl text-[hsl(45,100%,85%)]">{treeName}</h3>
          <p className="font-serif text-sm italic text-[hsl(45,40%,60%)]">{species}</p>
          {location && <p className="text-xs text-[hsl(45,40%,55%)]">{location}</p>}
          <p className="font-serif text-sm leading-relaxed text-[hsl(45,95%,80%)] max-w-[260px] pt-2">
            {customMessage || "May this ancient friend remind you of the quiet strength that endures."}
          </p>
        </div>

        {/* Footer */}
        <div className="pb-6 flex justify-center items-center gap-1.5">
          <Heart className="w-3 h-3 text-[hsl(42,95%,55%)]/50 fill-[hsl(42,95%,55%)]/20" />
          <span className="text-[9px] tracking-[0.2em] uppercase text-[hsl(42,95%,55%)]/40 font-serif">
            S33D · Ancient Friends
          </span>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]" />
      </div>
    );
  }
);

GreetingCardPreview.displayName = "GreetingCardPreview";
export { getCurrentSeason };
export default GreetingCardPreview;
