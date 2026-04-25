import { useEffect, useRef, useState } from "react";
import ExpensesByCategoryChart from "../ExpensesByCategoryChart";
import { request } from "@/service/api";

interface AnalysisCategory {
  category_description: string;
  real_spending_total: number;
  credit_card_purchase_total: number;
  expense_composition_total: number;
  purchase_composition_total: number;
}

type ChartSlice = {
  name: string;
  value: number;
  fill: string;
};

interface ExpensesByCategoryChartContainerProps {
  queryString?: string;
  title?: string;
  metric?: "real_spending_total" | "credit_card_purchase_total" | "expense_composition_total" | "purchase_composition_total";
  emptyMessage?: string;
  data?: ChartSlice[];
}

const colors = ["#6C5DD3", "#87E344", "#D822E3", "#17E3B9", "#F4A74B", "#F45252"];

const ExpensesByCategoryChartContainer = ({
  queryString = "",
  title = "Composição por Categoria",
  metric = "real_spending_total",
  emptyMessage = "Nenhum gasto encontrado no período.",
  data: providedData,
}: ExpensesByCategoryChartContainerProps) => {
  const requestIdRef = useRef(0);
  const [data, setData] = useState<ChartSlice[]>(providedData ?? []);

  const getData = async (currentRequestId: number) => {
    try {
      const endpoint = queryString ? `analysis/categories?${queryString}` : "analysis/categories";
      const { data } = await request({
        method: "GET",
        endpoint,
      });

      const categories = (data?.data?.categories ?? []) as AnalysisCategory[];
      const transformedData = categories
        .map((category, index) => {
          const value = Number(category[metric] || 0);
          if (value <= 0) return null;

          return {
            name: category.category_description,
            value,
            fill: colors[index % colors.length],
          };
        })
        .filter((item): item is ChartSlice => item !== null);

      if (requestIdRef.current === currentRequestId) {
        setData(transformedData);
      }
    } catch (error) {
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
  }, [providedData, metric, queryString]);

  return (
    <div className={title ? "card" : ""}>
      {title ? <h4>{title}</h4> : null}
      <ExpensesByCategoryChart data={data} emptyMessage={emptyMessage} />
    </div>
  );
};

export default ExpensesByCategoryChartContainer;
