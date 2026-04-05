import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { IAnalysesByMonthChartContainer } from "../AnalysesByMonthChartContainer";

export interface AnalysesByMonthChartProps {
  data: IAnalysesByMonthChartContainer[];
}

const AnalysesByMonthChart = ({ data }: AnalysesByMonthChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart
        data={data}
        margin={{
          top: 8,
          right: 20,
          left: 28,
          bottom: 8,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis width={72} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="entrada" stroke="#8884d8" />
        <Line type="monotone" dataKey="saida" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AnalysesByMonthChart;
