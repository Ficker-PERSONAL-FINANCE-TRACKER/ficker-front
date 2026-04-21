import React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FinanceDataPoint } from "../PlannedSpendingByRealSppendingChartContainer";

interface PlannedSpendingByRealSpendingChartProps {
  data: FinanceDataPoint[];
}

const currency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const PlannedSpendingByRealSpendingChart = ({ data }: PlannedSpendingByRealSpendingChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 24,
          bottom: 20,
          left: 0,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#808191", fontSize: 11 }}
        />
        <YAxis hide />
        <Tooltip
          formatter={(value: number) => [currency(value), ""]}
          contentStyle={{ 
            borderRadius: "16px", 
            border: "1px solid #f3f4f8", 
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            padding: "12px"
          }}
          labelStyle={{ fontWeight: 800, color: "#11142d", marginBottom: "8px" }}
        />
        <Legend 
          verticalAlign="top" 
          align="right" 
          iconType="circle" 
          wrapperStyle={{ paddingBottom: "20px" }}
          formatter={(value) => <span style={{ color: "#808191", fontSize: "12px", fontWeight: 600 }}>{value}</span>}
        />
        <Bar 
          dataKey="entrada" 
          name="Entrada" 
          barSize={12} 
          fill="#16a34a" 
          radius={[4, 4, 0, 0]} 
        />
        <Bar 
          dataKey="saida" 
          name="Saída" 
          barSize={12} 
          fill="#dc2626" 
          radius={[4, 4, 0, 0]} 
        />
        <Line 
          type="monotone" 
          dataKey="saldo" 
          name="Saldo" 
          stroke="#6C5DD3" 
          strokeWidth={4} 
          dot={{ r: 4, strokeWidth: 0, fill: "#6C5DD3" }} 
          activeDot={{ r: 6, strokeWidth: 0, fill: "#6C5DD3" }} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PlannedSpendingByRealSpendingChart;
