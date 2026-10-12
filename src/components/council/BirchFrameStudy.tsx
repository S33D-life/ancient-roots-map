import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { BIRCH_ARTIFACT } from "@/data/library/birchThread";

function Frame({ onOpen }: { onOpen: () => void }) {
  const texture = useTexture(BIRCH_ARTIFACT);
  return <group rotation={[0, -.16, 0]}>
    {/* Abstract presence, not a likeness of an individual Ancient Friend. */}
    <mesh position={[-1.6, -.35, .1]}><cylinderGeometry args={[.07, .11, 1.8, 12]} /><meshStandardMaterial color="#eee6cf" /></mesh>
    <mesh position={[-1.6, .65, .1]}><icosahedronGeometry args={[.45, 1]} /><meshStandardMaterial color="#7e8959" /></mesh>
    <group position={[.3, .05, 0]} onClick={event => { event.stopPropagation(); onOpen(); }}>
      <mesh><boxGeometry args={[1.85, 2.3, .12]} /><meshStandardMaterial color="#ede7d4" /></mesh>
      <mesh position={[0, 0, .071]}><planeGeometry args={[1.61, 2.01]} /><meshBasicMaterial map={texture} /></mesh>
      {[-.87, .87].map(x => <mesh key={x} position={[x, 0, .11]}><boxGeometry args={[.13, 2.4, .17]} /><meshStandardMaterial color="#e9e6d6" /></mesh>)}
      {[-1.15, 1.15].map(y => <mesh key={y} position={[0, y, .11]}><boxGeometry args={[1.88, .13, .17]} /><meshStandardMaterial color="#d3c797" /></mesh>)}
      {[-.7, -.2, .3, .75].map(y => <mesh key={y} position={[-.87, y, .21]}><boxGeometry args={[.1, .022, .008]} /><meshBasicMaterial color="#4b5043" /></mesh>)}
    </group>
  </group>;
}

/** Reuses the existing R3F Canvas/lighting grammar. One isolated artifact study, not a rebuilt Council. */
export default function BirchFrameStudy({ onOpen }: { onOpen: () => void }) {
  return <div className="birch-spatial" aria-label="Illustrative 3D Birch framed-object study">
    <Canvas dpr={[1, 1.5]} frameloop="demand" camera={{ position: [0, .15, 4.8], fov: 42 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1} /><directionalLight position={[2, 4, 4]} intensity={2} color="#fff0cb" />
      <Suspense fallback={null}><Frame onOpen={onOpen} /></Suspense>
    </Canvas>
  </div>;
}
