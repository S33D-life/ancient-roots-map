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

    // Shooting stars removed for cleaner aesthetic

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
