import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { TextReveal } from "../components/TextReveal";
import { colors } from "../theme";
import { FONT } from "../fonts";

/** Cena 3 — Headline central. */
export const Scene03Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const baseStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 800,
    fontSize: 88,
    lineHeight: 1.08,
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -1.5,
  };

  return (
    <AbsoluteFill>
      <GradientBackground tint="white" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
        <TextReveal text={"Do “cadê meu dinheiro?”"} startAt={4} stagger={5} style={baseStyle} />
        <TextReveal
          text={"ao controle total."}
          startAt={26}
          stagger={5}
          style={baseStyle}
          wordStyle={(i) => (i >= 1 ? { color: colors.purple } : {})}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
