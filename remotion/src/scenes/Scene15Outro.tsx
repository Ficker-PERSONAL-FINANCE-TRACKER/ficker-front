import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { Logo } from "../components/Logo";
import { colors, radius, shadow } from "../theme";
import { FONT } from "../fonts";

/** Cena 15 — Encerramento com logo e CTA. */
export const Scene15Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 34 });
  const logoScale = interpolate(logoIn, [0, 1], [0.8, 1]) * (1 + Math.sin(frame / 18) * 0.014);

  const tagIn = interpolate(frame, [26, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaIn = spring({ frame: frame - 44, fps, config: { damping: 200 }, durationInFrames: 26 });
  const ctaPulse = 1 + Math.max(0, Math.sin((frame - 70) / 8)) * 0.03;

  const outOpacity = interpolate(frame, [durationInFrames - 24, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: outOpacity }}>
      <GradientBackground tint="lavender" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34 }}>
        <div style={{ transform: `scale(${logoScale})`, opacity: logoIn }}>
          <Logo size={120} />
        </div>

        <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 600, color: colors.ink, opacity: tagIn, textAlign: "center" }}>
          Assuma o controle das suas finanças
        </div>

        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: ctaIn,
            transform: `translateY(${interpolate(ctaIn, [0, 1], [20, 0])}px) scale(${ctaPulse})`,
          }}
        >
          <div
            style={{
              padding: "20px 44px",
              borderRadius: radius.pill,
              background: colors.purple,
              color: colors.white,
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 700,
              boxShadow: shadow.soft,
            }}
          >
            Crie sua conta grátis
          </div>
          <span style={{ fontFamily: FONT, fontSize: 28, fontWeight: 600, color: colors.muted }}>ficker.com.br</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
