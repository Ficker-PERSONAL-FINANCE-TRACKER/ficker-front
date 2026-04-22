"use client";

import CustomMenu from "@/components/CustomMenu";
import AnalysesByMonthChartContainer from "@/components/AnalysesByMonthChartContainer";
import ExpensesByCategoryChartContainer from "@/components/ExpensesByCategoryChartContainer";
import PaymentMethodUsageChartContainer from "@/components/PaymentMethodUsageChartContainer";
import PlannedSpendingByRealSpendingChartContainer from "@/components/PlannedSpendingByRealSppendingChartContainer";
import { request } from "@/service/api";
import { Button, DatePicker, Form, Modal, Row, Segmented, Select, Spin, Tabs } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import styles from "./analysis.module.scss";
import {
  BarChartOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  PayCircleOutlined,
  RiseOutlined,
  WalletOutlined,
} from "@ant-design/icons";

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

const CARD_LIFECYCLE_LABELS = {
  active: "Ativo",
  archived: "Arquivado",
} as const;

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
  archived_at?: string | null;
  current_invoice_pay_day?: string | null;
  current_invoice_closure_date?: string | null;
  current_invoice_original_total?: number;
  current_invoice_paid_total?: number;
  reference_invoice_pay_day?: string | null;
  reference_invoice_closure_date?: string | null;
  reference_invoice_original_total?: number;
  reference_invoice_paid_total?: number;
  reference_invoice_status?: string;
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
  previous_invoice_payments_total_in_period?: number;
  previous_paid_invoices_count_in_period?: number;
  previous_partial_invoices_count_in_period?: number;
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
  credit_card_purchase_total: number;
  planned_spending_total: number | null;
};

type TransactionTimelineSource = {
  date: string;
  type_id: number;
  transaction_value: number | string;
  payment_method_id?: number | string | null;
  affects_real_spending?: boolean | null;
};

type AccumulatedBalancePoint = {
  mes: string;
  saldo: number;
  gastoReal: number;
  credito: number;
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

type CardLifecycleItem = {
  id: number;
  archived_at?: string | null;
};

type CardCategoryCharts = Record<number, ChartSlice[]>;
type CardInvoiceStatusSummary = Record<number, { paid: number; partial: number; noPayment: number }>;

type ChartSlice = {
  name: string;
  value: number;
  fill: string;
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

const getPlannedVsRealGroupBy = (filters: AnalysisFilters) => {
  if (filters.mode !== "custom" || !filters.dateFrom || !filters.dateTo) {
    return "month";
  }

  const start = dayjs(filters.dateFrom);
  const end = dayjs(filters.dateTo);

  return start.isSame(end, "month") ? "day" : "month";
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
  const [balanceTimelineSeries, setBalanceTimelineSeries] = useState<AnalysisTimelinePoint[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [categories, setCategories] = useState<AnalysisCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<AnalysisPaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<AnalysisInvoice[]>([]);
  const [cardCategoryCharts, setCardCategoryCharts] = useState<CardCategoryCharts>({});
  const [loading, setLoading] = useState(true);
  const [categoryLens, setCategoryLens] = useState<"purchases" | "real" | "credit">("purchases");
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
  const timelineGroupBy = useMemo(() => getPlannedVsRealGroupBy(filters), [filters]);
  const balanceTimelineGroupBy = useMemo(() => {
    if (filters.mode === "month") {
      return "day" as const;
    }

    return getTimelineGroupBy(filters);
  }, [filters]);

  const balancePeriodStart = useMemo(() => {
    if (filters.mode === "custom" && filters.dateFrom) {
      return dayjs(filters.dateFrom).startOf("day");
    }

    return dayjs()
      .year(filters.year)
      .month(filters.month - 1)
      .startOf("month");
  }, [filters]);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);

      try {
        const [
          summaryResponse,
          cardsResponse,
          allCardsResponse,
          topExpensesResponse,
          timelineResponse,
          balanceTimelineResponse,
          transactionsResponse,
          categoriesResponse,
          invoicesResponse,
          paymentMethodsResponse,
        ] = await Promise.all([
          request({ method: "GET", endpoint: `analysis/summary?${queryString}` }),
          request({ method: "GET", endpoint: `analysis/cards?${queryString}` }),
          request({ method: "GET", endpoint: "cards", params: { status: "all" } }),
          request({ method: "GET", endpoint: `analysis/top-expenses?${queryString}&limit=5` }),
          request({ method: "GET", endpoint: `analysis/timeline?${queryString}&group_by=${timelineGroupBy}` }),
          request({ method: "GET", endpoint: `analysis/timeline?${queryString}&group_by=${balanceTimelineGroupBy}` }),
          request({ method: "GET", endpoint: `transaction/all` }),
          request({ method: "GET", endpoint: `analysis/categories?${queryString}` }),
          request({ method: "GET", endpoint: `analysis/invoices?${queryString}` }),
          request({ method: "GET", endpoint: `analysis/payment-methods?${queryString}` }),
        ]);

        const fetchedCards = (cardsResponse.data?.data?.cards ?? []) as AnalysisCard[];
        const allCards = (allCardsResponse.data?.data?.cards ?? []) as CardLifecycleItem[];
        const lifecycleByCardId = new Map(
          allCards.map((card) => [Number(card.id), card.archived_at ?? null] as const)
        );
        const cardsWithLifecycle = fetchedCards.map((card) => ({
          ...card,
          archived_at: lifecycleByCardId.get(Number(card.card_id)) ?? null,
        }));
        const transactions = (transactionsResponse.data?.data?.transactions ?? []) as TransactionTimelineSource[];
        const calculatedOpeningBalance = transactions.reduce((acc, transaction) => {
          const txDate = dayjs(transaction.date);
          const value = Number(transaction.transaction_value || 0);
          const affectsRealSpending =
            transaction.type_id === 2 &&
            (transaction.affects_real_spending === true || transaction.payment_method_id == null || Number(transaction.payment_method_id) !== 4);

          if (txDate.isBefore(balancePeriodStart, "day")) {
            if (transaction.type_id === 1) {
              return acc + value;
            }

            if (affectsRealSpending) {
              return acc - value;
            }
          }

          return acc;
        }, 0);
        const cardCategoryEntries = await Promise.all(
          cardsWithLifecycle.map(async (card) => {
            const cardCategoriesResponse = await request({
              method: "GET",
              endpoint: `analysis/categories?${queryString}&card_id=${card.card_id}`,
            });
            const cardCategories = (cardCategoriesResponse.data?.data?.categories ?? []) as AnalysisCategory[];

            return [card.card_id, buildCategoryChartData(cardCategories, "credit_card_purchase_total")] as const;
          })
        );

        setSummary(summaryResponse.data?.data ?? null);
        setCards(cardsWithLifecycle);
        setTopExpenses((topExpensesResponse.data?.data ?? { transactions: [] }) as TopExpensesPayload);
        setTimelineSeries((timelineResponse.data?.data?.series ?? []) as AnalysisTimelinePoint[]);
        setBalanceTimelineSeries((balanceTimelineResponse.data?.data?.series ?? []) as AnalysisTimelinePoint[]);
        setOpeningBalance(calculatedOpeningBalance);
        setCategories((categoriesResponse.data?.data?.categories ?? []) as AnalysisCategory[]);
        setInvoices((invoicesResponse.data?.data?.invoices ?? []) as AnalysisInvoice[]);
        setPaymentMethods((paymentMethodsResponse.data?.data?.payment_methods ?? []) as AnalysisPaymentMethod[]);
        setCardCategoryCharts(Object.fromEntries(cardCategoryEntries));
      } catch (error) {
        console.log(error);
        setSummary(null);
        setCards([]);
        setTopExpenses({ transactions: [] });
        setTimelineSeries([]);
        setBalanceTimelineSeries([]);
        setOpeningBalance(0);
        setCategories([]);
        setInvoices([]);
        setPaymentMethods([]);
        setCardCategoryCharts({});
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [balancePeriodStart, balanceTimelineGroupBy, queryString, timelineGroupBy]);

  const cardMetrics = useMemo(() => {
    const currentInvoiceTotal = cards.reduce((acc, card) => acc + Number(card.current_invoice_total || 0), 0);
    const nextInvoiceTotal = cards.reduce((acc, card) => acc + Number(card.next_invoice_total || 0), 0);
    const futureCommitmentTotal = cards.reduce((acc, card) => acc + Number(card.future_commitment_total || 0), 0);
    const currentCommitmentTotal = currentInvoiceTotal + futureCommitmentTotal;
    const payableCardsCount = cards.filter((card) => card.can_pay_current_invoice && Number(card.current_invoice_total || 0) > 0).length;
    const referenceInvoiceOriginalTotal = cards.reduce((acc, card) => acc + Number(card.reference_invoice_original_total || 0), 0);
    const referenceInvoicePaidTotal = cards.reduce((acc, card) => acc + Number(card.reference_invoice_paid_total || 0), 0);
    const invoicesDueTotalInPeriod = cards.reduce((acc, card) => acc + Number(card.invoices_due_total_in_period || 0), 0);
    const invoicesSettledTotalInPeriod = cards.reduce((acc, card) => acc + Number(card.invoices_settled_total_in_period || 0), 0);

    return {
      currentInvoiceTotal,
      nextInvoiceTotal,
      futureCommitmentTotal,
      currentCommitmentTotal,
      payableCardsCount,
      referenceInvoiceOriginalTotal,
      referenceInvoicePaidTotal,
      invoicesDueTotalInPeriod,
      invoicesSettledTotalInPeriod,
    };
  }, [cards]);

  const plannedVsRealChartData = useMemo<PlannedVsRealChartPoint[]>(
    () =>
      timelineSeries.map((item) => ({
        name: timelineGroupBy === "day" ? dayjs(item.period_start).format("DD/MM") : dayjs(item.period_start).format("MMM"),
        planejado: Number(item.planned_spending_total || 0),
        real: Number(item.real_spending_total || 0),
      })),
    [timelineSeries, timelineGroupBy]
  );

  const accumulatedBalanceChartData = useMemo<AccumulatedBalancePoint[]>(() => {
    let runningBalance = openingBalance;
    let runningReal = 0;
    let runningCredit = 0;
    const chartPoints = balanceTimelineSeries.map((item) => {
      runningBalance += Number(item.income_total || 0) - Number(item.real_spending_total || 0);
      runningReal += Number(item.real_spending_total || 0);
      runningCredit += Number(item.credit_card_purchase_total || 0);

      return {
        mes: balanceTimelineGroupBy === "day" ? dayjs(item.period_start).format("DD/MM") : dayjs(item.period_start).format("MMM"),
        saldo: runningBalance,
        gastoReal: runningReal,
        credito: runningCredit,
      };
    });

    if (chartPoints.length === 0) {
      return openingBalance !== 0 ? [{ mes: "", saldo: openingBalance, gastoReal: 0, credito: 0 }] : [];
    }

    return [{ mes: "", saldo: openingBalance, gastoReal: 0, credito: 0 }, ...chartPoints];
  }, [balanceTimelineGroupBy, balanceTimelineSeries, openingBalance]);

  const categoryChartData = useMemo(() => {
    return {
      purchases: buildCategoryChartData(categories, "purchase_composition_total"),
      real: buildCategoryChartData(categories, "real_spending_total"),
      credit: buildCategoryChartData(categories, "credit_card_purchase_total"),
    };
  }, [categories]);

  const paymentMethodChartData = useMemo(() => buildPaymentMethodChartData(paymentMethods), [paymentMethods]);

  const cardInvoiceStatusSummary = useMemo<CardInvoiceStatusSummary>(() => {
    return invoices.reduce<CardInvoiceStatusSummary>((acc, invoice) => {
      if (invoice.status === "aguardando_fechamento" || invoice.status === "awaiting_closure") {
        return acc;
      }

      const current = acc[invoice.card_id] ?? { paid: 0, partial: 0, noPayment: 0 };
      const normalizedStatus = normalizeInvoiceSummaryStatus(invoice.status);

      if (normalizedStatus === "paid") {
        current.paid += 1;
      } else if (normalizedStatus === "partial") {
        current.partial += 1;
      } else {
        current.noPayment += 1;
      }

      acc[invoice.card_id] = current;
      return acc;
    }, {});
  }, [invoices]);

  const invoicePaymentsKpiSummary = useMemo(() => {
    const totals = Object.values(cardInvoiceStatusSummary).reduce(
      (acc, summary) => ({
        paid: acc.paid + Number(summary.paid || 0),
        partial: acc.partial + Number(summary.partial || 0),
        noPayment: acc.noPayment + Number(summary.noPayment || 0),
      }),
      { paid: 0, partial: 0, noPayment: 0 }
    );

    const previousPaid = cards.reduce(
      (acc, card) => acc + Number(card.previous_paid_invoices_count_in_period || 0),
      0
    );
    const previousPartial = cards.reduce(
      (acc, card) => acc + Number(card.previous_partial_invoices_count_in_period || 0),
      0
    );

    return [
      totals.paid > 0 ? `${totals.paid} quitada${totals.paid > 1 ? "s" : ""}` : null,
      totals.partial > 0 ? `${totals.partial} parcial${totals.partial > 1 ? "is" : ""}` : null,
      totals.noPayment > 0 ? `${totals.noPayment} sem pagamento` : null,
      previousPaid > 0 ? `${previousPaid} paga${previousPaid > 1 ? "s" : ""} de fatura anterior` : null,
      previousPartial > 0 ? `${previousPartial} parcial${previousPartial > 1 ? "is" : ""} de fatura anterior` : null,
    ].filter((item): item is string => Boolean(item));
  }, [cardInvoiceStatusSummary, cards]);

  const topExpense = topExpenses.transactions[0] ?? null;
  const invoiceSettlementPercentageInPeriod = Number(cardMetrics.invoicesDueTotalInPeriod || 0) > 0
    ? (Number(cardMetrics.invoicesSettledTotalInPeriod || 0) / Number(cardMetrics.invoicesDueTotalInPeriod || 0)) * 100
    : 0;
  const currentOpenSettlementPercentage = Number(cardMetrics.referenceInvoiceOriginalTotal || 0) > 0
    ? (Number(cardMetrics.referenceInvoicePaidTotal || 0) / Number(cardMetrics.referenceInvoiceOriginalTotal || 0)) * 100
    : 0;
  const hasInvoicesInSelectedPeriod = invoices.length > 0;
  const hasPayableInvoicesInSelectedPeriod = invoices.some((invoice) => invoice.status !== "aguardando_fechamento");
  const hasReferenceInvoice = cards.some((card) => (card.reference_invoice_status ?? "no_invoice") !== "no_invoice");
  const hasReferenceInvoiceAwaitingClosure = cards.some(
    (card) => card.reference_invoice_status === "aguardando_fechamento" || card.reference_invoice_status === "awaiting_closure"
  );
  const currentMonthLabel = MONTH_OPTIONS.find((option) => option.value === filters.month)?.label ?? "Período";
  const currentReferenceLabel = `${MONTH_OPTIONS[now.getMonth()]?.label ?? dayjs().format("MMMM")} de ${now.getFullYear()}`;
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

  const getCardLifecycleLabel = (archivedAt?: string | null) => {
    return archivedAt ? CARD_LIFECYCLE_LABELS.archived : CARD_LIFECYCLE_LABELS.active;
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
      summary.paid > 0 ? `${summary.paid} quitada${summary.paid > 1 ? "s" : ""}` : null,
      summary.partial > 0 ? `${summary.partial} parcial${summary.partial > 1 ? "is" : ""}` : null,
      summary.noPayment > 0 ? `${summary.noPayment} sem pagamento` : null,
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
  
  const renderIndicator = (label: string, value: any, percentage: number = 0, color: string = "#6C5DD3", hint?: string) => {
    const data = [
      { name: "Value", value: Math.min(percentage, 100) },
      { name: "Remaining", value: Math.max(100 - percentage, 0) },
    ];

    return (
      <div className={styles.metricIndicator} title={hint}>
        <div className={styles.indicatorContent}>
          <p className={styles.indicatorLabel}>{label}</p>
          <h3 className={styles.indicatorValue}>{typeof value === 'number' ? currency(value) : value}</h3>
        </div>
        <div className={styles.indicatorChart}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={18}
                outerRadius={26}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="#F0F1F5" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

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
          <Tabs
            defaultActiveKey="general"
            className={styles.mainAnalysisTabs}
            items={[
              {
                key: "general",
                label: "Resumo Geral",
                children: (
                  <div className={styles.tabContentFade}>
                    <div className={styles.metricsGrid}>
                      {renderIndicator(
                        "Entradas no período",
                        summary?.income_total,
                        100,
                        "#16a34a",
                        "Tudo o que entrou no caixa no período filtrado."
                      )}
                      {renderIndicator(
                        "Gasto real no período",
                        summary?.real_spending_total,
                        Number(summary?.planned_spending_total || 0) > 0 ? (Number(summary?.real_spending_total || 0) / Number(summary?.planned_spending_total)) * 100 : 0,
                        "#dc2626",
                        "Saídas que realmente afetaram o saldo."
                      )}
                      {renderIndicator(
                        "Planejado no período",
                        summary?.planned_spending_total,
                        100,
                        "#6C5DD3",
                        "Meta de gasto considerada para o recorte atual."
                      )}
                      {renderIndicator(
                        "Saldo líquido",
                        summary?.balance_delta,
                        Number(summary?.income_total || 0) > 0 ? (Number(summary?.balance_delta || 0) / Number(summary?.income_total)) * 100 : 0,
                        Number(summary?.balance_delta || 0) >= 0 ? "#16a34a" : "#dc2626",
                        "Entradas do período menos o gasto real do mesmo recorte."
                      )}
                    </div>

                    <div className={styles.analysisGridCompact}>
                      <div className={styles.metricCardSecondary}>
                        <PlannedSpendingByRealSpendingChartContainer data={plannedVsRealChartData} />
                      </div>
                      <div className={styles.metricCardSecondary}>
                        <AnalysesByMonthChartContainer
                          title="Evolução financeira no período"
                          data={accumulatedBalanceChartData}
                        />
                      </div>
                      <div className={styles.metricCardSecondary}>
                        <div className={styles.sectionHeader}>
                          <div>
                            <h4 className={styles.sectionTitle}>Categorias no período</h4>
                            <p className={styles.sectionSubtitle}>Uma visão por vez para facilitar a leitura do período.</p>
                          </div>
                          <Segmented
                            className={styles.segmentedControl}
                            value={categoryLens}
                            onChange={(value) => setCategoryLens(value as "purchases" | "real" | "credit")}
                            options={[
                              { label: "Total", value: "purchases" },
                              { label: "Real", value: "real" },
                              { label: "Crédito", value: "credit" },
                            ]}
                          />
                        </div>
                        <ExpensesByCategoryChartContainer
                          title=""
                          emptyMessage={
                            categoryLens === "real"
                              ? "Nenhum gasto real encontrado no período."
                              : categoryLens === "credit"
                                ? "Nenhum consumo no crédito encontrado no período."
                                : "Nenhuma compra encontrada no período."
                          }
                          data={categoryChartData[categoryLens]}
                        />
                      </div>
                      <div className={styles.metricCardSecondary}>
                        <div className={styles.sectionHeader}>
                          <div>
                            <h4 className={styles.sectionTitle}>Métodos de pagamento</h4>
                            <p className={styles.sectionSubtitle}>Em relação ao total de saídas.</p>
                          </div>
                        </div>
                        <PaymentMethodUsageChartContainer
                          title=""
                          emptyMessage="Nenhum gasto encontrado para os métodos de pagamento no período."
                          data={paymentMethodChartData}
                        />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "cards",
                label: "Cartões e Crédito",
                children: (
                  <div className={styles.tabContentFade}>
                    <div className={styles.metricsGrid}>
                      {renderIndicator(
                        "Compras no crédito",
                        summary?.credit_card_purchase_total,
                        Number(summary?.real_spending_total || 0) > 0 ? (Number(summary?.credit_card_purchase_total || 0) / Number(summary?.real_spending_total || 0)) * 100 : 0,
                        "#f59e0b",
                        "Consumo no cartão que ainda não virou gasto real."
                      )}
                      {renderIndicator(
                        "Pagamentos de fatura",
                        summary?.invoice_payment_total,
                        (Number(summary?.invoice_payment_total || 0) / Math.max(Number(summary?.real_spending_total || 0), 1)) * 100,
                        "#dc2626",
                        "Quanto do período foi usado para quitar faturas."
                      )}
                      {renderIndicator(
                        "Quitação de faturas",
                        invoiceSettlementPercentageInPeriod.toFixed(1) + "%",
                        invoiceSettlementPercentageInPeriod,
                        "#16a34a",
                        "Percentual do valor das faturas com vencimento no período já quitado."
                      )}
                      {renderIndicator(
                        "Transação Mais Cara",
                        topExpense?.transaction_value || 0,
                        100,
                        "#6C5DD3",
                        topExpense?.transaction_description || "Nenhuma transação encontrada"
                      )}
                    </div>

                    <div className={styles.cardInsightsList}>
                      {cards.length > 0 ? (
                        cards.map((card) => {
                          const hasReferenceInvoice = !(
                            card.reference_invoice_pay_day == null && Number(card.reference_invoice_original_total || 0) <= 0
                          );
                          const displayInvoiceStatus = hasReferenceInvoice
                            ? card.reference_invoice_status ?? card.current_invoice_status
                            : card.current_invoice_status;
                          const displayInvoiceTotal = Number(
                            (hasReferenceInvoice ? card.reference_invoice_original_total : card.current_invoice_total) || 0
                          );
                          const displayInvoicePaid = Number(
                            (hasReferenceInvoice ? card.reference_invoice_paid_total : card.current_invoice_paid_total) || 0
                          );
                          const displayClosureDate = hasReferenceInvoice
                            ? card.reference_invoice_closure_date ?? card.current_invoice_closure_date
                            : card.current_invoice_closure_date;
                          const displayPayDay = hasReferenceInvoice
                            ? card.reference_invoice_pay_day ?? card.current_invoice_pay_day
                            : card.current_invoice_pay_day;

                          const paymentPercent = displayInvoiceTotal > 0 
                            ? Math.min((displayInvoicePaid / displayInvoiceTotal) * 100, 100) 
                            : 0;

                          return (
                            <div key={card.card_id} className={styles.cardInsightItem}>
                              <div className={styles.cardInsightTop}>
                                <div>
                                  <h5 className={styles.cardInsightTitle}>{card.card_description}</h5>
                                  <span className={styles.cardInsightFlag}>
                                    {card.flag_description || "Cartão"} • {Number(card.purchases_count_in_period || 0)} compras
                                  </span>
                                  <div style={{ marginTop: '4px', color: '#808191', fontSize: '12px' }}>
                                    Ped: <strong>{formatDate(displayClosureDate)}</strong> • Venc: <strong>{formatDate(displayPayDay)}</strong>
                                  </div>
                                </div>
                                <div className={styles.statusPillGroup}>
                                  <span className={`${styles.statusPill} ${getCardStatusClass(displayInvoiceStatus)}`}>
                                    {getCardStatusLabel(displayInvoiceStatus)}
                                  </span>
                                </div>
                              </div>

                              <div className={styles.cardInsightMetrics}>
                                <div className={styles.cardMetricBox}>
                                  <div className={styles.cardMetricHeader}>
                                    <div className={styles.cardMetricIcon}><WalletOutlined /></div>
                                    <span className={styles.cardInsightLabel}>Fatura</span>
                                  </div>
                                  <strong className={styles.cardInsightValue}>{currency(displayInvoiceTotal)}</strong>
                                </div>
                                <div className={styles.cardMetricBox}>
                                  <div className={styles.cardMetricHeader}>
                                    <div className={styles.cardMetricIcon}><CreditCardOutlined /></div>
                                    <span className={styles.cardInsightLabel}>Aberto</span>
                                  </div>
                                  <strong className={styles.cardInsightValue}>{currency(card.open_invoice_total)}</strong>
                                </div>
                                <div className={styles.cardMetricBox}>
                                  <div className={styles.cardMetricHeader}>
                                    <div className={styles.cardMetricIcon}><RiseOutlined /></div>
                                    <span className={styles.cardInsightLabel}>Máx Cpra</span>
                                  </div>
                                  <strong className={styles.cardInsightValue}>{currency(card.largest_purchase_in_period)}</strong>
                                </div>
                                <div className={styles.cardMetricBox}>
                                  <div className={styles.cardMetricHeader}>
                                    <div className={styles.cardMetricIcon}><LineChartOutlined /></div>
                                    <span className={styles.cardInsightLabel}>Tk Médio</span>
                                  </div>
                                  <strong className={styles.cardInsightValue}>{currency(card.average_purchase_in_period)}</strong>
                                </div>
                                <div className={styles.cardMetricBox}>
                                  <div className={styles.cardMetricHeader}>
                                    <div className={styles.cardMetricIcon}><InfoCircleOutlined /></div>
                                    <span className={styles.cardInsightLabel}>Quitação</span>
                                  </div>
                                  <strong className={styles.cardInsightValue}>{paymentPercent.toFixed(0)}%</strong>
                                  <div className={styles.cardMetricSmall}>
                                    {currency(displayInvoicePaid)} de {currency(displayInvoiceTotal)}
                                  </div>
                                  <div className={styles.cardProgressMini}>
                                    <div 
                                      className={styles.progressInner} 
                                      style={{ 
                                        width: `${paymentPercent}%`, 
                                        backgroundColor: paymentPercent >= 100 ? '#16a34a' : '#6C5DD3' 
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className={styles.cardBottomGrid}>
                                <div className={styles.cardSectionContainer}>
                                  <h6 className={styles.cardSectionTitle}><CalendarOutlined /> Prazos</h6>
                                  <div className={styles.cardProjectionRow}>
                                    <span className={styles.rowLabel}>Próxima</span>
                                    <span className={styles.rowValue}>{currency(card.next_invoice_total)} <small style={{ color: '#808191', fontWeight: 400 }}>({formatDate(card.next_invoice_pay_day)})</small></span>
                                  </div>
                                  <div className={styles.cardProjectionRow}>
                                    <span className={styles.rowLabel}>Futuro</span>
                                    <span className={styles.rowValue}>{currency(card.future_commitment_total)}</span>
                                  </div>
                                </div>
                                <div className={styles.cardSectionContainer}>
                                  <h6 className={styles.cardSectionTitle}><BarChartOutlined /> Categorias</h6>
                                  <div className={styles.cardCategoryBox}>
                                    <ExpensesByCategoryChartContainer
                                      title=""
                                      metric="credit_card_purchase_total"
                                      emptyMessage="Sem compras."
                                      data={cardCategoryCharts[card.card_id] ?? []}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className={styles.emptyState}>Nenhum cartão encontrado.</div>
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
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
