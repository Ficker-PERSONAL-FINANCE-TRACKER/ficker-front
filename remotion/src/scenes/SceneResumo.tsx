import React from "react";
import { AbsoluteFill } from "remotion";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { WalletOutlined, TagOutlined, LineChartOutlined, RocketOutlined } from "@ant-design/icons";
import MyCategoriesList from "@/components/MyCategoriesList";
import LastTransactionsList from "@/components/LastTransactionsList";
import { AppShell } from "../components/AppShell";
import { AntdProviders } from "../components/AntdProviders";
import { Reveal } from "../components/Reveal";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { ProgressRing } from "../components/ProgressRing";
import { colors, radius, shadow } from "../theme";
import { FONT } from "../fonts";

const brl = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const categories = [
  { category_description: "Compras", category_spending: 1120 },
  { category_description: "Moradia", category_spending: 900 },
  { category_description: "Alimentação", category_spending: 740 },
  { category_description: "Transporte", category_spending: 505 },
  { category_description: "Lazer", category_spending: 220 },
];

const transactions = [
  { id: 1, transaction_description: "Salário", category_description: "Salário", date: new Date("2026-07-05"), type_id: 1, transaction_value: 6000 },
  { id: 2, transaction_description: "Supermercado", category_description: "Alimentação", date: new Date("2026-07-24"), type_id: 2, transaction_value: 320 },
  { id: 3, transaction_description: "Freelance", category_description: "Renda Extra", date: new Date("2026-07-18"), type_id: 1, transaction_value: 1200 },
  { id: 4, transaction_description: "Fatura Nubank", category_description: "Cartões", date: new Date("2026-07-15"), type_id: 2, transaction_value: 1240, is_invoice_payment: true },
];

const balanceSeries = [1200, 1500, 1350, 1900, 2400, 2200, 2800, 3300, 3200, 3800, 4200, 4820].map((total, i) => ({ name: String(i), total }));

const objetivos = [
  { name: "Viagem", percent: 68, color: colors.purple },
  { name: "Reserva", percent: 42, color: colors.success },
  { name: "Carro novo", percent: 25, color: "#FF754C" },
];

const cardStyle: React.CSSProperties = {
  background: colors.white,
  borderRadius: radius.lg,
  boxShadow: shadow.card,
  border: `1px solid ${colors.line}`,
  padding: "22px 26px",
  fontFamily: FONT,
};
const labelStyle: React.CSSProperties = { fontSize: 15, color: colors.muted, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 };
const valueStyle: React.CSSProperties = { fontSize: 32, fontWeight: 800, color: colors.ink };

const planned = 4300;
const real = 3140;
const pct = Math.round((real / planned) * 100);
const barColor = pct >= 90 ? colors.danger : pct >= 70 ? colors.warning : colors.success;

/** Cena — Resumo (dashboard real do Ficker). */
export const SceneResumo: React.FC = () => {
  return (
    <AbsoluteFill>
      <AntdProviders>
        <AppShell
          active="inicio"
          title="Olá, John!"
          right={<span style={{ fontFamily: FONT, color: colors.muted, fontSize: 16, fontWeight: 600 }}>Julho de 2026</span>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
            {/* Linha 1 — Saldo / Teto / Objetivos */}
            <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr", gap: 20 }}>
              <Reveal delay={0} style={cardStyle}>
                <div style={labelStyle}><WalletOutlined /> Saldo</div>
                <div style={valueStyle}><AnimatedNumber value={4820} format={brl} startAt={6} duration={38} /></div>
                <div style={{ height: 70, marginTop: 12 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceSeries}>
                      <defs>
                        <linearGradient id="resSaldo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.purple} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={colors.purple} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <Area type="monotone" dataKey="total" stroke={colors.purple} strokeWidth={2.5} fill="url(#resSaldo)" isAnimationActive={false} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Reveal>

              <Reveal delay={8} style={cardStyle}>
                <div style={labelStyle}><TagOutlined style={{ color: colors.purple }} /> Teto de gastos</div>
                <div style={{ ...valueStyle, fontSize: 28 }}>{brl(planned)}</div>
                <div style={{ ...labelStyle, marginTop: 14 }}><LineChartOutlined style={{ color: colors.purple }} /> Gasto real</div>
                <div style={{ ...valueStyle, fontSize: 28, marginBottom: 12 }}>{brl(real)}</div>
                <div style={{ width: "100%", height: 10, background: "#f0f0f5", borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 5 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: barColor }}>{pct}%</span>
                  <span style={{ color: colors.muted }}>Restam {brl(planned - real)}</span>
                </div>
              </Reveal>

              <Reveal delay={16} style={cardStyle}>
                <div style={{ ...labelStyle, marginBottom: 16 }}><RocketOutlined style={{ color: colors.purple }} /> Objetivos</div>
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  {objetivos.map((o, i) => (
                    <div key={o.name} style={{ textAlign: "center" }}>
                      <ProgressRing percent={o.percent} size={92} color={o.color} startAt={20 + i * 5} />
                      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: colors.ink }}>{o.name}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Linha 2 — Categorias / Transações (componentes reais) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flex: 1 }}>
              <Reveal delay={24}>
                <MyCategoriesList categories={categories as any} />
              </Reveal>
              <Reveal delay={30}>
                <LastTransactionsList transactions={transactions as any} />
              </Reveal>
            </div>
          </div>
        </AppShell>
      </AntdProviders>
    </AbsoluteFill>
  );
};
