import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { FickerMark } from "../components/Logo";
import { colors } from "../theme";
import { FONT } from "../fonts";

/** Cena 1 — Abertura abstrata. Atmosfera premium antes do produto. */
export const Scene01Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const appear = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const scale = interpolate(appear, [0, 1], [0.6, 1]);
  const blur = interpolate(appear, [0, 1], [24, 0]);
  const rotate = interpolate(frame, [0, durationInFrames], [-12, 8]);
  const tagOpacity = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <GradientBackground tint="cream" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 26 }}>
        <div style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)`, opacity: appear }}>
          <FickerMark size={150} rotate={rotate} sliceOffset={interpolate(appear, [0, 1], [16, 4])} />
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: colors.muted,
            opacity: tagOpacity,
          }}
        >
          Finanças sob controle
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
