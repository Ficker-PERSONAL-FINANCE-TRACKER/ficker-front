import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colors } from "../theme";

type Blob = {
  color: string;
  size: number;
  x: number;
  y: number;
  ax: number;
  ay: number;
  speed: number;
  phase: number;
  opacity: number;
};

const BLOBS: Blob[] = [
  { color: colors.purpleLight, size: 900, x: 18, y: 22, ax: 6, ay: 5, speed: 0.6, phase: 0, opacity: 0.5 },
  { color: "#C9BEF2", size: 780, x: 78, y: 30, ax: 5, ay: 6, speed: 0.5, phase: 1.7, opacity: 0.45 },
  { color: "#F3D9C0", size: 720, x: 30, y: 82, ax: 7, ay: 4, speed: 0.45, phase: 3.1, opacity: 0.4 },
  { color: colors.purpleSoft, size: 640, x: 68, y: 78, ax: 5, ay: 5, speed: 0.55, phase: 4.4, opacity: 0.5 },
];

/**
 * Fundo premium lavanda/creme com "blobs" desfocados que flutuam suavemente.
 * Determinístico (usa seno/cosseno do frame) para render consistente.
 */
export const GradientBackground: React.FC<{ tint?: "lavender" | "cream" | "white" }> = ({
  tint = "lavender",
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const base =
    tint === "cream"
      ? `linear-gradient(160deg, ${colors.cream} 0%, ${colors.lavender} 100%)`
      : tint === "white"
      ? `linear-gradient(160deg, #FFFFFF 0%, ${colors.purpleWash} 120%)`
      : `linear-gradient(160deg, ${colors.lavender} 0%, ${colors.cream} 100%)`;

  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      {BLOBS.map((b, i) => {
        const dx = Math.sin(t * b.speed + b.phase) * b.ax;
        const dy = Math.cos(t * b.speed + b.phase * 1.3) * b.ay;
        const scale = 1 + Math.sin(t * b.speed + b.phase) * 0.06;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${b.x + dx}%`,
              top: `${b.y + dy}%`,
              width: b.size,
              height: b.size,
              transform: `translate(-50%, -50%) scale(${scale})`,
              borderRadius: "50%",
              background: `radial-gradient(circle at 50% 50%, ${b.color} 0%, ${b.color}00 70%)`,
              opacity: b.opacity,
              filter: "blur(60px)",
            }}
          />
        );
      })}
      {/* leve vinheta para dar profundidade */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,255,255,0) 55%, rgba(17,20,45,0.06) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
