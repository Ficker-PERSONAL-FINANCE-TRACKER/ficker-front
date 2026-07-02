import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Progress, Tag } from "antd";
import { AppShell } from "../components/AppShell";
import { AntdProviders } from "../components/AntdProviders";
import { Reveal } from "../components/Reveal";
import { colors, radius, shadow } from "../theme";
import { FONT } from "../fonts";

const brl = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const goals = [
  { name: "Viagem à Europa", saved: 10200, total: 15000, color: colors.purple, prazo: "Dez 2026" },
  { name: "Reserva de emergência", saved: 5040, total: 12000, color: colors.success, prazo: "Jun 2027" },
  { name: "Carro novo", saved: 15000, total: 60000, color: "#FF754C", prazo: "Dez 2027" },
];

const GoalCard: React.FC<{ g: (typeof goals)[number]; delay: number }> = ({ g, delay }) => {
  const frame = useCurrentFrame();
  const target = Math.round((g.saved / g.total) * 100);
  const pct = Math.round(interpolate(frame, [delay + 6, delay + 40], [0, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));
  return (
    <Reveal delay={delay} style={{ background: colors.white, borderRadius: radius.lg, boxShadow: shadow.card, border: `1px solid ${colors.line}`, padding: "26px 28px", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: colors.ink }}>{g.name}</span>
        <Tag color="purple" style={{ fontWeight: 600 }}>{g.prazo}</Tag>
      </div>
      <div style={{ fontSize: 16, color: colors.muted, marginBottom: 12 }}>
        {brl(g.saved)} <span style={{ opacity: 0.6 }}>de {brl(g.total)}</span>
      </div>
      <Progress percent={pct} strokeColor={g.color} trailColor="#F0F0F5" strokeWidth={12} format={(p) => <span style={{ fontWeight: 700, color: colors.ink }}>{p}%</span>} />
    </Reveal>
  );
};

/** Cena — Objetivos (metas com progresso real). */
export const SceneObjetivos: React.FC = () => (
  <AbsoluteFill>
    <AntdProviders>
      <AppShell
        active="objetivos"
        title="Objetivos"
        right={<span style={{ fontFamily: FONT, color: colors.muted, fontSize: 16, fontWeight: 600 }}>3 metas ativas</span>}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100, margin: "0 auto", height: "100%", justifyContent: "center" }}>
          {goals.map((g, i) => (
            <GoalCard key={g.name} g={g} delay={i * 10} />
          ))}
        </div>
      </AppShell>
    </AntdProviders>
  </AbsoluteFill>
);
