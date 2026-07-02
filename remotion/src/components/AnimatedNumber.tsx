import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

/**
 * Número com contagem animada (count-up) com easing suave.
 * `startAt`/`duration` em frames, relativos ao início da Sequence.
 */
export const AnimatedNumber: React.FC<{
  value: number;
  format: (n: number) => string;
  startAt?: number;
  duration?: number;
  style?: React.CSSProperties;
}> = ({ value, format, startAt = 0, duration = 40, style }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startAt, startAt + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return <span style={style}>{format(value * progress)}</span>;
};
