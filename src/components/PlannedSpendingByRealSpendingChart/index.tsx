import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Legend,
  Customized
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

const ConnectingArrows = (props: any) => {
  const { formattedGraphicalItems } = props;
  const realItems = formattedGraphicalItems.find((i: any) => i.props.dataKey === "real")?.props.data;
  const plannedItems = formattedGraphicalItems.find((i: any) => i.props.dataKey === "planejado")?.props.data;

  if (!realItems || !plannedItems) return null;

  return (
    <g>
      {realItems.map((real: any, index: number) => {
        const planned = plannedItems[index];
        if (!real || !planned) return null;

        const isOver = real.payload.real > real.payload.planejado;
        const color = isOver ? "#FF0000" : "#00D084";
        
        // real.y is the top of the real bar
        // planned.y is the top of the planned bar
        const x = real.x + real.width / 2 + real.width / 2 + 2; // Offset to the right of narrow bar
        const yStart = real.y;
        const yEnd = planned.y;

        if (Math.abs(yStart - yEnd) < 2) return null;

        return (
          <g key={`arrow-${index}`}>
            <line
              x1={x}
              y1={yStart}
              x2={x}
              y2={yEnd}
              stroke={color}
              strokeWidth={2}
            />
            {/* Arrowhead */}
            <path
              d={isOver 
                ? `M${x-3},${yStart + 5} L${x},${yStart} L${x+3},${yStart + 5}` // Arrow pointing down (starting at top of real)
                : `M${x-3},${yEnd + 5} L${x},${yEnd} L${x+3},${yEnd + 5}`   // Arrow pointing up (ending at top of planned)
              }
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </g>
  );
};

const PlannedSpendingByRealSpendingChart = ({ data }: PlannedSpendingByRealSpendingChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{
          top: 40,
          right: 32,
          bottom: 20,
          left: 0,
        }}
        barGap={-32}
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
          verticalAlign="bottom" 
          align="center" 
          iconType="circle" 
          iconSize={8}
          wrapperStyle={{ paddingTop: "20px" }}
          formatter={(value) => <span style={{ color: "#808191", fontSize: "11px", fontWeight: 600 }}>{value}</span>}
        />
        
        <Bar 
          dataKey="planejado" 
          name="Planejado" 
          barSize={32} 
          fill="#A197F0" 
          radius={[6, 6, 0, 0]} 
          isAnimationActive={false}
        />

        <Bar 
          dataKey="real" 
          name="Real" 
          barSize={12} 
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill="#3D3799" />
          ))}
        </Bar>
        
        <Customized component={ConnectingArrows} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PlannedSpendingByRealSpendingChart;
