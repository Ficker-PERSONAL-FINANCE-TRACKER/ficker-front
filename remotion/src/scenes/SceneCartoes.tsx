import React from "react";
import { AbsoluteFill } from "remotion";
import { Button } from "antd";
import { AppShell } from "../components/AppShell";
import { AntdProviders } from "../components/AntdProviders";
import { Reveal } from "../components/Reveal";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { colors, radius, shadow } from "../theme";
import { FONT } from "../fonts";

const brl = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getFlagColor = (flagId: number) => {
  const colorsMap: { [k: number]: string } = {
    1: "linear-gradient(135deg, #1e1e1e 0%, #3a3a3a 100%)",
    2: "linear-gradient(135deg, #1a1f71 0%, #0056b3 100%)",
    4: "linear-gradient(135deg, #2d3e50 0%, #4c5c6e 100%)",
  };
  return colorsMap[flagId] || "linear-gradient(135deg, #6C5DD3 0%, #8E82EF 100%)";
};
const getFlagImage = (flagId: number) => ({ 1: "/mastercard.png", 2: "/visa.png", 4: "/elo.png" } as any)[flagId] || "/mastercard.png";

const CreditCard: React.FC<{ flagId: number; invoice: number; pay: string; offset: number; active: boolean }> = ({ flagId, invoice, pay, offset, active }) => (
  <div
    style={{
      position: "absolute",
      width: 430,
      aspectRatio: "1.58 / 1",
      background: getFlagColor(flagId),
      borderRadius: 16,
      padding: "22px 28px",
      color: "#fff",
      boxShadow: active ? "0 20px 45px rgba(0,0,0,0.28)" : "0 8px 18px rgba(0,0,0,0.15)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      overflow: "hidden",
      transform: `translateX(${offset}px) scale(${active ? 1 : 0.92})`,
      filter: active ? "none" : "brightness(0.7) blur(1px)",
      zIndex: active ? 10 : 5,
      fontFamily: FONT,
    }}
  >
    <div style={{ position: "absolute", top: "-20%", right: "-20%", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
    <div style={{ position: "absolute", bottom: "-25%", left: "-25%", width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
      <div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4, fontWeight: 500 }}>Fatura do período</div>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>{active ? <AnimatedNumber value={invoice} format={brl} startAt={10} duration={38} /> : brl(invoice)}</div>
      </div>
      <img src={getFlagImage(flagId)} alt="flag" width={52} height={32} style={{ objectFit: "contain" }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
      <div style={{ fontSize: 17, letterSpacing: 3, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>**** **** **** ****</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{pay}</div>
    </div>
  </div>
);

/** Cena — Meus cartões (visual real de cartão do Ficker). */
export const SceneCartoes: React.FC = () => (
  <AbsoluteFill>
    <AntdProviders>
      <AppShell
        active="cartoes"
        title="Meus cartões"
        right={<span style={{ fontFamily: FONT, color: colors.muted, fontSize: 16, fontWeight: 600 }}>Julho de 2026</span>}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40, height: "100%", justifyContent: "center" }}>
          <Reveal delay={0} y={40}>
            <div style={{ position: "relative", width: 620, height: 300, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <CreditCard flagId={1} invoice={890} pay="12/08" offset={-150} active={false} />
              <CreditCard flagId={4} invoice={430} pay="20/08" offset={150} active={false} />
              <CreditCard flagId={2} invoice={1240} pay="15/08" offset={0} active />
            </div>
          </Reveal>

          <Reveal delay={16} style={{ width: 620 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Button type="dashed" block style={{ borderRadius: 12, height: 56, color: colors.muted, fontWeight: 600, fontSize: 18 }}>
                Nova transação
              </Button>
              <Button type="primary" block style={{ borderRadius: 12, height: 56, fontWeight: 700, fontSize: 18, background: colors.purple, borderColor: colors.purple }}>
                Pagar fatura
              </Button>
            </div>
          </Reveal>
        </div>
      </AppShell>
    </AntdProviders>
  </AbsoluteFill>
);
