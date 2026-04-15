"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Button } from "antd";

type TourTarget = () => HTMLElement | null;

export interface CustomTourStep {
  title: string;
  description: string;
  target: TourTarget;
  placement?: "top" | "bottom" | "left" | "right";
  offset?: number;
}

interface RectState {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

interface CustomTourProps {
  open: boolean;
  steps: CustomTourStep[];
  current: number;
  onClose: () => void;
  onChange: (next: number) => void;
  zIndex?: number;
}

const DEFAULT_RECT: RectState = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  radius: 16,
};

export default function CustomTour({
  open,
  steps,
  current,
  onClose,
  onChange,
  zIndex = 2000,
}: CustomTourProps) {
  const [rect, setRect] = useState<RectState>(DEFAULT_RECT);
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({});
  const step = steps[current];

  const maskId = useMemo(
    () => `custom-tour-mask-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  const updatePosition = () => {
    if (!open || !step) return;

    const el = step.target();
    if (!el) return;

    const box = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    const borderRadius = parseFloat(styles.borderRadius || "16");
    const offset = step.offset ?? 10;

    const nextRect = {
      x: Math.max(0, box.left - offset),
      y: Math.max(0, box.top - offset),
      width: box.width + offset * 2,
      height: box.height + offset * 2,
      radius: Number.isNaN(borderRadius) ? 16 : borderRadius + 4,
    };

    setRect(nextRect);

    const gap = 2;
    const bubbleWidth = 340;
    const bubbleHeight = 170;

    let top = nextRect.y + nextRect.height + gap;
    let left = nextRect.x;

    switch (step.placement) {
      case "top":
        top = nextRect.y - bubbleHeight - gap;
        left = nextRect.x;
        break;
      case "left":
        top = nextRect.y;
        left = nextRect.x - bubbleWidth - gap;
        break;
      case "right":
        top = nextRect.y;
        left = nextRect.x + nextRect.width + gap;
        break;
      case "bottom":
      default:
        top = nextRect.y + nextRect.height + gap;
        left = nextRect.x;
        break;
    }

    const maxLeft = window.innerWidth - bubbleWidth - 16;
    const maxTop = window.innerHeight - bubbleHeight - 16;

    setBubbleStyle({
      position: "fixed",
      top: Math.max(16, Math.min(top, maxTop)),
      left: Math.max(16, Math.min(left, maxLeft)),
      width: bubbleWidth,
      zIndex: zIndex + 2,
    });
  };

  useLayoutEffect(() => {
    updatePosition();
  }, [open, current]);

  useEffect(() => {
    if (!open) return;

    const handle = () => updatePosition();

    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);

    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [open, current, step]);

  useEffect(() => {
    if (!open) return;

    const el = step?.target();
    el?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [open, current, step]);

  if (!open || !step) return null;

  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex,
          pointerEvents: "none",
        }}
      >
        <svg style={{ width: "100%", height: "100%" }}>
          <defs>
            <mask id={maskId}>
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={rect.x}
                y={rect.y}
                rx={rect.radius}
                ry={rect.radius}
                width={rect.width}
                height={rect.height}
                fill="black"
              />
            </mask>
          </defs>

          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(17,20,45,0.55)"
            mask={`url(#${maskId})`}
          />

          <rect
            x={rect.x}
            y={rect.y}
            rx={rect.radius}
            ry={rect.radius}
            width={rect.width}
            height={rect.height}
            fill="transparent"
            stroke="#ffffff"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div
        style={{
          ...bubbleStyle,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#11142D",
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                marginTop: 10,
                marginBottom: 18,
                fontSize: 14,
                lineHeight: 1.5,
                color: "#667085",
              }}
            >
              {step.description}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              color: "#98A2B3",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {steps.map((_, index) => (
              <span
                key={index}
                style={{
                  width: index === current ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: index === current ? "#6C5DD3" : "#D0D5DD",
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: 2 }}>
            {!isFirst && (
              <Button onClick={() => onChange(current - 1)}>
                Anterior
              </Button>
            )}

            <Button
              type="primary"
              onClick={() => {
                if (isLast) {
                  onClose();
                  return;
                }
                onChange(current + 1);
              }}
              style={{
                background: "#6C5DD3",
                borderColor: "#6C5DD3",
                borderRadius: 10,
              }}
            >
              {isLast ? "Concluir" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}