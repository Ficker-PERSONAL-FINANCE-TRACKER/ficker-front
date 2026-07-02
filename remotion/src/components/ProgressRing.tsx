import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";
import { FONT } from "../fonts";

/** Anel de progresso que "desenha" o arco. Percent 0..100. */
export const ProgressRing: React.FC<{
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  startAt?: number;
  duration?: number;
  label?: string;
}> = ({
  percent,
  size = 92,
  stroke = 8,
  color = colors.purple,
  track = "#EFEDF7",
  startAt = 0,
  duration = 45,
  label,
}) => {
  const frame = useCurrentFrame();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = interpolate(frame, [startAt, startAt + duration], [0, percent], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const offset = circ - (p / 100) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
        }}
      >
        <span style={{ fontSize: size * 0.24, fontWeight: 800, color: colors.ink }}>
          {Math.round(p)}%
        </span>
        {label && <span style={{ fontSize: size * 0.12, color: colors.muted, fontWeight: 600 }}>{label}</span>}
      </div>
    </div>
  );
};
