import { Button } from "@/components/ui/button";
import { MapPin, TreeDeciduous } from "lucide-react";
import heroS33d from "@/assets/hero-s33d.jpeg";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

// Fairy dust particle
interface Particle {
  x: number; y: number; size: number; speedX: number; speedY: number;
  opacity: number; fadeSpeed: number; hue: number;
}

const FairyDust = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let particles: Particle[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const spawnParticle = (): Particle => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1, speedX: (Math.random() - 0.5) * 0.8,
      speedY: -Math.random() * 0.5 - 0.2, opacity: Math.random() * 0.8 + 0.2,
      fadeSpeed: Math.random() * 0.005 + 0.002, hue: Math.random() > 0.5 ? 45 : 120,
    });
    for (let i = 0; i < 60; i++) particles.push(spawnParticle());
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.speedX + Math.sin(Date.now() * 0.001 + i) * 0.3;
        p.y += p.speedY;
        p.opacity -= p.fadeSpeed;
        if (p.opacity <= 0 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[i] = spawnParticle(); particles[i].y = canvas.height + 10; return;
        }
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.opacity})`);
        gradient.addColorStop(0.4, `hsla(${p.hue}, 70%, 60%, ${p.opacity * 0.4})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 60%, 50%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 85%, ${p.opacity})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[2]" />;
};

// Fruiting stages
type FruitingStage = "button" | "emerging" | "young" | "mature" | "open" | "aging";

interface MushroomProps {
  x: string; scale: number; delay: number; flip?: boolean; stage: FruitingStage; bottom?: number;
}

const AmanitaMushroom = ({ x, scale, delay, flip, stage, bottom }: MushroomProps) => {
  // More naturalistic color palette
  const stemBase = stage === "aging" ? "hsl(42 18% 58%)" : "hsl(50 28% 85%)";
  const stemShade = stage === "aging" ? "hsl(38 15% 48%)" : "hsl(46 22% 72%)";
  const stemRingColor = stage === "aging" ? "hsl(40 16% 52%)" : "hsl(48 24% 76%)";
  // Real Amanita muscaria: vivid scarlet → fading orange-red with age
  const capMain = stage === "aging" ? "hsl(12 50% 35%)" : stage === "mature" ? "hsl(4 78% 44%)" : stage === "open" ? "hsl(2 74% 40%)" : "hsl(0 80% 48%)";
  const capDark = stage === "aging" ? "hsl(8 45% 26%)" : stage === "mature" ? "hsl(358 70% 32%)" : "hsl(356 72% 36%)";
  const capLight = stage === "aging" ? "hsl(14 42% 42%)" : "hsl(6 82% 56%)";
  const spotColor = "hsl(55 60% 93%)"; // off-white / cream like real warts
  const spotOpacity = stage === "aging" ? 0.45 : stage === "button" ? 0.95 : 0.8;

  const configs: Record<FruitingStage, { capRx: number; capRy: number; stemH: number; capY: number; gillsVisible: boolean; stemW: number }> = {
    button:   { capRx: 11, capRy: 13, stemH: 16, capY: 69, gillsVisible: false, stemW: 4 },
    emerging: { capRx: 15, capRy: 15, stemH: 32, capY: 54, gillsVisible: false, stemW: 4.5 },
    young:    { capRx: 21, capRy: 17, stemH: 42, capY: 42, gillsVisible: false, stemW: 5 },
    mature:   { capRx: 25, capRy: 16, stemH: 48, capY: 36, gillsVisible: true, stemW: 5.5 },
    open:     { capRx: 28, capRy: 12, stemH: 53, capY: 32, gillsVisible: true, stemW: 5 },
    aging:    { capRx: 29, capRy: 10, stemH: 50, capY: 34, gillsVisible: true, stemW: 4.5 },
  };
  const c = configs[stage];
  const cx = 32;

  return (
    <div
      className="absolute z-[1]"
      style={{
        left: x,
        bottom: `${bottom || 0}px`,
        transform: `scale(${scale})${flip ? ' scaleX(-1)' : ''}`,
        transformOrigin: 'bottom center',
        animation: `mushroomGrow ${stage === "button" ? 1.2 : 2}s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both, mushroomSway ${4 + scale * 2}s ease-in-out ${delay + 2.5}s infinite`,
      }}
    >
      <svg width="64" height="86" viewBox="0 0 64 86" fill="none">
        <defs>
          {/* Cap gradient for realistic dome shading */}
          <radialGradient id={`cap-${stage}-${delay}`} cx="0.42" cy="0.32" r="0.7">
            <stop offset="0%" stopColor={capLight} stopOpacity="0.6" />
            <stop offset="45%" stopColor={capMain} />
            <stop offset="100%" stopColor={capDark} />
          </radialGradient>
          {/* Stem gradient for cylindrical shading */}
          <linearGradient id={`stem-${stage}-${delay}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={stemShade} />
            <stop offset="35%" stopColor={stemBase} />
            <stop offset="70%" stopColor={stemBase} />
            <stop offset="100%" stopColor={stemShade} />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx={cx} cy="84" rx={c.stemW + 4} ry="2" fill="hsl(0 0% 10%)" opacity="0.15" />

        {/* Volva (egg cup at base) */}
        <path d={`M${cx - c.stemW - 3} 82 Q${cx - c.stemW - 4} 78 ${cx - c.stemW} 76 L${cx + c.stemW} 76 Q${cx + c.stemW + 4} 78 ${cx + c.stemW + 3} 82 Z`}
          fill="hsl(50 20% 80%)" opacity="0.5" />

        {/* Stem — tapered organic shape with slight bulge */}
        <path
          d={`M${cx - c.stemW} 82 
              C${cx - c.stemW - 1} ${82 - c.stemH * 0.3} ${cx - c.stemW + 0.5} ${82 - c.stemH * 0.6} ${cx - c.stemW + 1.5} ${c.capY + c.capRy - 1}
              L${cx + c.stemW - 1.5} ${c.capY + c.capRy - 1}
              C${cx + c.stemW - 0.5} ${82 - c.stemH * 0.6} ${cx + c.stemW + 1} ${82 - c.stemH * 0.3} ${cx + c.stemW} 82 Z`}
          fill={`url(#stem-${stage}-${delay})`}
        />
        {/* Subtle stem texture lines */}
        {[0.3, 0.5, 0.7].map((t, i) => {
          const sy = c.capY + c.capRy + t * (82 - c.capY - c.capRy);
          return <line key={i} x1={cx - c.stemW + 2} y1={sy} x2={cx + c.stemW - 2} y2={sy} stroke={stemShade} strokeWidth="0.3" opacity="0.15" />;
        })}

        {/* Annulus (skirt ring) — hanging remnant */}
        {stage !== "button" && stage !== "emerging" && (
          <path
            d={`M${cx - c.stemW - 2} ${c.capY + c.capRy + 6} 
                Q${cx - c.stemW} ${c.capY + c.capRy + 10} ${cx} ${c.capY + c.capRy + 9}
                Q${cx + c.stemW} ${c.capY + c.capRy + 10} ${cx + c.stemW + 2} ${c.capY + c.capRy + 6}`}
            stroke={stemRingColor} strokeWidth="1.2" fill="none" opacity="0.6" />
        )}

        {/* Cap — dome shape using a proper arc for convex curvature */}
        <path
          d={`M${cx - c.capRx} ${c.capY + c.capRy * 0.3}
              Q${cx - c.capRx} ${c.capY - c.capRy * 1.1} ${cx} ${c.capY - c.capRy * 1.2}
              Q${cx + c.capRx} ${c.capY - c.capRy * 1.1} ${cx + c.capRx} ${c.capY + c.capRy * 0.3}
              Q${cx} ${c.capY + c.capRy * 0.6} ${cx - c.capRx} ${c.capY + c.capRy * 0.3} Z`}
          fill={`url(#cap-${stage}-${delay})`}
        />
        {/* Cap rim underside shadow */}
        <path
          d={`M${cx - c.capRx + 2} ${c.capY + c.capRy * 0.25} Q${cx} ${c.capY + c.capRy * 0.55} ${cx + c.capRx - 2} ${c.capY + c.capRy * 0.25}`}
          stroke={capDark} strokeWidth="1" fill="none" opacity="0.35" />

        {/* Wart spots — irregular sizes and placement like real specimens */}
        {stage !== "button" && (<>
          <ellipse cx={cx - c.capRx * 0.35} cy={c.capY - c.capRy * 0.55} rx={c.capRx * 0.1} ry={c.capRx * 0.08} fill={spotColor} opacity={spotOpacity} transform={`rotate(-12 ${cx - c.capRx * 0.35} ${c.capY - c.capRy * 0.55})`} />
          <ellipse cx={cx + c.capRx * 0.3} cy={c.capY - c.capRy * 0.7} rx={c.capRx * 0.08} ry={c.capRx * 0.065} fill={spotColor} opacity={spotOpacity} transform={`rotate(8 ${cx + c.capRx * 0.3} ${c.capY - c.capRy * 0.7})`} />
          <ellipse cx={cx - c.capRx * 0.05} cy={c.capY - c.capRy * 0.95} rx={c.capRx * 0.07} ry={c.capRx * 0.06} fill={spotColor} opacity={spotOpacity * 0.9} />
          <ellipse cx={cx + c.capRx * 0.55} cy={c.capY - c.capRy * 0.3} rx={c.capRx * 0.065} ry={c.capRx * 0.05} fill={spotColor} opacity={spotOpacity * 0.7} transform={`rotate(20 ${cx + c.capRx * 0.55} ${c.capY - c.capRy * 0.3})`} />
          <ellipse cx={cx - c.capRx * 0.6} cy={c.capY - c.capRy * 0.15} rx={c.capRx * 0.055} ry={c.capRx * 0.045} fill={spotColor} opacity={spotOpacity * 0.6} transform={`rotate(-25 ${cx - c.capRx * 0.6} ${c.capY - c.capRy * 0.15})`} />
          <ellipse cx={cx + c.capRx * 0.1} cy={c.capY - c.capRy * 0.4} rx={c.capRx * 0.09} ry={c.capRx * 0.07} fill={spotColor} opacity={spotOpacity * 0.75} />
        </>)}
        {(stage === "mature" || stage === "open" || stage === "aging") && (<>
          <ellipse cx={cx + c.capRx * 0.15} cy={c.capY - c.capRy * 0.85} rx={c.capRx * 0.06} ry={c.capRx * 0.05} fill={spotColor} opacity={spotOpacity * 0.65} />
          <ellipse cx={cx - c.capRx * 0.5} cy={c.capY - c.capRy * 0.65} rx={c.capRx * 0.05} ry={c.capRx * 0.04} fill={spotColor} opacity={spotOpacity * 0.5} transform={`rotate(15 ${cx - c.capRx * 0.5} ${c.capY - c.capRy * 0.65})`} />
        </>)}

        {/* Gills — radiating lines visible on open/aging caps */}
        {c.gillsVisible && (<>
          <path d={`M${cx - c.capRx + 3} ${c.capY + c.capRy * 0.3} Q${cx} ${c.capY + c.capRy * 0.65} ${cx + c.capRx - 3} ${c.capY + c.capRy * 0.3}`}
            stroke="hsl(50 25% 82%)" strokeWidth="0.6" fill="none" opacity="0.4" />
          {[...Array(9)].map((_, i) => {
            const t = (i + 1) / 10;
            const gx = cx - c.capRx + 3 + t * (c.capRx * 2 - 6);
            return <line key={i} x1={gx} y1={c.capY + c.capRy * 0.3} x2={cx} y2={c.capY + c.capRy * 0.55} stroke="hsl(50 20% 78%)" strokeWidth="0.35" opacity="0.25" />;
          })}
        </>)}

        {/* Aging — cap edge curling and discoloration */}
        {stage === "aging" && (<>
          <path d={`M${cx - c.capRx} ${c.capY + c.capRy * 0.3} Q${cx - c.capRx - 3} ${c.capY + c.capRy * 0.6} ${cx - c.capRx + 4} ${c.capY + c.capRy * 0.5}`}
            stroke={capDark} strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d={`M${cx + c.capRx} ${c.capY + c.capRy * 0.3} Q${cx + c.capRx + 2} ${c.capY + c.capRy * 0.55} ${cx + c.capRx - 3} ${c.capY + c.capRy * 0.45}`}
            stroke={capDark} strokeWidth="1.2" fill="none" opacity="0.4" />
        </>)}
      </svg>
    </div>
  );
};

const MUSHROOMS: MushroomProps[] = [
  // Left cluster
  { x: "2%", scale: 1.0, delay: 0.2, stage: "mature" },
  { x: "5%", scale: 0.5, delay: 1.5, stage: "button", bottom: 5 },
  { x: "8%", scale: 0.7, delay: 0.9, stage: "young", flip: true },
  { x: "13%", scale: 0.85, delay: 0.4, stage: "open" },
  { x: "16%", scale: 0.45, delay: 2.0, stage: "emerging", bottom: 8 },
  // Center-left scatter
  { x: "28%", scale: 0.35, delay: 1.8, stage: "button", bottom: 3 },
  { x: "33%", scale: 0.6, delay: 1.2, stage: "emerging", flip: true },
  // Center-right scatter
  { x: "55%", scale: 0.5, delay: 1.4, stage: "young" },
  { x: "62%", scale: 0.4, delay: 2.2, stage: "button", bottom: 6, flip: true },
  // Right cluster
  { x: "75%", scale: 0.75, delay: 0.6, stage: "aging", flip: true },
  { x: "80%", scale: 0.9, delay: 0.3, stage: "mature" },
  { x: "83%", scale: 0.5, delay: 1.6, stage: "emerging", bottom: 4 },
  { x: "87%", scale: 1.05, delay: 0.1, stage: "open", flip: true },
  { x: "91%", scale: 0.55, delay: 1.0, stage: "young" },
  { x: "95%", scale: 0.4, delay: 2.4, stage: "button", bottom: 2, flip: true },
];

const Hero = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(!document.documentElement.classList.contains('light'));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: `url(${heroS33d})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/90" />
      </div>

      {/* Sacred Geometry Overlay */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Fairy Dust */}
      <FairyDust />

      {/* Moss ground layer */}
      <div className="absolute bottom-0 left-0 right-0 z-[1] pointer-events-none" style={{ height: '90px' }}>
        <svg width="100%" height="90" viewBox="0 0 1440 90" preserveAspectRatio="none" className="absolute bottom-0">
          {/* Deep moss base */}
          <path d="M0 40 Q60 20 120 32 Q180 10 240 28 Q300 15 360 25 Q420 8 480 22 Q540 12 600 30 Q660 18 720 24 Q780 10 840 28 Q900 16 960 20 Q1020 8 1080 26 Q1140 14 1200 22 Q1260 10 1320 30 Q1380 18 1440 24 L1440 90 L0 90 Z"
            fill="hsl(120 35% 18%)" />
          {/* Mid moss layer */}
          <path d="M0 48 Q40 32 80 42 Q130 28 180 38 Q230 22 280 36 Q340 26 400 34 Q450 20 500 32 Q560 24 620 38 Q680 28 740 34 Q790 22 840 36 Q900 26 960 32 Q1020 20 1080 34 Q1130 24 1180 30 Q1240 18 1300 34 Q1360 26 1440 32 L1440 90 L0 90 Z"
            fill="hsl(118 38% 22%)" />
          {/* Light moss highlights */}
          <path d="M0 56 Q50 42 100 50 Q160 38 220 48 Q290 36 360 46 Q420 34 480 44 Q550 36 620 46 Q690 38 760 44 Q820 32 880 42 Q950 36 1020 44 Q1080 34 1140 42 Q1210 36 1280 44 Q1340 38 1440 42 L1440 90 L0 90 Z"
            fill="hsl(116 32% 26%)" />
          {/* Tiny moss tufts */}
          {[40, 110, 190, 270, 350, 440, 530, 620, 700, 790, 870, 960, 1040, 1130, 1210, 1300, 1380].map((cx, i) => (
            <g key={i}>
              <ellipse cx={cx} cy={42 + (i % 3) * 4} rx={6 + (i % 4)} ry={3 + (i % 2)} fill={`hsl(${112 + (i % 5) * 4} ${30 + (i % 3) * 5}% ${20 + (i % 4) * 3}%)`} opacity={0.6 + (i % 3) * 0.1} />
              <ellipse cx={cx + 12} cy={46 + (i % 2) * 3} rx={4 + (i % 3)} ry={2} fill={`hsl(${125 + (i % 4) * 3} ${35 + (i % 2) * 8}% ${24 + (i % 3) * 2}%)`} opacity={0.5} />
            </g>
          ))}
          {/* Tiny lichen/leaf-litter accents */}
          {[70, 200, 330, 500, 650, 810, 980, 1100, 1260].map((cx, i) => (
            <circle key={`l${i}`} cx={cx} cy={50 + (i % 3) * 5} r={1.5 + (i % 2)} fill={`hsl(${40 + i * 8} ${25 + i * 3}% ${30 + i * 2}%)`} opacity={0.3} />
          ))}
        </svg>
      </div>

      {/* Amanita Mushrooms - staggered fruiting cycle */}
      {MUSHROOMS.map((m, i) => (
        <AmanitaMushroom key={i} {...m} />
      ))}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button variant="mystical" size="lg" className="min-w-[200px]" asChild>
              <Link to="/map">
                <MapPin className="w-5 h-5 mr-2" />
                Arrive on the Atlas
              </Link>
            </Button>
            <Button variant="sacred" size="lg" className="min-w-[200px]" asChild>
              <Link to="/map?addTree=true">
                <TreeDeciduous className="w-5 h-5 mr-2" />
                Claim a Tree Encounter
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">1,247</div>
              <div className="text-sm text-muted-foreground">Ancient Trees</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">87</div>
              <div className="text-sm text-muted-foreground">Species Mapped</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">43</div>
              <div className="text-sm text-muted-foreground">Nations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <style>{`
        @keyframes mushroomGrow {
          0% { transform: scale(0) translateY(15px); opacity: 0; }
          50% { transform: scale(1.06) translateY(-2px); opacity: 0.9; }
          70% { transform: scale(0.97) translateY(1px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes mushroomSway {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(1.2deg); }
          50% { transform: rotate(-0.8deg); }
          80% { transform: rotate(1deg); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
