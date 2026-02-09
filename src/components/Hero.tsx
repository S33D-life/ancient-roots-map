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
  const stemColor = stage === "aging" ? "hsl(40 25% 60%)" : "hsl(48 35% 82%)";
  const stemRingColor = stage === "aging" ? "hsl(40 20% 50%)" : "hsl(45 30% 72%)";
  const capHue = stage === "aging" ? "8 55% 32%" : stage === "mature" ? "0 72% 42%" : "356 68% 45%";
  const capHighlight = stage === "aging" ? "8 50% 38%" : "0 78% 52%";
  const spotOpacity = stage === "aging" ? 0.5 : stage === "button" ? 0.9 : 0.82;

  const configs: Record<FruitingStage, { capRx: number; capRy: number; stemH: number; capY: number; gillsVisible: boolean }> = {
    button:   { capRx: 10, capRy: 12, stemH: 18, capY: 68, gillsVisible: false },
    emerging: { capRx: 16, capRy: 16, stemH: 35, capY: 52, gillsVisible: false },
    young:    { capRx: 22, capRy: 18, stemH: 45, capY: 40, gillsVisible: false },
    mature:   { capRx: 26, capRy: 18, stemH: 50, capY: 34, gillsVisible: true },
    open:     { capRx: 28, capRy: 14, stemH: 55, capY: 30, gillsVisible: true },
    aging:    { capRx: 30, capRy: 12, stemH: 52, capY: 32, gillsVisible: true },
  };
  const c = configs[stage];

  return (
    <div
      className="absolute z-[1]"
      style={{
        left: x,
        bottom: `${bottom || 0}px`,
        transform: `scale(${scale})${flip ? ' scaleX(-1)' : ''}`,
        transformOrigin: 'bottom center',
        animation: `mushroomGrow ${stage === "button" ? 1 : 1.8}s ease-out ${delay}s both, mushroomSway ${3.5 + scale}s ease-in-out ${delay + 2}s infinite`,
      }}
    >
      <svg width="64" height="82" viewBox="0 0 64 82" fill="none">
        {/* Stem */}
        <path
          d={`M28 82 C27 ${82 - c.stemH * 0.4} 25 ${82 - c.stemH * 0.7} 26 ${c.capY + c.capRy - 2} Q30 ${c.capY + c.capRy - 6} 32 ${c.capY + c.capRy - 2} C37 ${82 - c.stemH * 0.7} 35 ${82 - c.stemH * 0.4} 34 82`}
          fill={stemColor}
        />
        {/* Stem ring / skirt */}
        {stage !== "button" && stage !== "emerging" && (
          <ellipse cx="31" cy={c.capY + c.capRy + 8} rx={stage === "aging" ? 8 : 6} ry="2.5" fill={stemRingColor} opacity="0.7" />
        )}
        {/* Volva at base */}
        <ellipse cx="31" cy="79" rx="8" ry="3" fill="hsl(48 25% 78%)" opacity="0.5" />
        {/* Cap */}
        <ellipse cx="32" cy={c.capY} rx={c.capRx} ry={c.capRy} fill={`hsl(${capHue})`} />
        <ellipse cx="32" cy={c.capY - 1.5} rx={c.capRx - 2} ry={c.capRy - 2} fill={`hsl(${capHue})`} opacity="0.9" />
        {/* Cap highlight */}
        <ellipse cx={28} cy={c.capY - c.capRy * 0.3} rx={c.capRx * 0.45} ry={c.capRy * 0.35} fill={`hsl(${capHighlight})`} opacity="0.3" />
        {/* White wart spots */}
        {stage !== "button" && (
          <>
            <circle cx={32 - c.capRx * 0.4} cy={c.capY - c.capRy * 0.3} r={c.capRx * 0.12} fill="hsl(50 80% 92%)" opacity={spotOpacity} />
            <circle cx={32 + c.capRx * 0.35} cy={c.capY - c.capRy * 0.45} r={c.capRx * 0.1} fill="hsl(50 80% 92%)" opacity={spotOpacity} />
            <circle cx={32 - c.capRx * 0.1} cy={c.capY - c.capRy * 0.65} r={c.capRx * 0.09} fill="hsl(50 80% 92%)" opacity={spotOpacity * 0.9} />
            <circle cx={32 + c.capRx * 0.55} cy={c.capY - c.capRy * 0.1} r={c.capRx * 0.07} fill="hsl(50 80% 92%)" opacity={spotOpacity * 0.8} />
            <circle cx={32 - c.capRx * 0.6} cy={c.capY + c.capRy * 0.1} r={c.capRx * 0.08} fill="hsl(50 80% 92%)" opacity={spotOpacity * 0.7} />
          </>
        )}
        {(stage === "mature" || stage === "open" || stage === "aging") && (
          <>
            <circle cx={32 + c.capRx * 0.15} cy={c.capY - c.capRy * 0.2} r={c.capRx * 0.11} fill="hsl(50 80% 92%)" opacity={spotOpacity * 0.85} />
            <circle cx={32 - c.capRx * 0.55} cy={c.capY - c.capRy * 0.5} r={c.capRx * 0.06} fill="hsl(50 80% 92%)" opacity={spotOpacity * 0.65} />
          </>
        )}
        {/* Gills */}
        {c.gillsVisible && (
          <>
            <path d={`M${32 - c.capRx + 4} ${c.capY + c.capRy - 2} Q32 ${c.capY + c.capRy + 4} ${32 + c.capRx - 4} ${c.capY + c.capRy - 2}`}
              stroke="hsl(48 30% 78%)" strokeWidth="0.8" fill="none" opacity="0.5" />
            {[...Array(7)].map((_, i) => {
              const t = (i + 1) / 8;
              const gx = 32 - c.capRx + 4 + t * (c.capRx * 2 - 8);
              return <line key={i} x1={gx} y1={c.capY + c.capRy - 2} x2={32} y2={c.capY + c.capRy + 2} stroke="hsl(48 25% 72%)" strokeWidth="0.4" opacity="0.3" />;
            })}
          </>
        )}
        {/* Aging curl */}
        {stage === "aging" && (
          <path d={`M${32 - c.capRx} ${c.capY + c.capRy - 1} Q${32 - c.capRx - 2} ${c.capY + c.capRy + 4} ${32 - c.capRx + 3} ${c.capY + c.capRy + 3}`}
            stroke={`hsl(${capHue})`} strokeWidth="2" fill="none" opacity="0.6" />
        )}
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
          0% { transform: scale(0) translateY(20px); opacity: 0; }
          60% { transform: scale(1.1) translateY(-3px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes mushroomSway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
