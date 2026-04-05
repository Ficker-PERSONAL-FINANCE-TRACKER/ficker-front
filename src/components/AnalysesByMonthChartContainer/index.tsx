import { request } from "@/service/api";
import { useEffect, useRef, useState } from "react";
import AnalysesByMonthChart from "../AnalysesByMonthChart";
import "./styles.scss";
import dayjs from "dayjs";

export interface IAnalysesByMonthChartContainer {
  mes: string;
  entrada: number;
  saida: number;
}

interface TimelinePoint {
  period_start: string;
  income_total: number;
  real_spending_total: number;
}

interface AnalysesByMonthChartContainerProps {
  queryString?: string;
  groupBy?: "day" | "month";
  data?: IAnalysesByMonthChartContainer[];
}

const AnalysesByMonthChartContainer = ({
  queryString = "",
  groupBy = "month",
  data: providedData,
}: AnalysesByMonthChartContainerProps) => {
  const requestIdRef = useRef(0);
  const [chartData, setChartData] = useState<IAnalysesByMonthChartContainer[]>(providedData ?? []);

  const getPeriodLabel = (dateString: string) => {
    return groupBy === "day" ? dayjs(dateString).format("DD/MM") : dayjs(dateString).format("MMM");
  };

  const getData = async (currentRequestId: number) => {
    try {
      const endpoint = queryString ? `analysis/timeline?${queryString}&group_by=${groupBy}` : `analysis/timeline?group_by=${groupBy}`;
      const { data } = await request({
        method: "GET",
        endpoint,
      });

      const series = (data?.data?.series ?? []) as TimelinePoint[];
      const transformedData = series.map((item) => ({
        mes: getPeriodLabel(item.period_start),
        entrada: Number(item.income_total || 0),
        saida: Number(item.real_spending_total || 0),
      }));

      if (requestIdRef.current === currentRequestId) {
        setChartData(transformedData);
      }
    } catch (error) {
      console.error("Erro ao obter os dados da API", error);
      if (requestIdRef.current === currentRequestId) {
        setChartData([]);
      }
    }
  };

  useEffect(() => {
    if (providedData !== undefined) {
      setChartData(providedData);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setChartData([]);
    getData(currentRequestId);
  }, [providedData, queryString, groupBy]);

  return (
    <div className="card">
      <h4>Fluxo do Período</h4>
      <AnalysesByMonthChart data={chartData} />
    </div>
  );
};

export default AnalysesByMonthChartContainer;