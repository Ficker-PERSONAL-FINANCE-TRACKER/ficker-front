import { useEffect, useRef, useState } from "react";
import { request } from "@/service/api";
import "./styles.scss";
import PlannedSpendingByRealSpendingChart from "../PlannedSpendingByRealSpendingChart";
import dayjs from "dayjs";

export interface PlannedByMonth {
  name: string;
  planejado: number;
  real: number;
}

interface TimelinePoint {
  period_start: string;
  planned_spending_total: number | null;
  real_spending_total: number;
}

interface PlannedSpendingByRealSpendingChartContainerProps {
  queryString?: string;
  groupBy?: "day" | "month";
  data?: PlannedByMonth[];
}

const PlannedSpendingByRealSpendingChartContainer = ({
  queryString = "",
  groupBy = "month",
  data: providedData,
}: PlannedSpendingByRealSpendingChartContainerProps) => {
  const requestIdRef = useRef(0);
  const [data, setData] = useState<PlannedByMonth[]>(providedData ?? []);

  const getPeriodLabel = (dateString: string) => {
    return groupBy === "day" ? dayjs(dateString).format("DD/MM") : dayjs(dateString).format("MMM");
  };

  const getData = async (currentRequestId: number) => {
    try {
      const endpoint = queryString ? `analysis/timeline?${queryString}&group_by=${groupBy}` : `analysis/timeline?group_by=${groupBy}`;
      const { data } = await request({ method: "GET", endpoint });
      const series = (data?.data?.series ?? []) as TimelinePoint[];
      const transformedData = series.map((item) => ({
        name: getPeriodLabel(item.period_start),
        planejado: Number(item.planned_spending_total || 0),
        real: Number(item.real_spending_total || 0),
      }));

      if (requestIdRef.current === currentRequestId) {
        setData(transformedData);
      }
    } catch (error) {
      console.log(error);
      if (requestIdRef.current === currentRequestId) {
        setData([]);
      }
    }
  };

  useEffect(() => {
    if (providedData !== undefined) {
      setData(providedData);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setData([]);
    getData(currentRequestId);
  }, [providedData, queryString, groupBy]);

  return (
    <div className="card-chart">
      <h4>Planejado x Real</h4>
      <PlannedSpendingByRealSpendingChart data={data} />
    </div>
  );
};

export default PlannedSpendingByRealSpendingChartContainer;