import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type DataType = {
  name: string;
  value: number;
  fill: string;
};

type CustomizedLabel = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
};

export interface ExpensesByCategoryChartProps {
  data: DataType[];
  emptyMessage?: string;
}

const RADIAN = Math.PI / 180;

const currency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const ExpensesByCategoryChart = ({ data, emptyMessage = "Nenhum gasto encontrado no período." }: ExpensesByCategoryChartProps) => {
  const total = data.reduce((acc, item) => acc + Number(item.value || 0), 0);

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: CustomizedLabel) => {
    const percentage = percent * 100;
    if (percentage < 30) return null;

    const labelText = `${percentage.toFixed(1)}%`;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        fontSize={12}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {labelText}
      </text>
    );
  };

  if (!data.length) {
    return (
      <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "#808191" }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart width={250} height={250}>
          <Pie
            data={data}
            cx="40%"
            cy="40%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, minWidth: 220 }}>
        {data.map((item, index) => {
          const percentage = total > 0 ? (Number(item.value || 0) / total) * 100 : 0;

          return (
            <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 10, height: 10, backgroundColor: item.fill, borderRadius: 30, flexShrink: 0, marginTop: 4 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <p style={{ fontSize: 12, margin: 0 }}>
                  {item.name} ({percentage.toFixed(1)}%)
                </p>
                <span style={{ fontSize: 12, color: "#808191" }}>{currency(item.value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExpensesByCategoryChart;
