import React from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";

type DataType = {
  name: string;
  value: number;
  fill: string;
};

export interface ExpensesByCategoryChartProps {
  data: DataType[];
  emptyMessage?: string;
  metric?: string;
}

const ExpensesByCategoryChart = ({
  data,
  emptyMessage = "Nenhum gasto encontrado no período.",
}: ExpensesByCategoryChartProps) => {
  const total = data.reduce((acc, item) => acc + Number(item.value || 0), 0);

  if (!data.length) {
    return (
      <div
        style={{
          height: 250,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#808191",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  // Transform data for RadialBarChart
  // We want the largest value in the outer ring
  const chartData = [...data]
    .sort((a, b) => b.value - a.value)
    .map((item) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      return {
        ...item,
        uv: percentage.toFixed(0), // Percentage for the ring length
      };
    });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32, padding: "10px 0" }}>
      {/* Legend on the Left */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          flex: 1,
          maxWidth: 300,
        }}
      >
        {chartData.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    backgroundColor: item.fill,
                    borderRadius: "50%",
                    boxShadow: `0 0 8px ${item.fill}44`,
                  }}
                />
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#11142d",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  {item.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#808191",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                {percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Chart on the Right */}
      <div style={{ position: "relative", width: 280, height: 280, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="100%"
            barSize={10}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "#F0F3F8" }}
              dataKey="uv"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Center Label */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#808191",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            100%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExpensesByCategoryChart;
