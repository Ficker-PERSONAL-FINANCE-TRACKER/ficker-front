import { useEffect, useRef, useState } from "react";
import ExpensesByCategoryChart from "../ExpensesByCategoryChart";
import { request } from "@/service/api";

interface AnalysisPaymentMethod {
  payment_method_description: string;
  total_value: number;
}

type ChartSlice = {
  name: string;
  value: number;
  fill: string;
};

interface PaymentMethodUsageChartContainerProps {
  queryString?: string;
  endpoint?: string;
  title?: string;
  emptyMessage?: string;
  data?: ChartSlice[];
}

const colors = ["#6C5DD3", "#87E344", "#17E3B9", "#F4A74B", "#F45252", "#00B8D9"];

const PaymentMethodUsageChartContainer = ({
  queryString = "",
  endpoint = "analysis/payment-methods",
  title = "Utilização dos Métodos de Pagamento",
  emptyMessage = "Nenhum uso de método de pagamento encontrado no período.",
  data: providedData,
}: PaymentMethodUsageChartContainerProps) => {
  const requestIdRef = useRef(0);
  const [data, setData] = useState<ChartSlice[]>(providedData ?? []);

  const getData = async (currentRequestId: number) => {
    try {
      const resolvedEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
      const { data } = await request({
        method: "GET",
        endpoint: resolvedEndpoint,
      });

      const methods = (data?.data?.payment_methods ?? []) as AnalysisPaymentMethod[];
      const transformedData = methods
        .map((method, index) => {
          const value = Number(method.total_value || 0);
          if (value <= 0) return null;

          return {
            name: method.payment_method_description,
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
  }, [providedData, endpoint, queryString]);

  return (
    <div className="card">
      <h4>{title}</h4>
      <ExpensesByCategoryChart data={data} emptyMessage={emptyMessage} />
    </div>
  );
};

export default PaymentMethodUsageChartContainer;
