import { useEffect, useRef } from "react";

const STAR_COUNT = 120;
const SHOOTING_INTERVAL = 4000;

const StarryNight = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    interface Star {
      x: number;
      y: number;
      r: number;
      twinkleSpeed: number;
      phase: number;
      baseAlpha: number;
    }

    interface ShootingStar {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.8 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
      baseAlpha: Math.random() * 0.5 + 0.3,
    }));

    const shootingStars: ShootingStar[] = [];

    const spawnShooting = () => {
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.3,
        vx: 4 + Math.random() * 3,
        vy: 2 + Math.random() * 2,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        size: Math.random() * 1.5 + 1,
      });
    };

    const shootingTimer = setInterval(spawnShooting, SHOOTING_INTERVAL);

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      t += 1;

      // Static twinkling stars
      for (const s of stars) {
        const alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(45, 80%, 90%, ${Math.max(0.05, alpha)})`;
        ctx.fill();
      }

      // Shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life += 1;
        const progress = ss.life / ss.maxLife;
        const alpha = 1 - progress;

        // Trail
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * 6, ss.y - ss.vy * 6);
        ctx.strokeStyle = `hsla(42, 90%, 75%, ${alpha * 0.6})`;
        ctx.lineWidth = ss.size;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, ss.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(42, 95%, 85%, ${alpha})`;
        ctx.fill();

        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      // Redistribute stars
      for (const s of stars) {
        s.x = Math.random() * width;
        s.y = Math.random() * height;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(shootingTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none dark:opacity-100 opacity-0 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};

export default StarryNight;
