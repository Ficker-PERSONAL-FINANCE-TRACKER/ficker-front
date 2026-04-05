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
import { PlannedByMonth } from "../PlannedSpendingByRealSppendingChartContainer";

interface PlannedSpendingByRealSpendingChartProps {
  data: PlannedByMonth[];
}

const PlannedSpendingByRealSpendingChart = ({ data }: PlannedSpendingByRealSpendingChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 24,
          bottom: 20,
          left: 28,
        }}
      >
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis
          dataKey="name"
          padding={{ left: 12, right: 12 }}
          label={{ value: "Mês", position: "insideBottomRight", offset: -4 }}
        />
        <YAxis
          width={72}
          label={{ value: "Valor", angle: -90, position: "insideLeft", offset: -6 }}
        />
        <Tooltip />
        <Legend />
        <Bar dataKey="planejado" barSize={28} fill="#6C5DD3" />
        <Line type="monotone" dataKey="real" stroke="#87E344" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PlannedSpendingByRealSpendingChart;
