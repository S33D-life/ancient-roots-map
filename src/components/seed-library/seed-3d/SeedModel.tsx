import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FallbackShape } from "./seed-configs";

/* ── Procedural seed geometries ─────────────────────────────── */

function AcornGeometry({ color, accent }: { color: string; accent: string }) {
  const nutRef = useRef<THREE.Mesh>(null!);
  const capRef = useRef<THREE.Mesh>(null!);

  const nutGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.38, 24, 20);
    // elongate slightly
    geo.scale(1, 1.35, 1);
    return geo;
  }, []);

  const capGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.38);
    return geo;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Nut body */}
      <mesh ref={nutRef} geometry={nutGeo} position={[0, -0.08, 0]}>
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Cap */}
      <mesh ref={capRef} geometry={capGeo} position={[0, 0.28, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color={accent} roughness={0.7} metalness={0.02} />
      </mesh>
      {/* Tiny stem */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.14, 8]} />
        <meshStandardMaterial color="#4A3520" roughness={0.8} />
      </mesh>
    </group>
  );
}

function CornGeometry({ color, accent }: { color: string; accent: string }) {
  const kernelColors = useMemo(
    () => ["#C4A84D", "#8B2252", "#2255AA", "#CC6633", "#4488AA", accent],
    [accent],
  );

  const cobGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.22, 0.18, 1.1, 12, 1);
    return geo;
  }, []);

  // Create kernel "bumps" as small spheres in bands
  const kernels = useMemo(() => {
    const items: { pos: [number, number, number]; col: string }[] = [];
    const rows = 8;
    const perRow = 10;
    for (let r = 0; r < rows; r++) {
      const y = -0.45 + r * 0.125;
      const radius = 0.23 - Math.abs(r - 3.5) * 0.008;
      const bandColor = kernelColors[r % kernelColors.length];
      for (let k = 0; k < perRow; k++) {
        const angle = (k / perRow) * Math.PI * 2 + (r % 2) * (Math.PI / perRow);
        items.push({
          pos: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
          col: bandColor,
        });
      }
    }
    return items;
  }, [kernelColors]);

  return (
    <group rotation={[0, 0, Math.PI * 0.08]}>
      {/* Inner cob */}
      <mesh geometry={cobGeo}>
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
      {/* Kernels */}
      {kernels.map((k, i) => (
        <mesh key={i} position={k.pos}>
          <sphereGeometry args={[0.048, 6, 6]} />
          <meshStandardMaterial color={k.col} roughness={0.45} metalness={0.05} />
        </mesh>
      ))}
      {/* Husk leaves — two simple planes */}
      <mesh position={[-0.15, -0.55, 0]} rotation={[0.3, 0, -0.2]}>
        <planeGeometry args={[0.18, 0.35]} />
        <meshStandardMaterial color="#7A8B4A" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.12, -0.55, 0.06]} rotation={[0.2, 0.4, 0.15]}>
        <planeGeometry args={[0.16, 0.3]} />
        <meshStandardMaterial color="#6B7D3E" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function HempGeometry({ color, accent }: { color: string; accent: string }) {
  const seedGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.32, 24, 20);
    // flatten and elongate to teardrop-ish
    geo.scale(0.75, 1, 0.55);
    return geo;
  }, []);

  return (
    <group>
      <mesh geometry={seedGeo}>
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.03} />
      </mesh>
      {/* Subtle stripe lines */}
      {[-0.06, 0, 0.06].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.52, 6]} />
          <meshStandardMaterial color={accent} roughness={0.6} transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Ridge seam */}
      <mesh position={[0, 0, 0.18]}>
        <torusGeometry args={[0.24, 0.012, 6, 24, Math.PI]} />
        <meshStandardMaterial color={accent} roughness={0.55} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/* ── Main SeedModel ─────────────────────────────────────────── */

interface SeedModelProps {
  shapeType: FallbackShape;
  color: string;
  colorAccent: string;
  /** When true, idle rotation is paused (e.g. user is orbiting) */
  idleRotation?: boolean;
}

export default function SeedModel({
  shapeType,
  color,
  colorAccent,
  idleRotation = true,
}: SeedModelProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (idleRotation && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {shapeType === "acorn" && <AcornGeometry color={color} accent={colorAccent} />}
      {shapeType === "corn" && <CornGeometry color={color} accent={colorAccent} />}
      {shapeType === "hemp" && <HempGeometry color={color} accent={colorAccent} />}
    </group>
  );
}
