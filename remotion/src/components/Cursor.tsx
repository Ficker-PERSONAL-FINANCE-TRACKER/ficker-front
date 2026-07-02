import React from "react";
import { colors } from "../theme";

/**
 * Cursor 3D flutuante com sombra suave. Posição em px (canto do ponteiro).
 * `press` (0..1) faz o efeito de clique (leve encolhida + anel).
 */
export const Cursor: React.FC<{ x: number; y: number; scale?: number; press?: number }> = ({
  x,
  y,
  scale = 1,
  press = 0,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${scale * (1 - press * 0.12)})`,
        transformOrigin: "top left",
        filter: "drop-shadow(0 10px 16px rgba(17,20,45,0.28))",
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      {press > 0.02 && (
        <div
          style={{
            position: "absolute",
            left: -6,
            top: -6,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `3px solid ${colors.purple}`,
            opacity: 0.5 * press,
            transform: `scale(${0.6 + press * 0.9})`,
          }}
        />
      )}
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 3L4 17.5L8.2 13.7L11 20L14 18.6L11.1 12.6L16.5 12.3L4 3Z"
          fill="#FFFFFF"
          stroke={colors.ink}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
