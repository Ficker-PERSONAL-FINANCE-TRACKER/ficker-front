import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { colors } from "../theme";
import { FONT } from "../fonts";

/** Cena 13 — Palavra-chave de valor 2. */
export const Scene13Keyword2: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const blur = interpolate(frame, [0, 18], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, durationInFrames], [0.95, 1.05]);

  return (
    <AbsoluteFill>
      <GradientBackground tint="cream" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)`, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>
          <div style={{ fontSize: 128, color: colors.ink }}>Fim do mês</div>
          <div style={{ fontSize: 128, color: colors.purple }}>sem surpresas</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
