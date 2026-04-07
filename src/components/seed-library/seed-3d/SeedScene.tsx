import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import SeedModel from "./SeedModel";
import type { Seed3DConfig } from "./seed-configs";

interface SeedSceneProps {
  seed: Seed3DConfig;
}

function SceneContents({ seed }: { seed: Seed3DConfig }) {
  return (
    <>
      {/* Soft natural lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={0.7} color="#fdf4e3" />
      <directionalLight position={[-2, 3, -3]} intensity={0.25} color="#c8d4e8" />

      {/* Environment for subtle reflections */}
      <Environment preset="forest" environmentIntensity={0.3} />

      {/* The seed */}
      <SeedModel
        shapeType={seed.fallbackShapeType}
        color={seed.color}
        colorAccent={seed.colorAccent}
      />

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.2}
        maxDistance={4}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
      />
    </>
  );
}

export default function SeedScene({ seed }: SeedSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.3, 2.4], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <SceneContents seed={seed} />
      </Suspense>
    </Canvas>
  );
}
