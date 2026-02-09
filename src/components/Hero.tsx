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

// Generate deterministic wart spots based on cap size — dense scatter like real specimens
const generateSpots = (cx: number, capRx: number, capRy: number, capY: number, stage: FruitingStage) => {
  const spots: { x: number; y: number; rx: number; ry: number; rot: number; op: number }[] = [];
  if (stage === "button") return spots;
  // Dense coverage like the reference photo — many small bumpy warts
  const count = stage === "emerging" ? 8 : stage === "young" ? 14 : 20;
  const seed = capRx * 100 + capRy * 10;
  for (let i = 0; i < count; i++) {
    const angle = ((seed + i * 137.5) % 360) * Math.PI / 180; // golden angle scatter
    const dist = 0.25 + ((seed * (i + 1) * 7) % 100) / 160; // 0.25-0.88 from center
    const px = cx + Math.cos(angle) * capRx * dist * 0.85;
    const py = capY - Math.sin(angle) * capRy * dist * 0.9 - capRy * 0.2;
    const baseSize = capRx * (0.035 + ((seed * i * 3) % 50) / 1200);
    spots.push({
      x: px, y: py,
      rx: baseSize * (0.8 + ((i * 13) % 10) / 20),
      ry: baseSize * (0.7 + ((i * 7) % 10) / 25),
      rot: ((seed + i * 23) % 40) - 20,
      op: stage === "aging" ? 0.35 + (i % 3) * 0.08 : 0.7 + (i % 4) * 0.06,
    });
  }
  return spots;
};

const AmanitaMushroom = ({ x, scale, delay, flip, stage, bottom }: MushroomProps) => {
  // Bright white stems like the reference photo
  const stemBase = stage === "aging" ? "hsl(40 15% 62%)" : "hsl(45 18% 90%)";
  const stemShade = stage === "aging" ? "hsl(36 12% 50%)" : "hsl(42 14% 78%)";
  const stemRingColor = stage === "aging" ? "hsl(40 12% 55%)" : "hsl(44 16% 82%)";
  // Vivid scarlet like the reference — bright red, not dark
  const capMain = stage === "aging" ? "hsl(8 55% 38%)" : stage === "mature" ? "hsl(2 82% 48%)" : stage === "open" ? "hsl(0 80% 46%)" : "hsl(358 85% 50%)";
  const capDark = stage === "aging" ? "hsl(4 48% 28%)" : "hsl(356 75% 36%)";
  const capLight = stage === "aging" ? "hsl(12 45% 45%)" : "hsl(4 88% 58%)";
  const spotColor = "hsl(48 40% 94%)"; // cream white warts

  const configs: Record<FruitingStage, { capRx: number; capRy: number; stemH: number; capY: number; gillsVisible: boolean; stemW: number }> = {
    button:   { capRx: 10, capRy: 12, stemH: 14, capY: 71, gillsVisible: false, stemW: 3.5 },
    emerging: { capRx: 14, capRy: 14, stemH: 28, capY: 57, gillsVisible: false, stemW: 4 },
    young:    { capRx: 20, capRy: 14, stemH: 38, capY: 46, gillsVisible: false, stemW: 5 },
    mature:   { capRx: 26, capRy: 14, stemH: 46, capY: 38, gillsVisible: true, stemW: 6 },
    open:     { capRx: 28, capRy: 11, stemH: 50, capY: 34, gillsVisible: true, stemW: 5.5 },
    aging:    { capRx: 27, capRy: 9, stemH: 48, capY: 36, gillsVisible: true, stemW: 5 },
  };
  const c = configs[stage];
  const cx = 32;
  const spots = generateSpots(cx, c.capRx, c.capRy, c.capY, stage);

  return (
    <div
      className="absolute z-[4]"
      style={{
        left: x,
        top: `${130 + (bottom || 0)}px`,
        transform: `scale(${scale})${flip ? ' scaleX(-1)' : ''}`,
        transformOrigin: 'top center',
        animation: `mushroomGrow ${stage === "button" ? 1.2 : 2}s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both, mushroomSway ${4 + scale * 2}s ease-in-out ${delay + 2.5}s infinite`,
      }}
    >
      <svg width="64" height="88" viewBox="0 0 64 88" fill="none">
        <defs>
          <radialGradient id={`cap-${stage}-${delay}`} cx="0.4" cy="0.3" r="0.72">
            <stop offset="0%" stopColor={capLight} stopOpacity="0.7" />
            <stop offset="40%" stopColor={capMain} />
            <stop offset="85%" stopColor={capDark} />
          </radialGradient>
          <linearGradient id={`stem-${stage}-${delay}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={stemShade} />
            <stop offset="30%" stopColor={stemBase} />
            <stop offset="70%" stopColor={stemBase} />
            <stop offset="100%" stopColor={stemShade} />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx={cx} cy="86" rx={c.stemW + 5} ry="2.5" fill="hsl(0 0% 8%)" opacity="0.12" />

        {/* Volva (bulbous base) */}
        <ellipse cx={cx} cy="82" rx={c.stemW + 2} ry="4" fill="hsl(48 16% 84%)" opacity="0.45" />

        {/* Stem — thick, cylindrical, white like the reference */}
        <path
          d={`M${cx - c.stemW} 84
              C${cx - c.stemW - 0.5} ${84 - c.stemH * 0.35} ${cx - c.stemW + 1} ${84 - c.stemH * 0.65} ${cx - c.stemW + 2} ${c.capY + c.capRy}
              L${cx + c.stemW - 2} ${c.capY + c.capRy}
              C${cx + c.stemW - 1} ${84 - c.stemH * 0.65} ${cx + c.stemW + 0.5} ${84 - c.stemH * 0.35} ${cx + c.stemW} 84 Z`}
          fill={`url(#stem-${stage}-${delay})`}
        />
        {/* Subtle vertical fibre lines on stem */}
        {[-2, -0.5, 1, 2.5].map((off, i) => (
          <line key={`f${i}`} x1={cx + off} y1={c.capY + c.capRy + 2} x2={cx + off * 0.8} y2={82} stroke={stemShade} strokeWidth="0.25" opacity="0.1" />
        ))}

        {/* Annulus (hanging skirt) */}
        {stage !== "button" && stage !== "emerging" && (
          <path
            d={`M${cx - c.stemW - 1} ${c.capY + c.capRy + 5}
                Q${cx - 2} ${c.capY + c.capRy + 10} ${cx} ${c.capY + c.capRy + 9}
                Q${cx + 2} ${c.capY + c.capRy + 10} ${cx + c.stemW + 1} ${c.capY + c.capRy + 5}`}
            stroke={stemRingColor} strokeWidth="1" fill="none" opacity="0.55" />
        )}

        {/* Cap — wide convex dome, wider than tall like the photo */}
        <path
          d={`M${cx - c.capRx} ${c.capY + c.capRy * 0.35}
              C${cx - c.capRx} ${c.capY - c.capRy * 0.8} ${cx - c.capRx * 0.5} ${c.capY - c.capRy * 1.3} ${cx} ${c.capY - c.capRy * 1.35}
              C${cx + c.capRx * 0.5} ${c.capY - c.capRy * 1.3} ${cx + c.capRx} ${c.capY - c.capRy * 0.8} ${cx + c.capRx} ${c.capY + c.capRy * 0.35}
              Q${cx} ${c.capY + c.capRy * 0.7} ${cx - c.capRx} ${c.capY + c.capRy * 0.35} Z`}
          fill={`url(#cap-${stage}-${delay})`}
        />
        {/* Cap edge highlight — rim catching light */}
        <path
          d={`M${cx - c.capRx + 1} ${c.capY + c.capRy * 0.3} Q${cx} ${c.capY + c.capRy * 0.6} ${cx + c.capRx - 1} ${c.capY + c.capRy * 0.3}`}
          stroke={capLight} strokeWidth="0.6" fill="none" opacity="0.2" />
        {/* Cap underside shadow */}
        <path
          d={`M${cx - c.capRx + 2} ${c.capY + c.capRy * 0.3} Q${cx} ${c.capY + c.capRy * 0.65} ${cx + c.capRx - 2} ${c.capY + c.capRy * 0.3}`}
          stroke={capDark} strokeWidth="0.8" fill="none" opacity="0.3" />

        {/* Dense wart spots — many small cream bumps */}
        {spots.map((s, i) => (
          <ellipse key={`s${i}`} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={spotColor} opacity={s.op}
            transform={`rotate(${s.rot} ${s.x} ${s.y})`} />
        ))}

        {/* Gills */}
        {c.gillsVisible && (<>
          <path d={`M${cx - c.capRx + 3} ${c.capY + c.capRy * 0.32} Q${cx} ${c.capY + c.capRy * 0.68} ${cx + c.capRx - 3} ${c.capY + c.capRy * 0.32}`}
            stroke="hsl(48 22% 85%)" strokeWidth="0.5" fill="none" opacity="0.35" />
          {[...Array(11)].map((_, i) => {
            const t = (i + 1) / 12;
            const gx = cx - c.capRx + 3 + t * (c.capRx * 2 - 6);
            return <line key={i} x1={gx} y1={c.capY + c.capRy * 0.32} x2={cx} y2={c.capY + c.capRy * 0.58} stroke="hsl(48 18% 82%)" strokeWidth="0.3" opacity="0.2" />;
          })}
        </>)}

        {/* Aging — curled edges */}
        {stage === "aging" && (<>
          <path d={`M${cx - c.capRx} ${c.capY + c.capRy * 0.35} Q${cx - c.capRx - 2} ${c.capY + c.capRy * 0.7} ${cx - c.capRx + 4} ${c.capY + c.capRy * 0.55}`}
            stroke={capDark} strokeWidth="1.3" fill="none" opacity="0.45" />
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

      {/* Moss ground layer — lush with pine needles like forest floor */}
      <div className="absolute top-[130px] left-0 right-0 z-[3] pointer-events-none" style={{ height: '110px' }}>
        <svg width="100%" height="110" viewBox="0 0 1440 110" preserveAspectRatio="none" className="absolute bottom-0">
          {/* Dark humus / soil base */}
          <rect x="0" y="65" width="1440" height="45" fill="hsl(25 20% 12%)" />
          {/* Deep moss base — dark green */}
          <path d="M0 50 Q30 35 60 42 Q90 28 120 38 Q150 24 180 36 Q210 20 240 34 Q270 26 300 30 Q330 18 360 32 Q390 22 420 28 Q450 16 480 30 Q510 20 540 34 Q570 26 600 28 Q630 18 660 32 Q690 24 720 30 Q750 16 780 28 Q810 22 840 34 Q870 28 900 26 Q930 18 960 32 Q990 24 1020 28 Q1050 16 1080 34 Q1110 22 1140 30 Q1170 20 1200 28 Q1230 18 1260 34 Q1290 26 1320 30 Q1350 18 1380 28 Q1410 24 1440 32 L1440 110 L0 110 Z"
            fill="hsl(120 30% 16%)" />
          {/* Mid moss — brighter green */}
          <path d="M0 58 Q40 44 80 52 Q120 38 160 48 Q200 34 240 46 Q280 38 320 42 Q360 30 400 44 Q440 36 480 42 Q520 30 560 44 Q600 38 640 42 Q680 32 720 44 Q760 36 800 40 Q840 30 880 42 Q920 36 960 40 Q1000 28 1040 42 Q1080 34 1120 40 Q1160 30 1200 42 Q1240 36 1280 40 Q1320 30 1360 42 Q1400 36 1440 40 L1440 110 L0 110 Z"
            fill="hsl(115 35% 22%)" />
          {/* Light moss top — yellow-green highlights */}
          <path d="M0 64 Q50 52 100 58 Q160 46 220 56 Q280 44 340 54 Q400 42 460 52 Q520 44 580 54 Q640 46 700 52 Q760 42 820 50 Q880 44 940 52 Q1000 42 1060 50 Q1120 44 1180 50 Q1240 42 1300 50 Q1360 44 1440 48 L1440 110 L0 110 Z"
            fill="hsl(110 28% 28%)" />
          {/* Clumpy moss tufts — bumpy organic shapes */}
          {[20, 65, 120, 175, 240, 300, 370, 430, 500, 560, 630, 700, 760, 830, 890, 960, 1020, 1090, 1150, 1220, 1290, 1350, 1410].map((px, i) => (
            <g key={`t${i}`}>
              <ellipse cx={px} cy={50 + (i % 4) * 3} rx={8 + (i % 5) * 2} ry={4 + (i % 3)} fill={`hsl(${108 + (i % 6) * 5} ${28 + (i % 4) * 5}% ${18 + (i % 5) * 3}%)`} opacity={0.7} />
              <ellipse cx={px + 6} cy={48 + (i % 3) * 4} rx={4 + (i % 3)} ry={2.5} fill={`hsl(${90 + (i % 5) * 8} ${32 + (i % 3) * 6}% ${26 + (i % 4) * 3}%)`} opacity={0.5} />
            </g>
          ))}
          {/* Pine needles — thin brown/orange lines scattered on the forest floor */}
          {[35, 95, 155, 230, 310, 385, 465, 545, 625, 710, 785, 865, 945, 1030, 1110, 1195, 1275, 1355].map((px, i) => {
            const angle = ((i * 37 + 15) % 60) - 30;
            const len = 8 + (i % 4) * 3;
            const ny = 58 + (i % 3) * 6;
            return (
              <g key={`n${i}`} transform={`rotate(${angle} ${px} ${ny})`}>
                <line x1={px - len / 2} y1={ny} x2={px + len / 2} y2={ny} stroke={`hsl(${25 + (i % 4) * 8} ${30 + (i % 3) * 10}% ${28 + (i % 5) * 4}%)`} strokeWidth="0.6" opacity="0.35" />
                {i % 3 === 0 && <line x1={px - len / 3} y1={ny + 2} x2={px + len / 3} y2={ny + 2} stroke={`hsl(${30 + i * 5} 25% 32%)`} strokeWidth="0.4" opacity="0.25" />}
              </g>
            );
          })}
          {/* Small leaf litter and lichen */}
          {[50, 140, 260, 380, 510, 640, 770, 900, 1040, 1170, 1310].map((px, i) => (
            <g key={`ll${i}`}>
              <ellipse cx={px} cy={62 + (i % 3) * 4} rx={2 + (i % 2)} ry={1.5} fill={`hsl(${35 + i * 10} ${20 + i * 2}% ${25 + i * 2}%)`} opacity="0.3" transform={`rotate(${(i * 25) % 90} ${px} ${62 + (i % 3) * 4})`} />
            </g>
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
