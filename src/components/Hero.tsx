import { Button } from "@/components/ui/button";
import { MapPin, TreeDeciduous } from "lucide-react";
import heroS33d from "@/assets/hero-s33d.jpeg";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

// Fairy dust particle
interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeSpeed: number;
  hue: number;
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

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: -Math.random() * 0.5 - 0.2,
      opacity: Math.random() * 0.8 + 0.2,
      fadeSpeed: Math.random() * 0.005 + 0.002,
      hue: Math.random() > 0.5 ? 45 : 120, // gold or green
    });

    // Init particles
    for (let i = 0; i < 60; i++) particles.push(spawnParticle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.speedX + Math.sin(Date.now() * 0.001 + i) * 0.3;
        p.y += p.speedY;
        p.opacity -= p.fadeSpeed;

        if (p.opacity <= 0 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[i] = spawnParticle();
          particles[i].y = canvas.height + 10;
          return;
        }

        // Glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.opacity})`);
        gradient.addColorStop(0.4, `hsla(${p.hue}, 70%, 60%, ${p.opacity * 0.4})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 60%, 50%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${p.hue}, 90%, 85%, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[2]" />;
};

// Amanita mushroom SVG component
const AmanitaMushroom = ({ x, scale, delay, flip }: { x: string; scale: number; delay: number; flip?: boolean }) => (
  <div
    className="absolute bottom-0 z-[1]"
    style={{
      left: x,
      transform: `scale(${scale})${flip ? ' scaleX(-1)' : ''}`,
      transformOrigin: 'bottom center',
      animation: `mushroomGrow 1.5s ease-out ${delay}s both, mushroomSway 4s ease-in-out ${delay + 1.5}s infinite`,
    }}
  >
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
      {/* Stem */}
      <path d="M26 80 C26 55 24 45 25 38 Q27 35 30 35 Q33 35 35 38 C36 45 34 55 34 80" fill="hsl(45 30% 75%)" opacity="0.9" />
      {/* Stem spots */}
      <ellipse cx="30" cy="60" rx="3" ry="2" fill="hsl(45 20% 65%)" opacity="0.5" />
      {/* Cap */}
      <ellipse cx="30" cy="36" rx="26" ry="20" fill="hsl(0 65% 35%)" />
      <ellipse cx="30" cy="34" rx="24" ry="18" fill="hsl(0 70% 40%)" />
      {/* Cap highlight */}
      <ellipse cx="24" cy="28" rx="10" ry="6" fill="hsl(0 75% 48%)" opacity="0.4" />
      {/* White spots */}
      <circle cx="20" cy="28" r="3.5" fill="hsl(45 80% 90%)" opacity="0.85" />
      <circle cx="34" cy="25" r="2.8" fill="hsl(45 80% 90%)" opacity="0.85" />
      <circle cx="26" cy="20" r="2.5" fill="hsl(45 80% 90%)" opacity="0.8" />
      <circle cx="40" cy="32" r="2" fill="hsl(45 80% 90%)" opacity="0.75" />
      <circle cx="16" cy="36" r="2.2" fill="hsl(45 80% 90%)" opacity="0.7" />
      <circle cx="38" cy="40" r="1.8" fill="hsl(45 80% 90%)" opacity="0.65" />
      <circle cx="30" cy="32" r="2" fill="hsl(45 80% 90%)" opacity="0.7" />
      {/* Gills */}
      <path d="M8 36 Q30 42 52 36" stroke="hsl(45 30% 70%)" strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  </div>
);

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

      {/* Amanita Mushrooms */}
      <AmanitaMushroom x="5%" scale={0.8} delay={0.3} />
      <AmanitaMushroom x="12%" scale={0.55} delay={0.8} flip />
      <AmanitaMushroom x="78%" scale={0.7} delay={0.5} />
      <AmanitaMushroom x="88%" scale={0.9} delay={0.1} flip />
      <AmanitaMushroom x="92%" scale={0.5} delay={1.0} />
      <AmanitaMushroom x="45%" scale={0.4} delay={1.2} />
      <AmanitaMushroom x="60%" scale={0.6} delay={0.7} flip />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              variant="mystical" 
              size="lg" 
              className="min-w-[200px]"
              asChild
            >
              <Link to="/map">
                <MapPin className="w-5 h-5 mr-2" />
                Arrive on the Atlas
              </Link>
            </Button>
            
            <Button 
              variant="sacred" 
              size="lg" 
              className="min-w-[200px]"
              asChild
            >
              <Link to="/map?addTree=true">
                <TreeDeciduous className="w-5 h-5 mr-2" />
                Claim a Tree Encounter
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">
                1,247
              </div>
              <div className="text-sm text-muted-foreground">Ancient Trees</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">
                87
              </div>
              <div className="text-sm text-muted-foreground">Species Mapped</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">
                43
              </div>
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
