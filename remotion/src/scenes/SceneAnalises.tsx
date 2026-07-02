import React from "react";
import { AbsoluteFill } from "remotion";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import PlannedSpendingByRealSpendingChartContainer from "@/components/PlannedSpendingByRealSppendingChartContainer";
import { AppShell } from "../components/AppShell";
import { AntdProviders } from "../components/AntdProviders";
import { Reveal } from "../components/Reveal";
import { colors, radius, shadow } from "../theme";
import { FONT } from "../fonts";

const monthly = [
  { mes: "Mar", saldo: 1200, gastoReal: 800, credito: 300 },
  { mes: "Abr", saldo: 1800, gastoReal: 1400, credito: 500 },
  { mes: "Mai", saldo: 2400, gastoReal: 1900, credito: 700 },
  { mes: "Jun", saldo: 3200, gastoReal: 2600, credito: 900 },
  { mes: "Jul", saldo: 4820, gastoReal: 3140, credito: 1240 },
];

const planned = [
  { name: "Abr", planejado: 3000, real: 2600, saldo: 400 },
  { name: "Mai", planejado: 3200, real: 3300, saldo: -100 },
  { name: "Jun", planejado: 3400, real: 2900, saldo: 500 },
  { name: "Jul", planejado: 4300, real: 3140, saldo: 1160 },
];

// Mesmas cores/estilo do AnalysesByMonthChart real, com animação desligada
// (recharts com animação ligada não sincroniza com os frames do Remotion).
const CHART_COLORS = { saldo: "#6C5DD3", gastoReal: "#FF754C", credito: "#87E344" };

const legendDot = (c: string): React.CSSProperties => ({ width: 9, height: 9, borderRadius: "50%", background: c });

const EvolutionChart: React.FC = () => (
  <>
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={monthly}>
        <defs>
          <linearGradient id="evoFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.saldo} stopOpacity={0.12} />
            <stop offset="95%" stopColor={CHART_COLORS.saldo} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: colors.muted, fontSize: 14 }} interval="preserveStartEnd" />
        <YAxis hide />
        <Area type="monotone" dataKey="saldo" stroke={CHART_COLORS.saldo} strokeWidth={3} fill="url(#evoFill)" isAnimationActive={false} dot={{ r: 4, fill: CHART_COLORS.saldo, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="gastoReal" stroke={CHART_COLORS.gastoReal} strokeWidth={2.5} isAnimationActive={false} dot={{ r: 3, fill: CHART_COLORS.gastoReal, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="credito" stroke={CHART_COLORS.credito} strokeWidth={2.5} isAnimationActive={false} dot={{ r: 3, fill: CHART_COLORS.credito, strokeWidth: 0 }} />
      </ComposedChart>
    </ResponsiveContainer>
    <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 12, fontSize: 14, color: colors.muted, fontFamily: FONT }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={legendDot(CHART_COLORS.saldo)} /> Saldo acumulado</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={legendDot(CHART_COLORS.gastoReal)} /> Gasto real acumulado</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={legendDot(CHART_COLORS.credito)} /> Compras no crédito</span>
    </div>
  </>
);

const card: React.CSSProperties = {
  background: colors.white,
  borderRadius: radius.lg,
  boxShadow: shadow.card,
  border: `1px solid ${colors.line}`,
  padding: "22px 26px",
  fontFamily: FONT,
};

/** Cena — Análises (gráfico de barras real Planejado × Real + evolução em recharts). */
export const SceneAnalises: React.FC = () => (
  <AbsoluteFill>
    <AntdProviders>
      <AppShell
        active="analises"
        title="Análises"
        right={<span style={{ fontFamily: FONT, color: colors.muted, fontSize: 16, fontWeight: 600 }}>Jan — Jul 2026</span>}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
          <Reveal delay={0} style={card}>
            <h4 style={{ margin: "0 0 4px", fontFamily: FONT, color: colors.ink, fontSize: 20 }}>Evolução ao longo do tempo</h4>
            <EvolutionChart />
          </Reveal>
          <Reveal delay={14} style={{ flex: 1 }}>
            <PlannedSpendingByRealSpendingChartContainer data={planned} />
          </Reveal>
        </div>
      </AppShell>
    </AntdProviders>
  </AbsoluteFill>
);
