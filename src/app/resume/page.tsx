"use client";
import Image from "next/image";
import { Button, Col, Row, Typography, message, Badge, Space, Modal, Form, Input, Tooltip as AntTooltip, Spin } from "antd";
import {
  BellOutlined, PlusOutlined, SwapOutlined,
  CreditCardOutlined, PlusCircleOutlined,
  MinusCircleOutlined, ShopOutlined, EyeOutlined, EyeInvisibleOutlined, MoreOutlined,
  WalletOutlined, TagOutlined, LineChartOutlined, RocketOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import styles from "./resume.module.scss";
import { ResumeTemporalFilter, type ResumeFilters } from "./temporalFilter";
import { AppliedFiltersBar } from "@/components/AppliedFiltersBar";
import MyCategoriesList, { type AmountByCategory } from "@/components/MyCategoriesList";
import LastTransactionsList from "@/components/LastTransactionsList";
import { type ITransaction } from "@/interfaces";
import { useEffect, useMemo, useRef, useState } from "react";
import { request } from "@/service/api";
import { useRouter } from "next/navigation";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import AnimatedNumber from "@/components/AnimatedNumber";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { motion } from "framer-motion";
import CustomMenu from "@/components/CustomMenu";
import CustomTour from "@/components/CustomTour";
import { EnterTransactionModal } from "../EnterTransaction/modal";
import { OutputModal } from "../Outputs/modal";
import { NewCardModal } from "../cards/modal";
import { CardTransactionModal } from "../cards/card/mcardtransaction";
import { PayInvoiceModal } from "../cards/card/payInvoiceModal";
import { ObjectiveModalManager, useObjectiveModalManager } from "@/components/ObjectiveModalManager";

dayjs.locale("pt-br");

const TOUR_SEEN_STORAGE_KEY = "hasSeenOnboardingTour";
const FORCE_FIRST_ACCESS_TOUR_KEY = "showFirstAccessTour";

interface BalanceProps {
  balance: number;
  planned_spending: number;
  real_spending: number;
}

interface PeriodBudgetSummary {
  planned_spending_total: number;
  real_spending_total: number;
}

interface ResumeCategorySummary extends AmountByCategory {
  category_id: number;
}

interface ResumeCardSummary {
  id: number;
  card_description: string;
  flag_id: number;
  flag_description?: string | null;
  expiration: number;
  closure: number;
  invoice: number;
  invoice_value: number;
  period_invoice_status?: string;
  period_invoice_open_total?: number;
  period_invoice_pay_day?: string | null;
  next_invoice_total?: number;
  next_invoice_pay_day?: string | null;
}

interface HoveredChartPoint {
  label: string;
  data: {
    entrada: number;
    saida: number;
    total: number;
  };
  x: number;
}

const buildAnalysisQueryString = (filters: ResumeFilters) => {
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

const Resume = () => {
  const router = useRouter();
  const today = new Date();
  const [showAlertBanner, setShowAlertBanner] = useState(true);
  const [balance, setBalance] = useState<BalanceProps>({} as BalanceProps);
  const [periodBudgetSummary, setPeriodBudgetSummary] = useState<PeriodBudgetSummary>({
    planned_spending_total: 0,
    real_spending_total: 0,
  });
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [filters, setFilters] = useState<ResumeFilters>({
    mode: "month",
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    dateFrom: null,
    dateTo: null,
  });
  const [cards, setCards] = useState<ResumeCardSummary[]>([]);
  const [totalCardsInvoice, setTotalCardsInvoice] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showAnimatedChart, setShowAnimatedChart] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [categorySummaries, setCategorySummaries] = useState<ResumeCategorySummary[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [periodTransactions, setPeriodTransactions] = useState<ITransaction[]>([]);
  const [periodBalance, setPeriodBalance] = useState(0);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [isLoadingObjectives, setIsLoadingObjectives] = useState(true);
  const [hoveredChartPoint, setHoveredChartPoint] = useState<HoveredChartPoint | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const formatCurrency = (value: any): string => {
    const numValue = parseFloat(value || 0);
    return numValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getFlagColor = (flagId: number) => {
    const colors: { [key: number]: string } = {
      1: 'linear-gradient(135deg, #1e1e1e 0%, #3a3a3a 100%)', // Mastercard
      2: 'linear-gradient(135deg, #1a1f71 0%, #0056b3 100%)', // Visa
      3: 'linear-gradient(135deg, #d32f2f 0%, #ff5252 100%)', // Hipercard
      4: 'linear-gradient(135deg, #2d3e50 0%, #4c5c6e 100%)', // Elo
      5: 'linear-gradient(135deg, #00875a 0%, #22a06b 100%)', // Alelo
      6: 'linear-gradient(135deg, #007bc1 0%, #00b0ff 100%)', // Amex
      7: 'linear-gradient(135deg, #004a97 0%, #0074e4 100%)', // Diners
    };
    return colors[flagId] || 'linear-gradient(135deg, #6C5DD3 0%, #8E82EF 100%)';
  };

  const getFlagImage = (flagId: number) => {
    const images: { [key: number]: string } = {
      1: '/mastercard.png',
      2: '/visa.png',
      3: '/hipercard.png',
      4: '/elo.png',
      5: '/alelo.png',
      6: '/amex.png',
      7: '/diners.png',
    };
    return images[flagId] || '/mastercard.png';
  };

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const currentMonthLabel = monthNames[filters.month - 1] || "Período";
  const filterSummary = useMemo(() => {
    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      return `${dayjs(filters.dateFrom).format("DD/MM/YYYY")} até ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`;
    }

    return `${currentMonthLabel} de ${filters.year}`;
  }, [currentMonthLabel, filters]);
  const chartLabelPrefix = filters.mode === "month" ? "Dia" : "Data";
  const goalCardTitle = filters.mode === "month" ? "Teto de gastos" : "Teto do período";
  const periodPlannedSpending = Number(periodBudgetSummary.planned_spending_total || 0);
  const periodRealSpending = Number(periodBudgetSummary.real_spending_total || 0);
  const spentPercentage = periodPlannedSpending > 0 ? (periodRealSpending / periodPlannedSpending) * 100 : 0;
  const isCurrentMonthFilter =
    filters.mode === "month" &&
    filters.month === today.getMonth() + 1 &&
    filters.year === today.getFullYear();
  const canCreateObjectiveInFilter =
    filters.mode === "custom" && filters.dateFrom && filters.dateTo
      ? !dayjs().isBefore(dayjs(filters.dateFrom), "day") && !dayjs().isAfter(dayjs(filters.dateTo), "day")
      : isCurrentMonthFilter;
  const appliedFiltersLabels = useMemo(() => {
    const labels: string[] = [];

    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      labels.push(`Período: ${dayjs(filters.dateFrom).format("DD/MM/YYYY")} - ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`);
    } else if (!isCurrentMonthFilter) {
      labels.push(`Mês: ${currentMonthLabel}`);
      labels.push(`Ano: ${filters.year}`);
    }

    return labels;
  }, [currentMonthLabel, filters, isCurrentMonthFilter]);

  const handleClearFilters = () => {
    setFilters({
      mode: "month",
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      dateFrom: null,
      dateTo: null,
    });
  };
  const chartRevealKey = useMemo(() => {
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    return [
      filterSummary,
      chartData.length,
      firstPoint?.name ?? "",
      firstPoint?.total ?? "",
      lastPoint?.name ?? "",
      lastPoint?.total ?? "",
    ].join("|");
  }, [chartData, filterSummary]);

  const [showSaldo, setShowSaldo] = useState(true);
  const [iconShowSaldo, setIconShowSaldo] = useState("/icons/icon-hide-saldo.svg");

  const showDate = (date: number) => {
    if (date < dayjs().date()) {
      return dayjs().month() + 2;
    }
    return dayjs().month() + 1;
  };
  const [isEditMode, setIsEditMode] = useState(false);
  const [openTour, setOpenTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourSeenStorageKey, setTourSeenStorageKey] = useState(TOUR_SEEN_STORAGE_KEY);
  const [gastoPlanejado, setGastoPlanejado] = useState("");

  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCardTransactionModalOpen, setIsCardTransactionModalOpen] = useState(false);
  const [isPayInvoiceModalOpen, setIsPayInvoiceModalOpen] = useState(false);
  const [selectedCardForAction, setSelectedCardForAction] = useState<any | null>(null);

  const handleRefreshData = () => {
    getBalance();
    getCardsData();
    getTransactionsData();
    getPeriodBudgetSummary();
    getCategorySummaries();
    getObjectives();
  };

  const focusedCard = cards[currentCardIndex] ?? null;

  const openFocusedCardTransactionModal = () => {
    if (!focusedCard) return;
    setSelectedCardForAction(focusedCard);
    setIsCardTransactionModalOpen(true);
  };

  const openFocusedCardInvoiceModal = () => {
    if (!focusedCard) return;
    setSelectedCardForAction(focusedCard);
    setIsPayInvoiceModalOpen(true);
  };

  const handleFinishEditGoal = async (values: any) => {
    try {
      await request({
        endpoint: "spending/store",
        method: "POST",
        data: {
          planned_spending: parseFloat(String(values.planned_spending).replace(",", ".")),
        },
      });
      setIsEditMode(false);
      getBalance();
      getPeriodBudgetSummary();
      message.success("Teto atualizado com sucesso!");
    } catch (error: any) {
      const apiMsg = error?.response?.data?.message;
      message.error(apiMsg || "Algo deu errado ao atualizar o teto!");
    }
  };
  const refSaldo = useRef(null);
  const refPlanejado = useRef(null);
  const refAcoesRapidas = useRef(null);
  const refObjetivos = useRef(null);
  const refReal = useRef(null);
  const refCategorias = useRef(null);
  const refTransacoes = useRef(null);
  const refMenu = useRef(null);

  const handleClickShowSaldo = () => {
    setShowSaldo(!showSaldo);
    if (showSaldo) {
      setIconShowSaldo("/icons/icon-show-saldo.svg");
    } else {
      setIconShowSaldo("/icons/icon-hide-saldo.svg");
    }
  };

  const shouldShowFirstAccessTour = async () => {
    const timestamp = Date.now();
    const [transactionsRes, cardsRes, spendingRes, objectivesRes] = await Promise.all([
      request({ method: "GET", endpoint: `transaction/all?per_page=1&t=${timestamp}` }),
      request({ method: "GET", endpoint: `cards?t=${timestamp}` }),
      request({ method: "GET", endpoint: `spending?t=${timestamp}` }),
      request({ method: "GET", endpoint: `objectives?t=${timestamp}` }),
    ]);

    const transactions = transactionsRes?.data?.data?.transactions ?? [];
    const cardsList = cardsRes?.data?.data?.cards ?? cardsRes?.data?.cards ?? [];
    const spending = spendingRes?.data?.data?.spending ?? spendingRes?.data?.spending ?? null;
    const objectivesList = objectivesRes?.data?.data?.objectives ?? objectivesRes?.data?.objectives ?? [];

    const hasTransactions = transactions.length > 0;
    const hasCards = cardsList.length > 0;
    const hasSpendingGoal = Number(spending?.planned_spending || 0) > 0;
    const hasObjectives = objectivesList.length > 0;

    return !(hasTransactions || hasCards || hasSpendingGoal || hasObjectives);
  };

  const resolveTourSeenStorageKey = async () => {
    const cachedUser = localStorage.getItem("user_data");

    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        const userIdentifier = parsedUser?.id ?? parsedUser?.email;
        if (userIdentifier) return `${TOUR_SEEN_STORAGE_KEY}:${userIdentifier}`;
      } catch {
        localStorage.removeItem("user_data");
      }
    }

    const response = await request({ endpoint: "user" });
    const currentUser = response?.data?.data ?? response?.data;
    const userIdentifier = currentUser?.id ?? currentUser?.email;

    return userIdentifier ? `${TOUR_SEEN_STORAGE_KEY}:${userIdentifier}` : TOUR_SEEN_STORAGE_KEY;
  };

  const getBalance = async () => {
    try {
      const timestamp = Date.now();
      const { data } = await request({
        endpoint: `balance?t=${timestamp}`,
      });
      setBalance(data.finances);

      const nextTourSeenStorageKey = await resolveTourSeenStorageKey();
      setTourSeenStorageKey(nextTourSeenStorageKey);

      const shouldForceTour = sessionStorage.getItem(FORCE_FIRST_ACCESS_TOUR_KEY) === "true";
      const hasSeenTour = localStorage.getItem(nextTourSeenStorageKey);
      if (shouldForceTour) {
        sessionStorage.removeItem(FORCE_FIRST_ACCESS_TOUR_KEY);
        setTourStep(0);
        setOpenTour(true);
      } else if (!hasSeenTour) {
        const shouldOpenTour = await shouldShowFirstAccessTour();

        if (shouldOpenTour) {
          setTourStep(0);
          setOpenTour(true);
        } else {
          localStorage.setItem(nextTourSeenStorageKey, "true");
        }
      }
    } catch (error) { }
  };

  useEffect(() => {
    if (spentPercentage < 90 && periodPlannedSpending > 0) {
      const timer = setTimeout(() => {
        setShowAlertBanner(false);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setShowAlertBanner(true);
    }
  }, [periodPlannedSpending, spentPercentage]);

  const handleClickEditGastoPlanejado = () => {
    setIsEditMode(true);
  };

  const getUser = async () => {
    try {
      const response = await request({
        endpoint: "user",
      });
      const userData = response.data;
      setUser({
        ...userData,
        name: userData.name
      });
    } catch (error) {
      console.error("Erro ao buscar usuário no Resume:", error);
    }
  };

  const getCardsData = async () => {
    try {
      const timestamp = Date.now();
      const queryString = buildAnalysisQueryString(filters);
      const response = await request({
        method: "GET",
        endpoint: `analysis/cards?${queryString}&t=${timestamp}`,
      });

      const cardsList = response?.data?.data?.cards || [];
      const activeCards = cardsList
        .filter((card: any) => !card.archived_at)
        .map((card: any) => {
          const invoiceValue = Number(card.invoices_due_total_in_period || 0);

          return {
            id: Number(card.card_id),
            card_description: card.card_description,
            flag_id: Number(card.flag_id || 0),
            flag_description: card.flag_description,
            expiration: Number(card.expiration_day || 0),
            closure: Number(card.closure_day || 0),
            invoice: invoiceValue,
            invoice_value: invoiceValue,
            period_invoice_status: card.period_invoice_status,
            period_invoice_open_total: Number(card.period_invoice_open_total || 0),
            period_invoice_pay_day: card.period_invoice_pay_day,
            next_invoice_total: Number(card.next_invoice_total || 0),
            next_invoice_pay_day: card.next_invoice_pay_day,
          };
        });

      const totalValue = activeCards.reduce((acc: number, card: ResumeCardSummary) => acc + card.invoice_value, 0);
      setCards(activeCards);
      setCurrentCardIndex((current) => {
        if (activeCards.length === 0) return 0;
        return Math.min(current, activeCards.length - 1);
      });
      setTotalCardsInvoice(totalValue);
    } catch (error) {
      console.error(error);
    }
  };

  const getPeriodBudgetSummary = async () => {
    try {
      const timestamp = Date.now();
      const queryString = buildAnalysisQueryString(filters);
      const summaryResponse = await request({ method: "GET", endpoint: `analysis/summary?${queryString}&t=${timestamp}` });

      setPeriodBudgetSummary({
        planned_spending_total: Number(summaryResponse.data?.data?.planned_spending_total || 0),
        real_spending_total: Number(summaryResponse.data?.data?.real_spending_total || 0),
      });
    } catch (error) {
      console.error("Erro ao buscar resumo do período:", error);
      setPeriodBudgetSummary({
        planned_spending_total: 0,
        real_spending_total: 0,
      });
    }
  };

  const getObjectives = async () => {
    try {
      setIsLoadingObjectives(true);
      const { data } = await request({
        method: "GET",
        endpoint: "objectives",
      });
      const periodEnd =
        filters.mode === "custom" && filters.dateTo
          ? dayjs(filters.dateTo).endOf("day")
          : dayjs()
            .year(filters.year)
            .month(filters.month - 1)
            .endOf("month");
      const filteredObjectives = (data.data.objectives || []).filter((objective: any) => {
        if (!objective.created_at) return true;

        return !dayjs(objective.created_at).isAfter(periodEnd);
      });

      setObjectives(filteredObjectives);
    } catch (error) {
      console.error("Erro ao buscar objetivos:", error);
      setObjectives([]);
    } finally {
      setIsLoadingObjectives(false);
    }
  };

  const objectiveModalManager = useObjectiveModalManager({ onSaved: getObjectives });

  const getCategorySummaries = async () => {
    try {
      setIsLoadingCategories(true);
      const queryString = buildAnalysisQueryString(filters);
      const response = await request({ method: "GET", endpoint: `analysis/categories?${queryString}&type_id=2` });
      const categories = (response.data?.data?.categories ?? []).map((category: any) => ({
        category_id: Number(category.category_id || 0),
        category_description: String(category.category_description || "Sem categoria"),
        category_spending: Number(
          category.expense_composition_total ??
          (Number(category.real_spending_total || 0) + Number(category.credit_card_purchase_total || 0))
        ),
      }));

      setCategorySummaries(
        categories
          .filter((category: ResumeCategorySummary) => category.category_id !== 0)
          .sort((a: ResumeCategorySummary, b: ResumeCategorySummary) => b.category_spending - a.category_spending)
      );
    } catch (error) {
      console.error("Erro ao buscar categorias do período:", error);
      setCategorySummaries([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const getTransactionsData = async () => {
    try {
      setIsLoadingChart(true);
      const response = await request({
        endpoint: "transaction/all",
      });
      const txs = (response?.data?.data?.transactions || []) as ITransaction[];

      if (txs.length === 0) {
        setChartData([]);
        setPeriodTransactions([]);
        setPeriodBalance(0);
        setIsLoadingChart(false);
        return;
      }

      // Determinar o mês de referência com base no seletor de período
      const periodStart =
        filters.mode === "custom" && filters.dateFrom
          ? dayjs(filters.dateFrom).startOf("day")
          : dayjs()
            .year(filters.year)
            .month(filters.month - 1)
            .startOf("month");
      const periodEnd =
        filters.mode === "custom" && filters.dateTo
          ? dayjs(filters.dateTo).endOf("day")
          : periodStart.endOf("month");

      // Calcular o saldo acumulado ANTES do mês de referência
      const openingBalance = txs.reduce((acc: number, tx: any) => {
        const txDate = dayjs(tx.date);
        const value = parseFloat(tx.transaction_value || 0);
        const affectsRealSpending =
          tx.type_id === 2 &&
          (tx.affects_real_spending === true || tx.payment_method_id == null || Number(tx.payment_method_id) !== 4);

        if (txDate.isBefore(periodStart)) {
          if (tx.type_id === 1) {
            return acc + value;
          }

          if (affectsRealSpending) {
            return acc - value;
          }
        }
        return acc;
      }, 0);
      let runningBalance = openingBalance;

      // Inicializar todos os dias do mês com valores zero
      const grouped: { [key: string]: { name: string, entrada: number, saida: number, total: number, sortKey: number } } = {};
      let cursor = periodStart.clone();
      while (cursor.isBefore(periodEnd) || cursor.isSame(periodEnd, "day")) {
        const key = cursor.format("YYYY-MM-DD");
        grouped[key] = {
          name: filters.mode === "month" ? cursor.format("DD") : cursor.format("DD/MM"),
          entrada: 0,
          saida: 0,
          total: 0,
          sortKey: cursor.valueOf()
        };
        cursor = cursor.add(1, "day");
      }

      // Filtrar e somar transações apenas do mês selecionado
      txs.forEach((tx: any) => {
        const txDate = dayjs(tx.date);

        // Verifica se a transação pertence ao mês e ano de referência
        if (
          (txDate.isAfter(periodStart) || txDate.isSame(periodStart, "day")) &&
          (txDate.isBefore(periodEnd) || txDate.isSame(periodEnd, "day"))
        ) {
          const dayKey = txDate.format("YYYY-MM-DD");
          const value = parseFloat(tx.transaction_value || 0);

          if (grouped[dayKey]) {
            const affectsRealSpending =
              tx.type_id === 2 &&
              (tx.affects_real_spending === true || tx.payment_method_id == null || Number(tx.payment_method_id) !== 4);

            if (tx.type_id === 1) {
              grouped[dayKey].entrada += value;
            } else if (affectsRealSpending) { // 2 = Saída efetivamente paga
              grouped[dayKey].saida += value;
            }
          }
        }
      });

      const filteredTransactions = txs
        .filter((tx: ITransaction) => {
          const txDate = dayjs(tx.date);

          return (
            (txDate.isAfter(periodStart) || txDate.isSame(periodStart, "day")) &&
            (txDate.isBefore(periodEnd) || txDate.isSame(periodEnd, "day"))
          );
        })
        .sort((a: ITransaction, b: ITransaction) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

      // Converter para array ordenado por dia e calcular saldo acumulado dia a dia
      const data = Object.values(grouped).sort((a, b) => a.sortKey - b.sortKey);
      data.forEach((day: any) => {
        runningBalance += (day.entrada - day.saida);
        day.total = runningBalance;
      });

      // Filtrar para começar a partir da primeira movimentação ou saldo inicial
      const firstActiveDayIndex = data.findIndex(day => day.total !== 0 || day.entrada > 0 || day.saida > 0);
      let filteredData = firstActiveDayIndex !== -1 ? data.slice(firstActiveDayIndex) : [];

      if (filteredData.length > 0 && openingBalance !== filteredData[0].total) {
        filteredData = [
          {
            name: "",
            entrada: 0,
            saida: 0,
            total: openingBalance,
            sortKey: periodStart.valueOf(),
          },
          ...filteredData,
        ];
      }

      setChartData(filteredData);
      setPeriodTransactions(filteredTransactions);
      setPeriodBalance(runningBalance);
    } catch (error) {
      console.error("Erro ao buscar transações para o gráfico:", error);
      setPeriodBalance(0);
    } finally {
      setIsLoadingChart(false);
    }
  };

  useEffect(() => {
    getBalance();
    getUser();
  }, []);

  useEffect(() => {
    getCardsData();
    getTransactionsData();
    getPeriodBudgetSummary();
    getCategorySummaries();
    getObjectives();
  }, [filters]);

  useEffect(() => {
    setBalance((prev) => ({
      ...prev,
      balance: periodBalance,
    }));
  }, [periodBalance]);

  const handleCloseTour = () => {
    setOpenTour(false);
    setTourStep(0);
    localStorage.setItem(tourSeenStorageKey, "true");
  };

  useEffect(() => {
    if (isLoadingChart || chartData.length === 0) {
      setShowAnimatedChart(false);
      return;
    }

    setShowAnimatedChart(false);

    let frameOne = 0;
    let frameTwo = 0;

    frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => {
        setShowAnimatedChart(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
    };
  }, [chartData, chartRevealKey, isLoadingChart]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#fff', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ fontWeight: 700, marginBottom: '8px', color: '#11142D' }}>{chartLabelPrefix} {label}</p>
          <p style={{ margin: 0, color: '#00875A', fontSize: '12px' }}>Entradas: {formatCurrency(data.entrada)}</p>
          <p style={{ margin: 0, color: '#DE350B', fontSize: '12px' }}>Saídas: {formatCurrency(data.saida)}</p>
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
            <p style={{ margin: 0, color: '#6C5DD3', fontWeight: 600 }}>Saldo: {formatCurrency(data.total)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleChartMouseMove = (state: any) => {
    if (
      state?.isTooltipActive &&
      state?.activePayload?.length &&
      typeof state?.activeCoordinate?.x === "number"
    ) {
      const payload = state.activePayload[0].payload;

      setHoveredChartPoint({
        label: String(state.activeLabel ?? payload.name ?? ""),
        data: {
          entrada: Number(payload.entrada || 0),
          saida: Number(payload.saida || 0),
          total: Number(payload.total || 0),
        },
        x: state.activeCoordinate.x,
      });
      return;
    }

    setHoveredChartPoint(null);
  };

  const handleChartMouseLeave = () => {
    setHoveredChartPoint(null);
  };

  const renderChartTooltipCard = (point: HoveredChartPoint) => (
    <div style={{ width: 190 }}>
      {CustomTooltip({
        active: true,
        payload: [{ payload: point.data }],
        label: point.label,
      })}
    </div>
  );

  const hoveredTooltipLeft = (() => {
    if (!hoveredChartPoint) {
      return 8;
    }

    const containerWidth = chartContainerRef.current?.clientWidth ?? 320;
    const tooltipWidth = 190;
    const minLeft = 8;
    const maxLeft = Math.max(containerWidth - tooltipWidth - 8, minLeft);

    return Math.min(Math.max(hoveredChartPoint.x - tooltipWidth / 2, minLeft), maxLeft);
  })();

  const steps = [
    {
      title: "Bem-vindo ao Ficker!",
      description:
        "Registre entradas, saídas e cartões diretamente pelo painel inicial.",
      target: () => refAcoesRapidas.current,
      placement: "bottom" as const,
      offset: 12,
    },
    {
      title: "Seu dinheiro em perspectiva",
      description:
        "Acompanhe seu saldo total e a evolução recente das movimentações.",
      target: () => refSaldo.current,
      placement: "right" as const,
      offset: 12,
    },
    {
      title: "Controle seu limite",
      description:
        "Compare o teto planejado com o gasto real do período selecionado.",
      target: () => refPlanejado.current,
      placement: "bottom" as const,
      offset: 12,
    },
    {
      title: "Planeje o próximo passo",
      description:
        "Veja o progresso dos seus objetivos financeiros e crie novos planos rapidamente.",
      target: () => refObjetivos.current,
      placement: "bottom" as const,
      offset: 12,
    },
    {
      title: "Acompanhe seus cartões",
      description:
        "Visualize faturas disponíveis e adicione transações de forma intuitiva.",
      target: () => refReal.current,
      placement: "left" as const,
      offset: 12,
      offsetX: 0,
    },
    {
      title: "Entenda seus gastos",
      description:
        "Entenda exatamente para onde seu dinheiro está indo.",
      target: () => refCategorias.current,
      placement: "top" as const,
      offset: 12,
      offsetY: 3,
    },
    {
      title: "Revise seus movimentos",
      description:
        "Acesse rapidamente seu histórico recente.",
      target: () => refTransacoes.current,
      placement: "top" as const,
      offset: 12,
      offsetY: 24,
    },
  ];

  const RenderDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    // Só mostra o ponto se houver entrada/saída OU se for o primeiro dia E o saldo não for zero
    const isFirstDayWithBalance = index === 0 && payload.total !== 0;
    const hasTransactions = payload.entrada > 0 || payload.saida > 0;

    if (isFirstDayWithBalance || hasTransactions) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={2.8}
          fill="#6C5DD3"
          stroke="#fff"
          strokeWidth={0.4}
          key={`dot-${index}`}
        />
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <CustomMenu />
      <div style={{ flex: 1, overflowX: "hidden" }}>
        <div className={styles.header} style={{ padding: "20px 30px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2>
              Olá, {user?.name ? user.name.split(" ").slice(0, 2).join(" ") : "John Amorim"}!
            </h2>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.filterSummary}>{filterSummary}</span>
            <ResumeTemporalFilter filters={filters} onChange={setFilters} />
            <div
              className={styles.notification}
              onClick={() => {
                setTourStep(0);
                setOpenTour(true);
              }}
              style={{
                cursor: "pointer",
                background: "#f4f5f7",
                width: 40,
                height: 40,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <InfoCircleOutlined style={{ fontSize: 20, color: "#808191" }} />
            </div>
            {/* <div className={styles.notification}>
              <Badge dot color="#FF754C">
                <BellOutlined style={{ fontSize: 22 }} />
              </Badge>
            </div> */}
          </div>          
        </div>
        {appliedFiltersLabels.length > 0 && (
          <div style={{ padding: "0 30px" }}>
            <AppliedFiltersBar filters={appliedFiltersLabels} onClear={handleClearFilters} />
          </div>
        )}
      {/* The Alert Banner has been moved to the sidebar */}

      <Row gutter={[24, 24]} align="stretch" className={styles.resumeRow}>
        <Col xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column", zIndex: 10 }}>
          {/* Quick Actions area */}
          <div ref={refAcoesRapidas} className={styles.quickActions} style={{ marginBottom: 20 }}>
            <p className={styles.balance_description} style={{ fontSize: 13, color: '#808191', marginBottom: 8, marginTop: 0 }}>Ações rápidas</p>
            <div className={styles.buttonsContainer} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div className={styles.actionButton} style={{ background: '#E6F7EF' }} onClick={() => setIsEnterModalOpen(true)}>
                <PlusCircleOutlined style={{ fontSize: 24, color: '#00875A' }} />
                <span style={{ color: '#00875A' }}>Entrada</span>
              </div>
              <div className={styles.actionButton} style={{ background: '#FFEBE6' }} onClick={() => setIsOutputModalOpen(true)}>
                <MinusCircleOutlined style={{ fontSize: 24, color: '#DE350B' }} />
                <span style={{ color: '#DE350B' }}>Saída</span>
              </div>
              <div className={styles.actionButton} style={{ background: '#E2E2FB' }} onClick={() => setIsCardModalOpen(true)}>
                <CreditCardOutlined style={{ fontSize: 24, color: '#6C5DD3' }} />
                <span style={{ color: '#6C5DD3' }}>Cartões</span>
              </div>
            </div>
          </div>

          <div ref={refSaldo} className={styles.balance} style={{ flex: 1, padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                  <WalletOutlined style={{ marginRight: 6, fontSize: 12 }} />
                  Saldo
                </p>
                <p className={styles.balance_title} style={{ fontSize: 28, fontWeight: 700 }}>
                  {showSaldo ? <AnimatedNumber value={balance.balance} duration={1500} format={formatCurrency} /> : "R$ •••••••"}
                </p>
              </div>
              <div
                onClick={handleClickShowSaldo}
                style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#F4F5F7',
                  display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#808191', fontSize: 18
                }}
              >
                {showSaldo ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className={styles.balance_description} style={{ margin: 0 }}>Visão geral</h3>
            </div>

            <div style={{ width: '100%', marginTop: 10, position: 'relative' }}>
              <div
                ref={chartContainerRef}
                style={{ width: '100%', height: 50 }}
              >
                {isLoadingChart ? (
                  <div style={{ textAlign: 'center', color: '#808191' }}>Carregando dados...</div>
                ) : chartData.length > 0 ? (
                  showAnimatedChart ? (
                    <motion.div
                      key={chartRevealKey}
                      initial={{ clipPath: "inset(-100px 100% -200px -100px)" }}
                      animate={{ clipPath: "inset(-200px -1000px -200px -200px)" }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      style={{ width: "100%", height: 70, position: "relative", zIndex: 100 }}
                    >
                      <ResponsiveContainer width="100%" height={70}>
                        <AreaChart
                          data={chartData}
                          onMouseMove={handleChartMouseMove}
                          onMouseLeave={handleChartMouseLeave}
                        >
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6C5DD3" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#6C5DD3" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <YAxis hide />
                          <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={false} 
                            isAnimationActive={false} 
                            allowEscapeViewBox={{ x: true, y: true }}
                            wrapperStyle={{ zIndex: 9999 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#6C5DD3"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            isAnimationActive={false}
                            dot={<RenderDot />}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#6C5DD3' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  ) : (
                    <div style={{ width: "100%", height: 200 }} />
                  )
                ) : (
                  <div style={{ textAlign: 'center', color: '#808191' }}>
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Ainda não possui dados</p>
                    <p style={{ fontSize: 12 }}>Suas transações aparecerão aqui.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column", zIndex: 2 }}>
          <div ref={refPlanejado} className={styles.balance} style={{ flex: 1, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                    <TagOutlined style={{ marginRight: 6, fontSize: 12, color: "#6C5DD3" }} />
                    {goalCardTitle}
                  </p>
                  <p className={styles.balance_title} style={{ fontSize: 28, marginBottom: 16 }}>
                    <AnimatedNumber value={periodPlannedSpending} duration={1500} format={formatCurrency} />
                  </p>
                </div>
                <Button type="text" onClick={handleClickEditGastoPlanejado} icon={
                  <Image src="/edit.png" alt="Editar" width={20} height={20} />
                } disabled={!isCurrentMonthFilter} />
            </div>

            <div style={{ marginTop: 8 }}>
                <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                  <LineChartOutlined style={{ marginRight: 6, fontSize: 12, color: "#6C5DD3" }} />
                  Gasto real
                </p>
                <p className={styles.balance_title} style={{ fontSize: 28, marginBottom: 16 }}>
                  <AnimatedNumber value={periodRealSpending} duration={1500} format={formatCurrency} />
                </p>

                <div style={{ width: '100%', height: 10, background: '#f0f0f5', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    width: `${Math.min(spentPercentage || 0, 100)}%`,
                    height: '100%',
                    background: (() => {
                      const percent = spentPercentage || 0;
                      if (percent >= 90) return '#DE350B'; // Vermelho
                      if (percent >= 70) return '#FFA940'; // Laranja
                      return '#00875A'; // Verde
                  })(),
                  borderRadius: 5,
                  transition: 'width 0.5s ease, background-color 0.5s ease'
                }} />
              </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: (() => {
                      const percent = spentPercentage || 0;
                      if (percent >= 90) return '#DE350B';
                      if (percent >= 70) return '#FFA940';
                      return '#00875A';
                    })()
                  }}>
                    {periodPlannedSpending > 0
                      ? `${(spentPercentage || 0).toFixed(0)}%`
                      : "0%"}
                  </span>
                  <span style={{ fontSize: 11, color: '#808191' }}>
                    {periodPlannedSpending > 0
                      ? `Restam ${formatCurrency(Math.max(periodPlannedSpending - periodRealSpending, 0)).replace(",00", "")}`
                      : filters.mode === "month"
                        ? "Defina um teto"
                        : "Sem teto acumulado"}
                  </span>
                </div>
            </div>
          </div>

          {/* Objectives section moved here */}
          <div ref={refObjetivos} className={styles.balance} style={{ marginTop: 20, padding: '24px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h3 className={styles.balance_description} style={{ margin: 0, display: 'flex', alignItems: 'center', justifySelf: 'start' }}>
                <RocketOutlined style={{ marginRight: 6, fontSize: 12, color: "#6C5DD3" }} />
                Objetivos
              </h3>
              <button
                type="button"
                aria-label="Criar objetivo"
                disabled={!canCreateObjectiveInFilter}
                style={{
                  border: 'none',
                  height: 40,
                  width: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canCreateObjectiveInFilter ? 'pointer' : 'not-allowed',
                  background: 'transparent',
                  justifySelf: 'center',
                  padding: 0,
                  opacity: canCreateObjectiveInFilter ? 1 : 0.45,
                }}
                onMouseEnter={(event) => {
                  if (!canCreateObjectiveInFilter) return;
                  event.currentTarget.style.backgroundColor = '#eaeaea';
                  event.currentTarget.style.borderRadius = '50%';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => {
                  if (!canCreateObjectiveInFilter) return;
                  objectiveModalManager.openTypesModal();
                }}
              >
                <Image src="/icons/icon-more.svg" alt="Criar objetivo" width={18} height={18} />
              </button>
              <Button type="link" size="small" onClick={() => router.push('/objectives')} style={{ color: '#6C5DD3', padding: 0, justifySelf: 'end' }}>
                Ver todos
              </Button>
            </div>

            {isLoadingObjectives ? (
              <div style={{ minHeight: 102, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin />
              </div>
            ) : objectives.length > 0 ? (
              <div style={{ minHeight: 102, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 18 }}>
                {objectives.slice(0, 3).map((obj) => {
                  const percent = Math.round(obj.progress_percentage || 0);
                  const circumference = 2 * Math.PI * 32;
                  const strokeDashoffset = circumference - (percent / 100) * circumference;
                  const colors = ['#6C5DD3', '#00875A', '#FF754C', '#FAAD14'];
                  const color = colors[objectives.indexOf(obj) % colors.length];

                  return (
                      <div key={obj.id} style={{ textAlign: 'center' }}>
                      <div style={{ position: 'relative', width: 72, height: 72 }}>
                        <svg width="72" height="72" viewBox="0 0 72 72">
                          <circle
                            cx="36"
                            cy="36"
                            r="32"
                            fill="none"
                            stroke="#F4F5F7"
                            strokeWidth="6"
                          />
                          <circle
                            cx="36"
                            cy="36"
                            r="32"
                            fill="none"
                            stroke={color}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 36 36)"
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                          />
                        </svg>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#11142D'
                        }}>
                          {percent}%
                        </div>
                      </div>
                      <AntTooltip placement="bottom" title={<span style={{ fontSize: 12 }}>{obj.name}</span>}>
                        <span style={{
                          display: 'block',
                          marginTop: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#11142D',
                          maxWidth: 80,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'default'
                        }}>
                          {obj.name}
                        </span>
                      </AntTooltip>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ minHeight: 102, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: 13, color: '#808191', marginBottom: 12 }}>Você ainda não definiu objetivos.</p>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  disabled={!canCreateObjectiveInFilter}
                  onClick={objectiveModalManager.openTypesModal}
                  style={{ borderRadius: 8, color: '#808191' }}
                >
                  Criar objetivo
                </Button>
              </div>
            )}
          </div>
        </Col>

        <Col xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column", zIndex: 2 }}>
          <div ref={refReal} className={styles.balance} style={{ flex: 1, padding: '16px 24px', position: 'relative', overflow: 'visible' }}>
            <p className={styles.balance_description} style={{ marginBottom: 12 }}>Meus cartões (fatura do período)</p>
            <p className={styles.balance_title} style={{ marginBottom: 24 }}><AnimatedNumber value={totalCardsInvoice} duration={1500} format={formatCurrency} /></p>

            {/* Card Slider / Stack Simulation */}
            <div style={{ position: 'relative', height: 220, marginBottom: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              {cards.length > 0 ? (
                cards.map((card, idx) => {
                  const n = cards.length;
                  let distance = idx - currentCardIndex;

                  // Lógica para carrossel infinito/circular se necessário
                  if (n > 2) {
                    if (distance > n / 2) distance -= n;
                    else if (distance < -n / 2) distance += n;
                  }

                  const isActive = idx === currentCardIndex;
                  const isVisible = Math.abs(distance) <= 1;

                  return (
                    <motion.div
                      key={card.id || idx}
                      onClick={() => setCurrentCardIndex(idx)}
                      animate={{
                        x: distance * 20,
                        scale: isActive ? 1 : 1,
                        zIndex: isActive ? 10 : 5,
                        filter: isActive ? 'brightness(1) blur(0px)' : 'brightness(0.7) blur(1px)',
                        opacity: isVisible ? 1 : 0,
                      }}
                      whileHover={{
                        scale: isActive ? 1.02 : 1,
                        filter: 'brightness(1)',
                      }}
                      transition={{
                        duration: 0.5,
                        ease: [0.34, 1.56, 0.64, 1]
                      }}
                      style={{
                        position: 'absolute',
                        width: '85%',
                        maxWidth: '380px',
                        aspectRatio: '1.58 / 1',
                        background: getFlagColor(card.flag_id),
                        borderRadius: 12,
                        padding: '18px 24px',
                        color: '#fff',
                        boxShadow: isActive ? '0px 15px 35px rgba(0, 0, 0, 0.2)' : '0px 5px 15px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                        pointerEvents: isVisible ? 'auto' : 'none'
                      }}
                    >
                      {/* Wave decoration */}
                      <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', zIndex: 0 }} />
                      <div style={{ position: 'absolute', bottom: '-25%', left: '-25%', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', zIndex: 0 }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2, fontWeight: 500 }}>Fatura do período</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                            <AnimatedNumber value={card.invoice} duration={1500} format={formatCurrency} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Image src={getFlagImage(card.flag_id)} alt="Flag" width={36} height={22} style={{ objectFit: 'contain' }} />
                          {card.flag_id === 3 && (
                            <div style={{ fontSize: 7, color: '#fff', marginTop: 1, opacity: 0.9, fontWeight: 500, textTransform: 'lowercase' }}>mastercard</div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: 13, letterSpacing: 2, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                          **** **** **** ****
                        </div>
                        <div style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>
                          {card.period_invoice_pay_day
                            ? dayjs(card.period_invoice_pay_day).format("DD/MM")
                            : `${String(card.expiration).padStart(2, '0')}/${String(showDate(card.expiration)).padStart(2, '0')}`}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div style={{
                  width: '90%', height: '150px', background: '#f0f0f5', borderRadius: 16,
                  display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#808191',
                  zIndex: 10
                }}>
                  Nenhum cartão ativo
                </div>
              )}
            </div>

            {/* Slider Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
              {cards.length > 0 ? (
                cards.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentCardIndex(idx)}
                    style={{
                      width: idx === currentCardIndex ? 24 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: idx === currentCardIndex ? '#6C5DD3' : '#E4E4EB',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))
              ) : (
                <div style={{ width: 24, height: 6, borderRadius: 3, background: '#E4E4EB' }} />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <Button
                type="dashed"
                block
                disabled={!focusedCard}
                onClick={openFocusedCardTransactionModal}
                style={{ borderRadius: 12, height: 48, color: '#808191', fontWeight: 500 }}
              >
                Nova transação
              </Button>
              <Button
                type="dashed"
                block
                disabled={!focusedCard || !canCreateObjectiveInFilter}
                onClick={openFocusedCardInvoiceModal}
                style={{ borderRadius: 12, height: 48, color: '#808191', fontWeight: 500 }}
              >
                Pagar fatura
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      <Row gutter={[24, 24]} style={{ padding: "0 30px 30px 30px", marginTop: 0 }}>
        <Col ref={refCategorias} xs={24} lg={12} xl={12}>
          <div>
            <MyCategoriesList categories={categorySummaries} loading={isLoadingCategories} onRefresh={getCategorySummaries} />
          </div>
        </Col>
        <Col ref={refTransacoes} xs={24} lg={12} xl={12}>
          <div>
            <LastTransactionsList transactions={periodTransactions} loading={isLoadingChart} />
          </div>
        </Col>
      </Row>
      <CustomTour
        open={openTour}
        steps={steps}
        current={tourStep}
        onChange={setTourStep}
        onClose={handleCloseTour}
      />
      <Modal
        title="Editar teto de gastos"
        open={isEditMode}
        onCancel={() => setIsEditMode(false)}
        footer={null}
        centered
      >
        <Form
          layout="vertical"
          onFinish={handleFinishEditGoal}
          initialValues={{ planned_spending: periodPlannedSpending }}
        >
          <Form.Item
              label="Valor do teto"
              name="planned_spending"
              rules={[{ required: true, message: "Por favor, insira o valor do teto de gastos!" }]}
            >
              <Input
                type="number"
                placeholder="Ex: 2000"
                prefix="R$"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setIsEditMode(false)}>Cancelar</Button>
                <Button type="primary" htmlType="submit" style={{ background: '#6C5DD3', borderColor: '#6C5DD3' }}>
                  Salvar teto de gastos
                </Button>
              </Space>
            </Form.Item>
        </Form>
      </Modal>

      <EnterTransactionModal
        isModalOpen={isEnterModalOpen}
        setIsModalOpen={setIsEnterModalOpen}
        onSuccess={handleRefreshData}
      />
      <OutputModal
        isModalOpen={isOutputModalOpen}
        setIsModalOpen={setIsOutputModalOpen}
        onSuccess={handleRefreshData}
      />
      <NewCardModal
        isModalOpen={isCardModalOpen}
        setIsModalOpen={setIsCardModalOpen}
        onSuccess={handleRefreshData}
      />
      {selectedCardForAction && (
        <>
          <CardTransactionModal
            isModalOpen={isCardTransactionModalOpen}
            setIsModalOpen={setIsCardTransactionModalOpen}
            cardId={selectedCardForAction.id}
            onSuccess={handleRefreshData}
          />
          <PayInvoiceModal
            isModalOpen={isPayInvoiceModalOpen}
            setIsModalOpen={setIsPayInvoiceModalOpen}
            cardId={selectedCardForAction.id}
            cardDescription={selectedCardForAction.card_description}
            onSuccess={handleRefreshData}
          />
        </>
      )}
      <ObjectiveModalManager manager={objectiveModalManager} />
    </div>
    </div>
  );
};

export default Resume;
