import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Entrada suave (fade + subida) controlada pelo Remotion, para envolver componentes reais. */
export const Reveal: React.FC<{
  delay?: number;
  y?: number;
  durationInFrames?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, y = 28, durationInFrames = 26, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames });
  return (
    <div style={{ opacity: s, transform: `translateY(${interpolate(s, [0, 1], [y, 0])}px)`, ...style }}>
      {children}
    </div>
  );
};
