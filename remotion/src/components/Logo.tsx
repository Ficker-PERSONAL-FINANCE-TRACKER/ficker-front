import React from "react";
import { colors } from "../theme";
import { FONT } from "../fonts";

const wedgePath = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
  const a0 = ((startDeg - 90) * Math.PI) / 180;
  const a1 = ((endDeg - 90) * Math.PI) / 180;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
};

/**
 * Marca do Ficker: círculo "pizza" segmentado (finanças), com uma fatia
 * destacada. Recriada em vetor para permitir rotação e reveal animados.
 */
export const FickerMark: React.FC<{
  size?: number;
  rotate?: number;
  /** deslocamento da fatia destacada, em px */
  sliceOffset?: number;
  accent?: string;
  base?: string;
}> = ({ size = 120, rotate = 0, sliceOffset = 0, accent = colors.purple, base = colors.ink }) => {
  const c = 60;
  const r = 52;
  // bisetriz da fatia menor (~ -45° / topo-esquerda) para deslocar
  const bis = ((350 - 90 + (390 - 350) / 2) * Math.PI) / 180;
  const ox = Math.cos(bis) * sliceOffset;
  const oy = Math.sin(bis) * sliceOffset;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: `rotate(${rotate}deg)` }}>
      {/* corpo principal (~310°) */}
      <path d={wedgePath(c, c, r, 8, 342)} fill={base} />
      {/* fatia destacada, levemente separada, em roxo da marca */}
      <path d={wedgePath(c + ox, c + oy, r, 350, 384)} fill={accent} />
      {/* furo central para virar "donut" */}
      <circle cx={c} cy={c} r={18} fill="#FFFFFF" />
      <circle cx={c} cy={c} r={18} fill="rgba(233,228,247,0.6)" />
    </svg>
  );
};

/** Logo completo: marca + palavra "Ficker". */
export const Logo: React.FC<{
  size?: number;
  color?: string;
  markRotate?: number;
  sliceOffset?: number;
  showWordmark?: boolean;
}> = ({ size = 120, color = colors.ink, markRotate = 0, sliceOffset = 0, showWordmark = true }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.22 }}>
      <FickerMark size={size} rotate={markRotate} sliceOffset={sliceOffset} base={color} />
      {showWordmark && (
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: size * 0.82,
            color,
            letterSpacing: -size * 0.012,
          }}
        >
          Ficker
        </span>
      )}
    </div>
  );
};
