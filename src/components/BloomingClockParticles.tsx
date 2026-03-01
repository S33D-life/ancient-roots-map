/**
 * BloomingClockParticles — GPU-accelerated Canvas particle system
 *
 * "Standing beneath blossoms as petals fall."
 *
 * Renders seasonal particles (petals, fruit dots, golden drops)
 * as a Canvas overlay on the Leaflet map. Viewport-aware,
 * zoom-gated, density-capped, performance-safe.
 */
import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import {
  type FoodCycle,
  type CycleStage,
  type RegionStageInfo,
} from "@/hooks/use-food-cycles";

/* ── Particle types ── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
  stage: CycleStage;
  hue: number;
  shape: "petal" | "dot" | "drop" | "leaf";
}

interface ParticleSource {
  lat: number;
  lng: number;
  stage: CycleStage;
  isPeak: boolean;
  foodIcon: string;
  foodName: string;
}

interface BloomingClockParticlesProps {
  map: L.Map | null;
  sources: ParticleSource[];
  active: boolean;
  lowMotion?: boolean;
  nearbyTrees?: Array<{ lat: number; lng: number }>;
}

/* ── Constants ── */
const MAX_PARTICLES_TOTAL = 200;
const MAX_PARTICLES_PER_SOURCE = 12;
const MIN_ZOOM_FOR_PARTICLES = 3;
const FULL_DENSITY_ZOOM = 6;
const SPAWN_INTERVAL = 180; // ms between spawns per source

/* ── Stage-specific particle configs ── */
const STAGE_PARTICLE_CONFIG: Record<CycleStage, {
  shape: "petal" | "dot" | "drop" | "leaf";
  hueRange: [number, number];
  sizeRange: [number, number];
  speedRange: [number, number];
  opacityRange: [number, number];
  lifetimeRange: [number, number]; // frames
  windDrift: number;
}> = {
  flowering: {
    shape: "petal",
    hueRange: [330, 350],
    sizeRange: [3, 7],
    speedRange: [0.15, 0.4],
    opacityRange: [0.25, 0.55],
    lifetimeRange: [120, 240],
    windDrift: 0.3,
  },
  peak: {
    shape: "petal",
    hueRange: [35, 50],
    sizeRange: [4, 8],
    speedRange: [0.12, 0.35],
    opacityRange: [0.3, 0.6],
    lifetimeRange: [140, 260],
    windDrift: 0.35,
  },
  fruiting: {
    shape: "dot",
    hueRange: [100, 140],
    sizeRange: [2, 4],
    speedRange: [0.05, 0.15],
    opacityRange: [0.15, 0.4],
    lifetimeRange: [90, 180],
    windDrift: 0.05,
  },
  harvest: {
    shape: "drop",
    hueRange: [25, 42],
    sizeRange: [3, 6],
    speedRange: [0.2, 0.5],
    opacityRange: [0.2, 0.5],
    lifetimeRange: [100, 200],
    windDrift: 0.15,
  },
  dormant: {
    shape: "leaf",
    hueRange: [210, 230],
    sizeRange: [2, 3],
    speedRange: [0.02, 0.06],
    opacityRange: [0.06, 0.12],
    lifetimeRange: [200, 400],
    windDrift: 0.02,
  },
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function drawPetal(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number, rotation: number,
  hue: number, opacity: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  // Soft watercolor petal shape
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.8, -size * 0.6, size * 0.6, size * 0.4, 0, size);
  ctx.bezierCurveTo(-size * 0.6, size * 0.4, -size * 0.8, -size * 0.6, 0, -size);
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  grad.addColorStop(0, `hsla(${hue}, 55%, 80%, ${opacity})`);
  grad.addColorStop(0.7, `hsla(${hue}, 45%, 72%, ${opacity * 0.6})`);
  grad.addColorStop(1, `hsla(${hue}, 35%, 65%, 0)`);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number, hue: number, opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
  grad.addColorStop(0, `hsla(${hue}, 45%, 60%, ${opacity})`);
  grad.addColorStop(1, `hsla(${hue}, 40%, 55%, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDrop(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number, rotation: number,
  hue: number, opacity: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  // Teardrop / fruit shape
  ctx.beginPath();
  ctx.moveTo(0, -size * 1.2);
  ctx.bezierCurveTo(size * 0.7, -size * 0.3, size * 0.5, size * 0.6, 0, size);
  ctx.bezierCurveTo(-size * 0.5, size * 0.6, -size * 0.7, -size * 0.3, 0, -size * 1.2);
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  grad.addColorStop(0, `hsla(${hue}, 65%, 60%, ${opacity})`);
  grad.addColorStop(1, `hsla(${hue}, 55%, 50%, 0)`);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const lifeRatio = p.lifetime / p.maxLifetime;
  // Fade in first 20%, fade out last 30%
  let fadeAlpha = 1;
  if (lifeRatio > 0.8) fadeAlpha = (1 - lifeRatio) / 0.2;
  else if (lifeRatio < 0.3) fadeAlpha = lifeRatio / 0.3;
  const alpha = p.opacity * fadeAlpha;

  if (alpha < 0.01) return;

  switch (p.shape) {
    case "petal":
      drawPetal(ctx, p.x, p.y, p.size, p.rotation, p.hue, alpha);
      break;
    case "dot":
      drawDot(ctx, p.x, p.y, p.size, p.hue, alpha);
      break;
    case "drop":
      drawDrop(ctx, p.x, p.y, p.size, p.rotation, p.hue, alpha);
      break;
    case "leaf":
      // Dormant: just a faint dot
      drawDot(ctx, p.x, p.y, p.size * 0.7, p.hue, alpha * 0.5);
      break;
  }
}

export default function BloomingClockParticles({
  map,
  sources,
  active,
  lowMotion = false,
  nearbyTrees,
}: BloomingClockParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef<Map<number, number>>(new Map());
  const visibleRef = useRef(true);

  // Create / remove canvas
  useEffect(() => {
    if (!map || !active) {
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
      }
      particlesRef.current = [];
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const container = map.getContainer();
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.style.cssText = "position:absolute;inset:0;z-index:450;pointer-events:none;";
      container.appendChild(canvas);
      canvasRef.current = canvas;
    }

    const resize = () => {
      if (!canvas) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    };
    resize();

    // Visibility listener — pause when tab hidden
    const onVisChange = () => { visibleRef.current = !document.hidden; };
    document.addEventListener("visibilitychange", onVisChange);

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(container);

    map.on("move", resize);
    map.on("zoom", resize);

    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      resizeObs.disconnect();
      map.off("move", resize);
      map.off("zoom", resize);
      cancelAnimationFrame(rafRef.current);
      if (canvas && canvas.parentNode) {
        canvas.remove();
      }
      canvasRef.current = null;
      particlesRef.current = [];
    };
  }, [map, active]);

  // Animation loop
  useEffect(() => {
    if (!map || !active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const loop = () => {
      if (!running) return;
      if (!visibleRef.current || lowMotion) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w / dpr, h / dpr);

      const zoom = map.getZoom();
      if (zoom < MIN_ZOOM_FOR_PARTICLES) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = Date.now();
      const bounds = map.getBounds();
      const densityScale = Math.min(1, (zoom - MIN_ZOOM_FOR_PARTICLES) / (FULL_DENSITY_ZOOM - MIN_ZOOM_FOR_PARTICLES));

      // Spawn particles from visible sources
      sources.forEach((src, idx) => {
        if (!bounds.contains([src.lat, src.lng])) return;
        if (src.stage === "dormant" && zoom < 7) return;

        const lastSpawn = lastSpawnRef.current.get(idx) || 0;
        const interval = SPAWN_INTERVAL / densityScale;
        if (now - lastSpawn < interval) return;

        // Count existing for this source
        const existing = particlesRef.current.filter(p => p.stage === src.stage).length;
        if (existing >= MAX_PARTICLES_PER_SOURCE / (src.isPeak ? 0.7 : 1)) return;
        if (particlesRef.current.length >= MAX_PARTICLES_TOTAL) return;

        const config = STAGE_PARTICLE_CONFIG[src.stage];
        const pt = map.latLngToContainerPoint([src.lat, src.lng]);

        // Spawn radius — particles appear around the region center
        const spawnRadius = zoom >= 8 ? 30 : zoom >= 5 ? 50 : 80;

        const particle: Particle = {
          x: pt.x + rand(-spawnRadius, spawnRadius),
          y: pt.y + rand(-spawnRadius * 0.5, spawnRadius * 0.3),
          vx: rand(-config.windDrift, config.windDrift),
          vy: rand(config.speedRange[0], config.speedRange[1]),
          opacity: rand(config.opacityRange[0], config.opacityRange[1]) * densityScale,
          rotation: rand(0, Math.PI * 2),
          rotationSpeed: rand(-0.015, 0.015),
          size: rand(config.sizeRange[0], config.sizeRange[1]) * (zoom >= 7 ? 1.2 : 0.85),
          lifetime: 0,
          maxLifetime: rand(config.lifetimeRange[0], config.lifetimeRange[1]),
          stage: src.stage,
          hue: rand(config.hueRange[0], config.hueRange[1]),
          shape: config.shape,
        };

        particlesRef.current.push(particle);
        lastSpawnRef.current.set(idx, now);
      });

      // Update & draw particles
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.lifetime++;
        if (p.lifetime >= p.maxLifetime) continue;

        // Wind: gentle sinusoidal drift
        const windPhase = Math.sin(p.lifetime * 0.02 + p.x * 0.01);
        p.x += p.vx + windPhase * 0.15;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Cull offscreen
        if (p.x < -20 || p.x > w / dpr + 20 || p.y < -20 || p.y > h / dpr + 20) continue;

        drawParticle(ctx, p);
        alive.push(p);
      }
      particlesRef.current = alive;

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [map, active, sources, lowMotion]);

  return null;
}
