"use client";

import CustomMenu from "@/components/CustomMenu";
import AnalysesByMonthChartContainer from "@/components/AnalysesByMonthChartContainer";
import ExpensesByCategoryChartContainer from "@/components/ExpensesByCategoryChartContainer";
import PaymentMethodUsageChartContainer from "@/components/PaymentMethodUsageChartContainer";
import PlannedSpendingByRealSpendingChartContainer from "@/components/PlannedSpendingByRealSppendingChartContainer";
import { request } from "@/service/api";
import { Button, DatePicker, Form, Modal, Row, Select, Spin } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import styles from "./analysis.module.scss";

const { RangePicker } = DatePicker;

const MONTH_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const CHART_COLORS = ["#6C5DD3", "#87E344", "#D822E3", "#17E3B9", "#F4A74B", "#F45252"];
const PAYMENT_METHOD_CHART_COLORS = ["#6C5DD3", "#87E344", "#17E3B9", "#F4A74B", "#F45252", "#00B8D9"];
const CARD_STATUS_LABELS: Record<string, string> = {
  payable: "Fatura pagável",
  awaiting_closure: "Aguardando fechamento",
  paid: "Fatura paga",
  aberta: "Fatura aberta",
  parcialmente_paga: "Parcialmente paga",
  paga: "Fatura paga",
  disponivel_para_pagamento: "Fatura pagável",
  aguardando_fechamento: "Aguardando fechamento",
  no_invoice: "Sem fatura aberta",
};

type AnalysisSummary = {
  income_total: number;
  real_spending_total: number;
  credit_card_purchase_total: number;
  invoice_payment_total: number;
  planned_spending_total: number;
  planned_spending_difference: number;
  balance_delta: number;
};

type AnalysisCard = {
  card_id: number;
  card_description: string;
  flag_description?: string | null;
  current_invoice_pay_day?: string | null;
  current_invoice_closure_date?: string | null;
  current_invoice_original_total?: number;
  current_invoice_paid_total?: number;
  next_invoice_pay_day?: string | null;
  next_invoice_total?: number;
  purchases_total_in_period?: number;
  purchases_count_in_period?: number;
  average_purchase_in_period?: number;
  largest_purchase_in_period?: number;
  largest_purchase_date_in_period?: string | null;
  largest_purchase_description_in_period?: string | null;
  latest_purchase_in_period?: number;
  latest_purchase_date_in_period?: string | null;
  latest_purchase_description_in_period?: string | null;
  invoices_due_total_in_period?: number;
  invoices_settled_total_in_period?: number;
  invoice_payments_total_in_period?: number;
  paid_invoices_count_in_period?: number;
  current_invoice_total: number;
  open_invoice_total: number;
  future_commitment_total: number;
  current_invoice_status: string;
  can_pay_current_invoice: boolean;
};

type TopExpenseTransaction = {
  transaction_id: number;
  transaction_description: string;
  transaction_value: number;
  category_description: string;
  is_credit_card_purchase: boolean;
  is_invoice_payment: boolean;
};

type TopExpensesPayload = {
  transactions: TopExpenseTransaction[];
};

type AnalysisTimelinePoint = {
  period_start: string;
  income_total: number;
  real_spending_total: number;
  planned_spending_total: number | null;
};

type AnalysisCategory = {
  category_description: string;
  real_spending_total: number;
  credit_card_purchase_total: number;
  expense_composition_total: number;
  purchase_composition_total: number;
};

type AnalysisPaymentMethod = {
  payment_method_description: string;
  total_value: number;
};

type AnalysisInvoice = {
  card_id: number;
  pay_day: string;
  closure_date?: string | null;
  invoice_total: number;
  paid_total: number;
  open_total: number;
  is_paid: boolean;
  paid_at?: string | null;
  status: string;
};

type CardCategoryCharts = Record<number, ChartSlice[]>;
type CardInvoiceStatusSummary = Record<number, { paid: number; partial: number; open: number }>;

type ChartSlice = {
  name: string;
  value: number;
  fill: string;
};

type TimelineChartPoint = {
  mes: string;
  entrada: number;
  saida: number;
};

type PlannedVsRealChartPoint = {
  name: string;
  planejado: number;
  real: number;
};

type AnalysisFilterMode = "month" | "custom";

type AnalysisFilters = {
  mode: AnalysisFilterMode;
  month: number;
  year: number;
  dateFrom: string | null;
  dateTo: string | null;
};

type FilterFormValues = {
  mode: AnalysisFilterMode;
  month?: number;
  year?: number;
  range?: [Dayjs, Dayjs];
};

const currency = (value: number | null | undefined) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return dayjs(value).format("DD/MM/YYYY");
};

const buildQueryString = (filters: AnalysisFilters) => {
  const params = new URLSearchParams();

  if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
    params.set("date_from", filters.dateFrom);
    params.set("date_to", filters.dateTo);
  } else {
    params.set("month", String(filters.month));
    params.set("year", String(filters.year));
  }

  return params.toString();
};

const getTimelineGroupBy = (filters: AnalysisFilters) => {
  if (filters.mode !== "custom" || !filters.dateFrom || !filters.dateTo) {
    return "month";
  }

  const start = dayjs(filters.dateFrom);
  const end = dayjs(filters.dateTo);
  const diffInDays = Math.max(end.diff(start, "day"), 0);

  return diffInDays <= 62 ? "day" : "month";
};

const buildCategoryChartData = (
  categories: AnalysisCategory[],
  metric: "real_spending_total" | "credit_card_purchase_total" | "expense_composition_total" | "purchase_composition_total"
) =>
  categories
    .map((category, index) => {
      const value = Number(category[metric] || 0);
      if (value <= 0) return null;

      return {
        name: category.category_description,
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      };
    })
    .filter((item): item is ChartSlice => item !== null);

const buildPaymentMethodChartData = (methods: AnalysisPaymentMethod[]) =>
  methods
    .map((method, index) => {
      const value = Number(method.total_value || 0);
      if (value <= 0) return null;

      return {
        name: method.payment_method_description,
        value,
        fill: PAYMENT_METHOD_CHART_COLORS[index % PAYMENT_METHOD_CHART_COLORS.length],
      };
    })
    .filter((item): item is ChartSlice => item !== null);

const normalizeInvoiceSummaryStatus = (status: string) => {
  switch (status) {
    case "paga":
    case "paid":
      return "paid" as const;
    case "parcialmente_paga":
      return "partial" as const;
    default:
      return "open" as const;
  }
};

const Analysis = () => {
  const now = new Date();
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [cards, setCards] = useState<AnalysisCard[]>([]);
  const [topExpenses, setTopExpenses] = useState<TopExpensesPayload>({ transactions: [] });
  const [timelineSeries, setTimelineSeries] = useState<AnalysisTimelinePoint[]>([]);
  const [categories, setCategories] = useState<AnalysisCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<AnalysisPaymentMethod[]>([]);
  const [invoicePaymentMethods, setInvoicePaymentMethods] = useState<AnalysisPaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<AnalysisInvoice[]>([]);
  const [cardCategoryCharts, setCardCategoryCharts] = useState<CardCategoryCharts>({});
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<AnalysisFilters>({
    mode: "month",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    dateFrom: null,
    dateTo: null,
  });
  const [form] = Form.useForm<FilterFormValues>();

  const queryString = useMemo(() => buildQueryString(filters), [filters]);
  const timelineGroupBy = useMemo(() => getTimelineGroupBy(filters), [filters]);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);

      try {
        const [
          summaryResponse,
          cardsResponse,
          topExpensesResponse,
          timelineResponse,
          categoriesResponse,
          invoicesResponse,
          paymentMethodsResponse,
          invoicePaymentMethodsResponse,
        ] = await Promise.all([
          request({ method: "GET", endpoint: `analysis/summary?${queryString}` }),
          request({ method: "GET", endpoint: `analysis/cards?${queryString}` }),
          request({ method: "GET", endpoint: `analysis/top-expenses?${queryString}&limit=5` }),
          request({ method: "GET", endpoint: `analysis/timeline?${queryString}&group_by=${timelineGroupBy}` }),
          request({ method: "GET", endpoint: `analysis/categories?${queryString}` }),
          request({ method: "GET", endpoint: `analysis/invoices?${queryString}` }),
          request({ method: "GET", endpoint: `analysis/payment-methods?${queryString}` }),
          request({ method: "GET", endpoint: `analysis/invoice-payment-methods?${queryString}` }),
        ]);

        const fetchedCards = (cardsResponse.data?.data?.cards ?? []) as AnalysisCard[];
        const cardCategoryEntries = await Promise.all(
          fetchedCards.map(async (card) => {
            const cardCategoriesResponse = await request({
              method: "GET",
              endpoint: `analysis/categories?${queryString}&card_id=${card.card_id}`,
            });
            const cardCategories = (cardCategoriesResponse.data?.data?.categories ?? []) as AnalysisCategory[];

            return [card.card_id, buildCategoryChartData(cardCategories, "credit_card_purchase_total")] as const;
          })
        );

        setSummary(summaryResponse.data?.data ?? null);
        setCards(fetchedCards);
        setTopExpenses((topExpensesResponse.data?.data ?? { transactions: [] }) as TopExpensesPayload);
        setTimelineSeries((timelineResponse.data?.data?.series ?? []) as AnalysisTimelinePoint[]);
        setCategories((categoriesResponse.data?.data?.categories ?? []) as AnalysisCategory[]);
        setInvoices((invoicesResponse.data?.data?.invoices ?? []) as AnalysisInvoice[]);
        setPaymentMethods((paymentMethodsResponse.data?.data?.payment_methods ?? []) as AnalysisPaymentMethod[]);
        setInvoicePaymentMethods((invoicePaymentMethodsResponse.data?.data?.payment_methods ?? []) as AnalysisPaymentMethod[]);
        setCardCategoryCharts(Object.fromEntries(cardCategoryEntries));
      } catch (error) {
        console.log(error);
        setSummary(null);
        setCards([]);
        setTopExpenses({ transactions: [] });
        setTimelineSeries([]);
        setCategories([]);
        setInvoices([]);
        setPaymentMethods([]);
        setInvoicePaymentMethods([]);
        setCardCategoryCharts({});
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [queryString, timelineGroupBy]);

  const cardMetrics = useMemo(() => {
    const currentInvoiceTotal = cards.reduce((acc, card) => acc + Number(card.current_invoice_total || 0), 0);
    const nextInvoiceTotal = cards.reduce((acc, card) => acc + Number(card.next_invoice_total || 0), 0);
    const futureCommitmentTotal = cards.reduce((acc, card) => acc + Number(card.future_commitment_total || 0), 0);
    const currentCommitmentTotal = currentInvoiceTotal + futureCommitmentTotal;
    const payableCardsCount = cards.filter((card) => card.can_pay_current_invoice && Number(card.current_invoice_total || 0) > 0).length;
    const currentInvoiceOriginalTotal = cards.reduce((acc, card) => acc + Number(card.current_invoice_original_total || 0), 0);
    const currentInvoicePaidTotal = cards.reduce((acc, card) => acc + Number(card.current_invoice_paid_total || 0), 0);
    const invoicesDueTotalInPeriod = cards.reduce((acc, card) => acc + Number(card.invoices_due_total_in_period || 0), 0);
    const invoicesSettledTotalInPeriod = cards.reduce((acc, card) => acc + Number(card.invoices_settled_total_in_period || 0), 0);

    return {
      currentInvoiceTotal,
      nextInvoiceTotal,
      futureCommitmentTotal,
      currentCommitmentTotal,
      payableCardsCount,
      currentInvoiceOriginalTotal,
      currentInvoicePaidTotal,
      invoicesDueTotalInPeriod,
      invoicesSettledTotalInPeriod,
    };
  }, [cards]);

  const timelineChartData = useMemo<TimelineChartPoint[]>(
    () =>
      timelineSeries.map((item) => ({
        mes: timelineGroupBy === "day" ? dayjs(item.period_start).format("DD/MM") : dayjs(item.period_start).format("MMM"),
        entrada: Number(item.income_total || 0),
        saida: Number(item.real_spending_total || 0),
      })),
    [timelineSeries, timelineGroupBy]
  );

  const plannedVsRealChartData = useMemo<PlannedVsRealChartPoint[]>(
    () =>
      timelineSeries.map((item) => ({
        name: timelineGroupBy === "day" ? dayjs(item.period_start).format("DD/MM") : dayjs(item.period_start).format("MMM"),
        planejado: Number(item.planned_spending_total || 0),
        real: Number(item.real_spending_total || 0),
      })),
    [timelineSeries, timelineGroupBy]
  );

  const categoryChartData = useMemo(() => {
    return {
      purchases: buildCategoryChartData(categories, "purchase_composition_total"),
      real: buildCategoryChartData(categories, "real_spending_total"),
      credit: buildCategoryChartData(categories, "credit_card_purchase_total"),
    };
  }, [categories]);

  const paymentMethodChartData = useMemo(() => {
    return {
      paymentMethods: buildPaymentMethodChartData(paymentMethods),
      invoicePaymentMethods: buildPaymentMethodChartData(invoicePaymentMethods),
    };
  }, [paymentMethods, invoicePaymentMethods]);

  const cardInvoiceStatusSummary = useMemo<CardInvoiceStatusSummary>(() => {
    return invoices.reduce<CardInvoiceStatusSummary>((acc, invoice) => {
      const current = acc[invoice.card_id] ?? { paid: 0, partial: 0, open: 0 };
      const normalizedStatus = normalizeInvoiceSummaryStatus(invoice.status);

      if (normalizedStatus === "paid") {
        current.paid += 1;
      } else if (normalizedStatus === "partial") {
        current.partial += 1;
      } else {
        current.open += 1;
      }

      acc[invoice.card_id] = current;
      return acc;
    }, {});
  }, [invoices]);

  const topExpense = topExpenses.transactions[0] ?? null;
  const differenceIsPositive = Number(summary?.planned_spending_difference || 0) >= 0;
  const totalCategoryPurchases = Number(summary?.real_spending_total || 0) + Number(summary?.credit_card_purchase_total || 0);
  const creditUsagePercentage = totalCategoryPurchases > 0
    ? (Number(summary?.credit_card_purchase_total || 0) / totalCategoryPurchases) * 100
    : 0;
  const invoicePaymentPercentage = Number(summary?.real_spending_total || 0) > 0
    ? (Number(summary?.invoice_payment_total || 0) / Number(summary?.real_spending_total || 0)) * 100
    : 0;
  const netBalancePercentage = Number(summary?.income_total || 0) > 0
    ? (Number(summary?.balance_delta || 0) / Number(summary?.income_total || 0)) * 100
    : 0;
  const invoiceSettlementPercentageInPeriod = Number(cardMetrics.invoicesDueTotalInPeriod || 0) > 0
    ? (Number(cardMetrics.invoicesSettledTotalInPeriod || 0) / Number(cardMetrics.invoicesDueTotalInPeriod || 0)) * 100
    : 0;
  const currentOpenSettlementPercentage = Number(cardMetrics.currentInvoiceOriginalTotal || 0) > 0
    ? (Number(cardMetrics.currentInvoicePaidTotal || 0) / Number(cardMetrics.currentInvoiceOriginalTotal || 0)) * 100
    : 0;
  const hasInvoicesInSelectedPeriod = invoices.length > 0;
  const hasPayableInvoicesInSelectedPeriod = invoices.some((invoice) => invoice.status !== "aguardando_fechamento");
  const hasCurrentInvoice = cards.some((card) => card.current_invoice_status !== "no_invoice");
  const hasCurrentInvoiceAwaitingClosure = cards.some(
    (card) => card.current_invoice_status === "aguardando_fechamento" || card.current_invoice_status === "awaiting_closure"
  );
  const currentMonthLabel = MONTH_OPTIONS.find((option) => option.value === filters.month)?.label ?? "Período";
  const yearOptions = Array.from({ length: 7 }, (_, index) => now.getFullYear() - 3 + index).map((year) => ({
    value: year,
    label: String(year),
  }));

  const filterSummary = useMemo(() => {
    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      return `${dayjs(filters.dateFrom).format("DD/MM/YYYY")} até ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`;
    }

    return `${currentMonthLabel} de ${filters.year}`;
  }, [currentMonthLabel, filters]);

  const getCardStatusLabel = (status: string) => {
    return CARD_STATUS_LABELS[status] ?? "Sem fatura aberta";
  };

  const getCardStatusClass = (status: string) => {
    switch (status) {
      case "payable":
        return styles.statusDanger;
      case "awaiting_closure":
        return styles.statusWarning;
      case "paid":
        return styles.statusSuccess;
      case "aberta":
        return styles.statusWarning;
      case "parcialmente_paga":
        return styles.statusDanger;
      case "paga":
        return styles.statusSuccess;
      case "disponivel_para_pagamento":
        return styles.statusDanger;
      case "aguardando_fechamento":
        return styles.statusWarning;
      default:
        return styles.statusNeutral;
    }
  };

  const getInvoiceStatusSummaryItems = (cardId: number) => {
    const summary = cardInvoiceStatusSummary[cardId];

    if (!summary) {
      return [];
    }

    return [
      summary.paid > 0 ? `${summary.paid} paga${summary.paid > 1 ? "s" : ""}` : null,
      summary.partial > 0 ? `${summary.partial} parcialmente quitada${summary.partial > 1 ? "s" : ""}` : null,
      summary.open > 0 ? `${summary.open} em aberto` : null,
    ].filter((item): item is string => item !== null);
  };

  const openFilterModal = () => {
    form.setFieldsValue({
      mode: filters.mode,
      month: filters.month,
      year: filters.year,
      range: filters.dateFrom && filters.dateTo ? [dayjs(filters.dateFrom), dayjs(filters.dateTo)] : undefined,
    });
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = async () => {
    const values = await form.validateFields();

    if (values.mode === "custom") {
      const range = values.range;
      setFilters({
        mode: "custom",
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        dateFrom: range?.[0]?.format("YYYY-MM-DD") ?? null,
        dateTo: range?.[1]?.format("YYYY-MM-DD") ?? null,
      });
    } else {
      setFilters({
        mode: "month",
        month: Number(values.month),
        year: Number(values.year),
        dateFrom: null,
        dateTo: null,
      });
    }

    setIsFilterModalOpen(false);
  };

  const selectedMode = Form.useWatch("mode", form) ?? filters.mode;

  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <CustomMenu showAlert={false} />
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Análises</h2>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.filterSummary}>{filterSummary}</span>
            <Button className={styles.filterButton} onClick={openFilterModal}>Filtrar</Button>
          </div>
        </div>

        {loading ? (
          <Row justify="center" className={styles.loadingArea}>
            <Spin />
          </Row>
        ) : (
          <>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Entradas no período</p>
                <h3 className={styles.metricValue}>{currency(summary?.income_total)}</h3>
                <span className={styles.metricHint}>Tudo o que entrou no caixa no período filtrado.</span>
              </div>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Gasto real</p>
                <h3 className={styles.metricValue}>{currency(summary?.real_spending_total)}</h3>
                <span className={styles.metricHint}>Saídas que realmente afetaram o saldo.</span>
              </div>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Compras no crédito</p>
                <h3 className={`${styles.metricValue} ${styles.metricWarning}`}>{currency(summary?.credit_card_purchase_total)}</h3>
                <span className={styles.metricHint}>Consumo no cartão que ainda não virou gasto real.</span>
              </div>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Pagamentos de fatura</p>
                <h3 className={`${styles.metricValue} ${styles.metricDanger}`}>{currency(summary?.invoice_payment_total)}</h3>
                <span className={styles.metricHint}>Quanto do período foi usado para quitar faturas.</span>
              </div>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Saldo líquido do período</p>
                <h3 className={`${styles.metricValue} ${Number(summary?.balance_delta || 0) >= 0 ? styles.metricSuccess : styles.metricDanger}`}>
                  {currency(summary?.balance_delta)}
                </h3>
                <span className={styles.metricHint}>Entradas do período menos o gasto real do mesmo recorte.</span>
              </div>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Saldo líquido percentual</p>
                <h3 className={`${styles.metricValue} ${netBalancePercentage >= 0 ? styles.metricSuccess : styles.metricDanger}`}>
                  {netBalancePercentage.toFixed(1)}%
                </h3>
                <span className={styles.metricHint}>Quanto das entradas do período permaneceu líquido após o gasto real.</span>
              </div>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Quitação das faturas do período</p>
                <h3 className={styles.metricValue}>{currency(cardMetrics.invoicesSettledTotalInPeriod)}</h3>
                <span className={styles.metricHint}>
                  {hasPayableInvoicesInSelectedPeriod && Number(cardMetrics.invoicesDueTotalInPeriod || 0) > 0
                    ? `${invoiceSettlementPercentageInPeriod.toFixed(1)}% do valor das faturas com vencimento no período já foi quitado.`
                    : hasInvoicesInSelectedPeriod
                      ? hasPayableInvoicesInSelectedPeriod
                        ? "Nenhuma quitação registrada para as faturas com vencimento no período."
                        : "Nenhuma fatura disponível para pagamento no momento."
                      : "Nenhuma fatura com vencimento no período selecionado."}
                </span>
              </div>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Quitação do aberto atual</p>
                <h3 className={styles.metricValue}>{currency(cardMetrics.currentInvoicePaidTotal)}</h3>
                <span className={styles.metricHint}>
                  {Number(cardMetrics.payableCardsCount || 0) > 0
                    ? `${currentOpenSettlementPercentage.toFixed(1)}% da fatura atual já foi quitada.`
                    : hasCurrentInvoice
                      ? hasCurrentInvoiceAwaitingClosure
                        ? "Nenhuma fatura disponível para pagamento no momento."
                        : "Nenhuma quitação registrada para o aberto atual."
                      : "Nenhuma fatura em aberto no momento."}
                </span>
              </div>
            </div>

            <div className={styles.metricsGridTertiary}>
              <div className={styles.metricCardSecondary}>
                <p className={styles.metricLabel}>Planejado no período</p>
                <h3 className={styles.metricValueSecondary}>{currency(summary?.planned_spending_total)}</h3>
              </div>
              <div className={styles.metricCardSecondary}>
                <p className={styles.metricLabel}>Diferença planejado x real</p>
                <h3 className={`${styles.metricValueSecondary} ${differenceIsPositive ? styles.metricSuccess : styles.metricDanger}`}>
                  {currency(summary?.planned_spending_difference)}
                </h3>
              </div>
              <div className={styles.metricCardSecondary}>
                <p className={styles.metricLabel}>Faturas atuais</p>
                <h3 className={styles.metricValueSecondary}>{currency(cardMetrics.currentInvoiceTotal)}</h3>
                <span className={styles.metricHint}>{cardMetrics.payableCardsCount} cartão(ões) com fatura pagável.</span>
              </div>
              <div className={styles.metricCardSecondary}>
                <p className={styles.metricLabel}>Próxima fatura</p>
                <h3 className={styles.metricValueSecondary}>{currency(cardMetrics.nextInvoiceTotal)}</h3>
                <span className={styles.metricHint}>Soma da próxima fatura prevista em todos os cartões.</span>
              </div>
              <div className={styles.metricCardSecondary}>
                <p className={styles.metricLabel}>Comprometimento futuro</p>
                <h3 className={styles.metricValueSecondary}>{currency(cardMetrics.futureCommitmentTotal)}</h3>
                <span className={styles.metricHint}>Compras e parcelas que ainda não viraram fatura atual.</span>
              </div>
              <div className={styles.metricCardSecondary}>
                <p className={styles.metricLabel}>Comprometimento total</p>
                <h3 className={styles.metricValueSecondary}>{currency(cardMetrics.currentCommitmentTotal)}</h3>
                <span className={styles.metricHint}>Faturas atuais somadas ao comprometimento futuro.</span>
              </div>
            </div>

            <div className={styles.analysisGrid}>
              <div className={styles.metricCardSecondary}>
                <PlannedSpendingByRealSpendingChartContainer data={plannedVsRealChartData} />
              </div>
              <div className={styles.metricCardSecondary}>
                <AnalysesByMonthChartContainer data={timelineChartData} />
              </div>
              <div className={styles.metricCardSecondary}>
                <ExpensesByCategoryChartContainer
                  title="Compras por Categoria"
                  emptyMessage="Nenhuma compra encontrada no período."
                  data={categoryChartData.purchases}
                />
              </div>
              <div className={styles.metricCardSecondary}>
                <div className={styles.metricSummaryStack}>
                  <div>
                    <p className={styles.metricLabel}>Total comprado no período</p>
                    <h3 className={styles.metricValueSecondary}>{currency(totalCategoryPurchases)}</h3>
                  </div>
                  <div>
                    <p className={styles.metricLabel}>Gasto real</p>
                    <h3 className={styles.metricValueSecondary}>{currency(summary?.real_spending_total)}</h3>
                  </div>
                  <div>
                    <p className={styles.metricLabel}>Total no crédito</p>
                    <h3 className={`${styles.metricValueSecondary} ${styles.metricWarning}`}>{currency(summary?.credit_card_purchase_total)}</h3>
                  </div>
                  <div>
                    <p className={styles.metricLabel}>Total pago em faturas</p>
                    <h3 className={`${styles.metricValueSecondary} ${styles.metricDanger}`}>{currency(summary?.invoice_payment_total)}</h3>
                  </div>
                </div>
              </div>
              <div className={styles.metricCardSecondary}>
                <p className={styles.metricLabel}>Percentual de uso do crédito</p>
                <h3 className={`${styles.metricValueSecondary} ${styles.metricWarning}`}>{creditUsagePercentage.toFixed(1)}%</h3>
                <span className={styles.metricHint}>Participação das compras no crédito dentro do total comprado no período.</span>
              </div>
              <div className={styles.metricCardSecondary}>
                <p className={styles.metricLabel}>Percentual pago em faturas</p>
                <h3 className={`${styles.metricValueSecondary} ${styles.metricDanger}`}>{invoicePaymentPercentage.toFixed(1)}%</h3>
                <span className={styles.metricHint}>Quanto do gasto real do período foi consumido por pagamentos de fatura.</span>
              </div>
              <div className={styles.metricCardSecondary}>
                <ExpensesByCategoryChartContainer
                  title="Gasto real por Categoria"
                  emptyMessage="Nenhum gasto real encontrado no período."
                  data={categoryChartData.real}
                />
              </div>
              <div className={styles.metricCardSecondary}>
                <ExpensesByCategoryChartContainer
                  title="Compras no Crédito por Categoria"
                  emptyMessage="Nenhum consumo no crédito encontrado no período."
                  data={categoryChartData.credit}
                />
              </div>
              <div className={styles.metricCardSecondary}>
                <PaymentMethodUsageChartContainer data={paymentMethodChartData.paymentMethods} />
              </div>
              <div className={styles.metricCardSecondary}>
                <PaymentMethodUsageChartContainer
                  title="Métodos de pagamento das faturas"
                  emptyMessage="Nenhum pagamento de fatura encontrado no período."
                  data={paymentMethodChartData.invoicePaymentMethods}
                />
              </div>
            </div>

            <div className={styles.singleAnalysisRow}>
              <div className={styles.metricCardSecondary}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h4 className={styles.sectionTitle}>Compras no crédito por categoria e cartão</h4>
                    <p className={styles.sectionSubtitle}>Leitura por cartão do que foi comprado no crédito dentro do período filtrado.</p>
                  </div>
                </div>

                {cards.length > 0 ? (
                  <div className={styles.cardCategoryChartsGrid}>
                    {cards.map((card) => (
                      <div key={`card-category-${card.card_id}`} className={styles.metricCardSecondary}>
                        <div className={styles.sectionHeader}>
                          <div>
                            <h4 className={styles.sectionTitle}>{card.card_description}</h4>
                            <p className={styles.sectionSubtitle}>{card.flag_description || "Cartão"}</p>
                          </div>
                        </div>
                        <ExpensesByCategoryChartContainer
                          title=""
                          metric="credit_card_purchase_total"
                          emptyMessage="Nenhuma compra no crédito encontrada para este cartão no período."
                          data={cardCategoryCharts[card.card_id] ?? []}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>Nenhum cartão encontrado para o período.</div>
                )}
              </div>
            </div>

            <div className={styles.singleAnalysisRow}>
              <div className={styles.metricCardSecondary}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h4 className={styles.sectionTitle}>Cartões no período filtrado</h4>
                    <p className={styles.sectionSubtitle}>Resumo do que aconteceu com cada cartão dentro do intervalo selecionado.</p>
                  </div>
                </div>

                <div className={styles.cardInsightsList}>
                  {cards.length > 0 ? (
                    cards.map((card) => {
                      const invoiceSummaryItems = getInvoiceStatusSummaryItems(card.card_id);

                      return (
                      <div key={`filtered-card-${card.card_id}`} className={styles.cardInsightItem}>
                        <div className={styles.cardInsightTop}>
                          <div>
                            <h5 className={styles.cardInsightTitle}>{card.card_description}</h5>
                            <span className={styles.cardInsightFlag}>{card.flag_description || "Cartão"}</span>
                          </div>
                        </div>

                        <div className={styles.cardInsightMetrics}>
                          <div>
                            <span className={styles.cardInsightLabel}>Compras no período</span>
                            <strong>{currency(card.purchases_total_in_period)}</strong>
                            <span className={styles.cardInsightSubtext}>{Number(card.purchases_count_in_period || 0)} lançamento(s)</span>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Ticket médio</span>
                            <strong>{currency(card.average_purchase_in_period)}</strong>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Maior compra</span>
                            <strong>{currency(card.largest_purchase_in_period)}</strong>
                            <span className={styles.cardInsightSubtext}>{card.largest_purchase_description_in_period || "-"}</span>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Última compra</span>
                            <strong>{currency(card.latest_purchase_in_period)}</strong>
                            <span className={styles.cardInsightSubtext}>{formatDate(card.latest_purchase_date_in_period)}</span>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Pagamentos de fatura</span>
                            <strong>{currency(card.invoice_payments_total_in_period)}</strong>
                            <span className={styles.cardInsightSubtext}>
                              {Number(card.paid_invoices_count_in_period || 0) > 0
                                ? "Pago no período"
                                : Number(card.invoice_payments_total_in_period || 0) > 0
                                  ? "Parcialmente pago no período"
                                  : "Sem pagamento no período"}
                              {` · ${Number(card.paid_invoices_count_in_period || 0)} fatura(s) paga(s)`}
                            </span>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Situação atual das faturas do período</span>
                            {invoiceSummaryItems.length > 0 ? (
                              <>
                                <strong>{invoiceSummaryItems.join(" · ")}</strong>
                                <ul className={styles.statusSummaryList}>
                                  {invoiceSummaryItems.map((item) => (
                                    <li key={`${card.card_id}-${item}`}>{item}</li>
                                  ))}
                                </ul>
                                <span className={styles.cardInsightSubtext}>
                                  Considera o status atual das faturas com vencimento no período, mesmo se a quitação aconteceu depois.
                                </span>
                              </>
                            ) : (
                              <span className={styles.cardInsightSubtext}>
                                Nenhuma fatura com vencimento dentro do período filtrado.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })
                  ) : (
                    <div className={styles.emptyState}>Nenhum cartão encontrado para o período.</div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.singleAnalysisRow}>
              <div className={styles.metricCardSecondary}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h4 className={styles.sectionTitle}>Cartões e crédito</h4>
                    <p className={styles.sectionSubtitle}>Situação atual dos cartões, independente do período filtrado.</p>
                  </div>
                </div>

                <div className={styles.cardInsightsList}>
                  {cards.length > 0 ? (
                    cards.map((card) => (
                      <div key={card.card_id} className={styles.cardInsightItem}>
                        <div className={styles.cardInsightTop}>
                          <div>
                            <h5 className={styles.cardInsightTitle}>{card.card_description}</h5>
                            <span className={styles.cardInsightFlag}>{card.flag_description || "Cartão"}</span>
                          </div>
                          <span className={`${styles.statusPill} ${getCardStatusClass(card.current_invoice_status)}`}>
                            {getCardStatusLabel(card.current_invoice_status)}
                          </span>
                        </div>

                        <div className={styles.cardInsightMetrics}>
                          <div>
                            <span className={styles.cardInsightLabel}>Fatura atual</span>
                            <strong>{currency(card.current_invoice_total)}</strong>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Total em aberto</span>
                            <strong>{currency(card.open_invoice_total)}</strong>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Comprometimento futuro</span>
                            <strong>{currency(card.future_commitment_total)}</strong>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Fechamento</span>
                            <strong>{formatDate(card.current_invoice_closure_date)}</strong>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Vencimento</span>
                            <strong>{formatDate(card.current_invoice_pay_day)}</strong>
                          </div>
                          <div>
                            <span className={styles.cardInsightLabel}>Próxima fatura</span>
                            <strong>{currency(card.next_invoice_total)}</strong>
                            <span className={styles.cardInsightSubtext}>{formatDate(card.next_invoice_pay_day)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>Nenhum cartão encontrado para o período.</div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.singleAnalysisRow}>
              <div className={styles.metricCardSecondary}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h4 className={styles.sectionTitle}>Maior gasto do período</h4>
                    <p className={styles.sectionSubtitle}>O lançamento que mais pesou no período atual.</p>
                  </div>
                </div>

                {topExpense ? (
                  <div className={styles.topExpenseCard}>
                    <span className={styles.topExpenseCategory}>{topExpense.category_description || "Sem categoria"}</span>
                    <h3 className={styles.topExpenseValue}>{currency(topExpense.transaction_value)}</h3>
                    <p className={styles.topExpenseDescription}>{topExpense.transaction_description}</p>
                    <span className={styles.topExpenseMeta}>
                      {topExpense.is_invoice_payment
                        ? "Pagamento de fatura"
                        : topExpense.is_credit_card_purchase
                          ? "Compra no cartão"
                          : "Saída real"}
                    </span>
                  </div>
                ) : (
                  <div className={styles.emptyState}>Nenhum gasto encontrado para o período.</div>
                )}
              </div>
            </div>
          </>
        )}

        <Modal
          title="Filtrar análises"
          open={isFilterModalOpen}
          onOk={handleApplyFilters}
          onCancel={() => setIsFilterModalOpen(false)}
          okText="Aplicar"
          cancelText="Cancelar"
          centered
        >
          <Form form={form} layout="vertical" initialValues={{ mode: filters.mode }}>
            <Form.Item name="mode" label="Modo de filtro" rules={[{ required: true, message: "Selecione um modo" }]}>
              <Select
                options={[
                  { value: "month", label: "Mês específico" },
                  { value: "custom", label: "Intervalo personalizado" },
                ]}
              />
            </Form.Item>

            {selectedMode === "custom" ? (
              <Form.Item
                name="range"
                label="Período"
                rules={[{ required: true, message: "Selecione um intervalo" }]}
              >
                <RangePicker format="DD/MM/YYYY" className={styles.rangePicker} />
              </Form.Item>
            ) : (
              <div className={styles.filterFieldsRow}>
                <Form.Item name="month" label="Mês" rules={[{ required: true, message: "Selecione um mês" }]}>
                  <Select options={MONTH_OPTIONS} />
                </Form.Item>
                <Form.Item name="year" label="Ano" rules={[{ required: true, message: "Selecione um ano" }]}>
                  <Select options={yearOptions} />
                </Form.Item>
              </div>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Analysis;
