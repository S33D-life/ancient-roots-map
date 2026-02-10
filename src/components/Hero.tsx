import { Button } from "@/components/ui/button";
import { MapPin, TreeDeciduous } from "lucide-react";
import heroS33d from "@/assets/hero-s33d.jpeg";
import teotagLogo from "@/assets/teotag.jpeg";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import AmanitaFlush from "@/components/AmanitaFlush";
import { supabase } from "@/integrations/supabase/client";

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

// Falling leaves for light/day mode
interface Leaf {
  x: number; y: number; size: number; rotation: number; rotSpeed: number;
  speedX: number; speedY: number; opacity: number; hue: number; drift: number;
}

const FallingLeaves = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let leaves: Leaf[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const spawnLeaf = (randomY = false): Leaf => ({
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -20 - Math.random() * 40,
      size: Math.random() * 8 + 5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: Math.random() * 0.4 + 0.3,
      opacity: Math.random() * 0.4 + 0.2,
      hue: [42, 30, 75, 90, 18][Math.floor(Math.random() * 5)],
      drift: Math.random() * Math.PI * 2,
    });

    for (let i = 0; i < 25; i++) leaves.push(spawnLeaf(true));

    const drawLeaf = (l: Leaf) => {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);
      ctx.globalAlpha = l.opacity;
      ctx.beginPath();
      ctx.moveTo(0, -l.size);
      ctx.bezierCurveTo(l.size * 0.6, -l.size * 0.5, l.size * 0.5, l.size * 0.3, 0, l.size);
      ctx.bezierCurveTo(-l.size * 0.5, l.size * 0.3, -l.size * 0.6, -l.size * 0.5, 0, -l.size);
      ctx.fillStyle = `hsla(${l.hue}, 55%, 45%, 1)`;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -l.size * 0.8);
      ctx.lineTo(0, l.size * 0.8);
      ctx.strokeStyle = `hsla(${l.hue}, 40%, 35%, 0.5)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    };

    let t = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.01;
      leaves.forEach((l, i) => {
        l.x += l.speedX + Math.sin(t * 2 + l.drift) * 0.5;
        l.y += l.speedY;
        l.rotation += l.rotSpeed;
        if (l.y > canvas.height + 20 || l.x < -30 || l.x > canvas.width + 30) {
          leaves[i] = spawnLeaf();
        }
        drawLeaf(l);
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[2]" />;
};


const AnimatedCounter = ({ target, label }: { target: number; label: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div className="space-y-2" ref={ref}>
      <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">{count.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

const Hero = () => {
  const [isDark, setIsDark] = useState(!document.documentElement.classList.contains('light'));
  const [stats, setStats] = useState({ trees: 0, species: 0, nations: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('trees').select('species, nation');
      if (data) {
        const species = new Set(data.map(t => t.species).filter(Boolean));
        const nations = new Set(data.map(t => t.nation).filter(Boolean));
        setStats({ trees: data.length, species: species.size, nations: nations.size });
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-top scale-110"
        style={{ backgroundImage: `url(${heroS33d})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/60 to-background/95" />
      </div>

      {/* Sacred Geometry Overlay */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Fairy Dust (dark) / Falling Leaves (light) */}
      {isDark ? <FairyDust /> : <FallingLeaves />}


      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 text-center flex flex-col min-h-screen justify-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <AnimatedCounter target={stats.trees} label="Ancient Trees" />
            <AnimatedCounter target={stats.species} label="Species Mapped" />
            <AnimatedCounter target={stats.nations} label="Nations" />
          </div>
        </div>

        {/* CTA buttons pinned near bottom */}
        <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center gap-4 px-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
          <img 
            src={teotagLogo} 
            alt="Teotag" 
            className="w-14 h-14 rounded-full border-2 border-primary/40 shadow-lg mt-2 opacity-90"
          />
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

    </section>
  );
};

export default Hero;
