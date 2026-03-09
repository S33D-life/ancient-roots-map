import { Button } from "@/components/ui/button";
import { MapPin, TreeDeciduous, ExternalLink } from "lucide-react";
import LivingCensus from "@/components/LivingCensus";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

// Ancient Friends gallery — each entry is a painterly tree background
// linked to a real Ancient Friend in the database
const ANCIENT_FRIENDS_GALLERY = [
  {
    image: "/images/hero-trees/ancient-oak-mist.jpeg",
    name: "Grandfather Oak",
    species: "Quercus robur",
    treeId: "a1b2c3d4-1111-4aaa-bbbb-000000000001",
  },
  {
    image: "/images/hero-trees/ancient-yew-twilight.jpeg",
    name: "Fortingall Yew",
    species: "Taxus baccata",
    treeId: "2e4ef3b8-01b7-4f8c-925f-924b259a0df5",
  },
  {
    image: "/images/hero-trees/sequoia-ember.jpeg",
    name: "General Sherman",
    species: "Sequoiadendron giganteum",
    treeId: "5f58348b-9893-4023-8745-948c80933672",
  },
  {
    image: "/images/hero-trees/baobab-dawn.jpeg",
    name: "Big Tree Baobab",
    species: "Adansonia digitata",
    treeId: "bce00dc1-3de0-41be-85bf-d9ad2d276421",
  },
  {
    image: "/images/hero-trees/cherry-blossom-mist.jpeg",
    name: "Jōmon Sugi",
    species: "Cryptomeria japonica",
    treeId: "ad0cb057-1430-4088-89af-5f9b7dd2ecf5",
  },
];

// Fairy dust particle
interface Particle {
  x: number; y: number; size: number; speedX: number; speedY: number;
  opacity: number; fadeSpeed: number; hue: number;
}

const FairyDust = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let particles: Particle[] = [];
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 15 : 60;
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


// AnimatedCounter removed — replaced by LivingCensus component

const Hero = () => {
  const [isDark, setIsDark] = useState(!document.documentElement.classList.contains('light'));
  
  const [isHovering, setIsHovering] = useState(false);
  const [visitorNumber, setVisitorNumber] = useState<number | null>(null);
  const [friendIndex, setFriendIndex] = useState(0);
  const visitRecorded = useRef(false);
  const lastShownIndex = useRef<number | null>(null);

  // Record visit and get assigned Ancient Friend — with improved picker
  useEffect(() => {
    if (visitRecorded.current) return;
    visitRecorded.current = true;
    const recordVisit = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc('record_visit', {
        p_user_id: user?.id ?? null,
      });
      if (data && data.length > 0) {
        setVisitorNumber(data[0].visitor_number);
        let idx = data[0].ancient_friend_index;
        // Avoid showing same tree as last session
        const lastIdx = sessionStorage.getItem("s33d_last_hero_idx");
        if (lastIdx !== null && parseInt(lastIdx) === idx) {
          idx = (idx + 1) % ANCIENT_FRIENDS_GALLERY.length;
        }
        sessionStorage.setItem("s33d_last_hero_idx", String(idx));
        lastShownIndex.current = idx;
        setFriendIndex(idx);
      }
    };
    recordVisit();
  }, []);

  const currentFriend = ANCIENT_FRIENDS_GALLERY[friendIndex];

  // Preload the next image to avoid flicker on re-visits
  const nextFriend = useMemo(() => {
    const nextIdx = (friendIndex + 1) % ANCIENT_FRIENDS_GALLERY.length;
    return ANCIENT_FRIENDS_GALLERY[nextIdx];
  }, [friendIndex]);

  // Preload both images
  useEffect(() => {
    const img1 = new Image();
    img1.src = currentFriend.image;
    const img2 = new Image();
    img2.src = nextFriend.image;
  }, [currentFriend, nextFriend]);

  

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Background — rotating Ancient Friend portrait */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[20s] ease-linear"
        style={{
          backgroundImage: `url(${currentFriend.image})`,
          transform: isHovering ? 'scale(1.08)' : 'scale(1.05)',
        }}
      >
        {/* Cinematic overlay — ensures UI readability */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to bottom, 
                hsl(var(--background) / 0.7) 0%, 
                hsl(var(--background) / 0.45) 30%,
                hsl(var(--background) / 0.35) 50%,
                hsl(var(--background) / 0.5) 70%,
                hsl(var(--background) / 0.92) 100%
              )
            `,
          }}
        />
        {/* Soft vignette edges */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 150px 60px hsl(var(--background) / 0.6)',
          }}
        />
      </div>

      {/* Sacred Geometry Overlay */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Fairy Dust (dark) / Falling Leaves (light) */}
      {isDark ? <FairyDust /> : <FallingLeaves />}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-24 md:pb-8 text-center flex flex-col min-h-screen">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Branding title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif leading-tight">
            The Arboreal Atlas of<br />Ancient Friends
          </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            A living atlas of the world's most ancient trees. Map, explore, and protect.
          </p>

          {/* CTA buttons — above the fold */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-md sm:max-w-none mx-auto pt-2">
            <Button variant="mystical" size="lg" className="min-w-[220px] w-full sm:w-auto text-base h-12 sm:h-11" asChild>
              <Link to="/map">
                <MapPin className="w-5 h-5 mr-2" />
                Explore the Map
              </Link>
            </Button>
            <Button variant="sacred" size="lg" className="min-w-[220px] w-full sm:w-auto text-base h-12 sm:h-11" asChild>
              <Link to="/add-tree">
                <TreeDeciduous className="w-5 h-5 mr-2" />
                Add a Tree
              </Link>
            </Button>
          </div>
        </div>

        {/* Bottom stack: Ancient Friend card — simplified */}
        <div className="flex flex-col items-center gap-4 px-4 mt-auto pb-4">
          {/* Living Census — real-time global counter */}
          <LivingCensus />

          {/* Ancient Friend — featured tree card */}
          <Link
            to={`/tree/${currentFriend.treeId}`}
            className="w-full max-w-xs block group"
          >
            <div
              className="rounded-xl px-4 py-3 backdrop-blur-md border flex items-center gap-3 transition-all duration-300 group-hover:border-primary/40"
              style={{
                background: 'hsl(var(--card) / 0.6)',
                borderColor: 'hsl(var(--border) / 0.3)',
              }}
            >
              <TreeDeciduous className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] text-muted-foreground/60 font-serif">
                  {visitorNumber ? `Visit #${visitorNumber.toLocaleString()}` : "Today's Ancient Friend"}
                </p>
                <p className="font-serif text-sm text-primary truncate">{currentFriend.name}</p>
                <p className="text-[11px] text-muted-foreground/70 italic">{currentFriend.species}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
