"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Mesh, Group } from "three";

/** Wählt Geometrie + Farbe nach Beweismittel-Art. */
function kindToVisual(kind: string): { geo: "box" | "long" | "vial" | "doc"; color: string } {
  const k = kind.toLowerCase();
  if (/(waffe|weapon|gun|pistol|messer|knife)/.test(k)) return { geo: "long", color: "#9ca3af" };
  if (/(dna|probe|blut|sample|tox|vial|fluid)/.test(k)) return { geo: "vial", color: "#22d3ee" };
  if (/(dokument|document|paper|akte|brief)/.test(k)) return { geo: "doc", color: "#e5e7eb" };
  return { geo: "box", color: "#a78bfa" };
}

function EvidenceMesh({ kind }: { kind: string }) {
  const mesh = useRef<Mesh>(null);
  const { geo, color } = kindToVisual(kind);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.6;
      mesh.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <mesh ref={mesh} castShadow>
      {geo === "box" && <boxGeometry args={[1.4, 1.4, 1.4]} />}
      {geo === "long" && <boxGeometry args={[2.6, 0.5, 0.5]} />}
      {geo === "vial" && <cylinderGeometry args={[0.4, 0.4, 2, 24]} />}
      {geo === "doc" && <boxGeometry args={[1.6, 0.06, 2.2]} />}
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.35} />
    </mesh>
  );
}

/** Forensischer Scan-Effekt: leuchtende Ebene wandert auf/ab. */
function ScanPlane() {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 1.6;
    }
  });
  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

export default function EvidenceViewer3D({ kind }: { kind: string }) {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 2.5, 4], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0b1120"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={80} castShadow />
      <pointLight position={[-5, 2, -3]} intensity={30} color="#60a5fa" />
      <gridHelper args={[8, 16, "#1e293b", "#1e293b"]} position={[0, -1.6, 0]} />
      <EvidenceMesh kind={kind} />
      <ScanPlane />
    </Canvas>
  );
}
