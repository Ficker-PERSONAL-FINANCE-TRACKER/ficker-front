import React from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { IAnalysesByMonthChartContainer } from "../AnalysesByMonthChartContainer";

export interface AnalysesByMonthChartProps {
  data: IAnalysesByMonthChartContainer[];
}

const COLORS = {
  saldo: "#6C5DD3",
  gastoReal: "#FF754C",
  credito: "#87E344",
};

const tooltipCardStyle: React.CSSProperties = {
  background: "#fff",
  padding: "12px",
  border: "1px solid #f0f0f0",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const tooltipLabelStyle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: "8px",
  color: "#11142D",
};

const legendRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  margin: "4px 0",
  fontSize: 12,
};

const legendDot = (color: string): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: color,
  flexShrink: 0,
});

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0]?.payload;

    return (
      <div style={tooltipCardStyle}>
        <p style={tooltipLabelStyle}>Período {label}</p>
        <div style={legendRowStyle}>
          <span style={legendDot(COLORS.saldo)} />
          <span>Saldo acumulado: {formatCurrency(Number(point?.saldo || 0))}</span>
        </div>
        <div style={legendRowStyle}>
          <span style={legendDot(COLORS.gastoReal)} />
          <span>Gasto real acumulado: {formatCurrency(Number(point?.gastoReal || 0))}</span>
        </div>
        <div style={legendRowStyle}>
          <span style={legendDot(COLORS.credito)} />
          <span>Compras no crédito acumuladas: {formatCurrency(Number(point?.credito || 0))}</span>
        </div>
      </div>
    );
  }

  return null;
};

const RenderBalanceDot = (props: any) => {
  const { cx, cy, payload, index } = props;
  const currentValue = Number(payload?.saldo || 0);
  const previousValue = Number(payload?.previousSaldo || 0);
  const isFirstVisiblePoint = index === 0 && currentValue !== 0;
  const hasMovement = currentValue !== previousValue;

  if (!isFirstVisiblePoint && !hasMovement) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={COLORS.saldo}
      stroke="#fff"
      strokeWidth={2}
      key={`dot-${index}`}
    />
  );
};

const ChartLegend = () => (
  <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 12, fontSize: 12, color: "#808191" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={legendDot(COLORS.saldo)} />
      <span>Saldo acumulado</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={legendDot(COLORS.gastoReal)} />
      <span>Gasto real acumulado</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={legendDot(COLORS.credito)} />
      <span>Compras no crédito acumuladas</span>
    </div>
  </div>
);

const AnalysesByMonthChart = ({ data }: AnalysesByMonthChartProps) => {
  const chartData = data.map((item, index) => ({
    ...item,
    previousSaldo: index > 0 ? data[index - 1]?.saldo ?? 0 : 0,
  }));

  return (
    <>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="analysisBalanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.saldo} stopOpacity={0.1} />
              <stop offset="95%" stopColor={COLORS.saldo} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="saldo"
            stroke={COLORS.saldo}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#analysisBalanceFill)"
            dot={<RenderBalanceDot />}
            activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.saldo }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 10 }}>
        <ResponsiveContainer width="100%" height={105}>
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#808191", fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="gastoReal"
              stroke={COLORS.gastoReal}
              strokeWidth={2.5}
              dot={{ r: 3, fill: COLORS.gastoReal, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.gastoReal }}
            />
            <Line
              type="monotone"
              dataKey="credito"
              stroke={COLORS.credito}
              strokeWidth={2.5}
              dot={{ r: 3, fill: COLORS.credito, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.credito }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend />
    </>
  );
};

export default AnalysesByMonthChart;
