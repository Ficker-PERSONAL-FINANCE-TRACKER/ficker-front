import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

/** Revela um texto palavra por palavra (fade + subida + blur). */
export const TextReveal: React.FC<{
  text: string;
  startAt?: number;
  stagger?: number;
  style?: React.CSSProperties;
  wordStyle?: (i: number, total: number) => React.CSSProperties;
}> = ({ text, startAt = 0, stagger = 6, style, wordStyle }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", ...style }}>
      {words.map((w, i) => {
        const s = startAt + i * stagger;
        const o = interpolate(frame, [s, s + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(frame, [s, s + 14], [26, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        const blur = interpolate(frame, [s, s + 12], [10, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: o,
              transform: `translateY(${y}px)`,
              filter: `blur(${blur}px)`,
              marginRight: "0.32em",
              ...(wordStyle ? wordStyle(i, words.length) : {}),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
