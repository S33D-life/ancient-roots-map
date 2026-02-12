import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 18;
const COLORS = [
  "hsla(42, 95%, 55%, 0.6)",
  "hsla(45, 100%, 70%, 0.45)",
  "hsla(120, 45%, 50%, 0.35)",
  "hsla(28, 70%, 55%, 0.4)",
  "hsla(42, 88%, 45%, 0.5)",
];

interface Particle {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  color: string;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
}

const VaultParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 1.5 + Math.random() * 2.5,
      speed: 0.15 + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.3 + Math.random() * 0.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles.current) {
        p.y -= p.speed;
        p.x += p.drift + Math.sin(p.pulse) * 0.15;
        p.pulse += p.pulseSpeed;

        // Wrap around
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const glowR = p.r + Math.sin(p.pulse) * 1;
        const alpha = p.opacity * (0.7 + Math.sin(p.pulse) * 0.3);

        // Outer glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR * 4);
        grad.addColorStop(0, p.color.replace(/[\d.]+\)$/, `${alpha})`));
        grad.addColorStop(1, p.color.replace(/[\d.]+\)$/, "0)"));
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${Math.min(alpha + 0.3, 1)})`);
        ctx.fill();
      }

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1]"
      aria-hidden="true"
    />
  );
};

export default VaultParticles;
