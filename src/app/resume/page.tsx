"use client";
import Image from "next/image";
import { Button, Col, Row, Typography, message, Tour, Badge, Space, Modal, Form, Input, Progress } from "antd";
import type { TourProps } from "antd";
import {
  BellOutlined, PlusOutlined, SwapOutlined,
  CreditCardOutlined, PlusCircleOutlined,
  MinusCircleOutlined, ShopOutlined, EyeOutlined, EyeInvisibleOutlined, MoreOutlined,
  WalletOutlined, TagOutlined, LineChartOutlined, RocketOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import styles from "./resume.module.scss";
import { ResumeTemporalFilter, type ResumeFilters } from "./temporalFilter";
import MyCategoriesList from "@/components/MyCategoriesList";
import LastTransactionsList from "@/components/LastTransactionsList";
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

dayjs.locale("pt-br");

interface BalanceProps {
  balance: number;
  planned_spending: number;
  real_spending: number;
}

interface PeriodBudgetSummary {
  planned_spending_total: number;
  real_spending_total: number;
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
  const [cards, setCards] = useState<any[]>([]);
  const [totalCardsInvoice, setTotalCardsInvoice] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showAnimatedChart, setShowAnimatedChart] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [objectives, setObjectives] = useState<any[]>([]);

  const formatCurrency = (value: any): string => {
    const numValue = parseFloat(value || 0);
    return numValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getFlagColor = (flagId: number) => {
    const colors: { [key: number]: string } = {
      3: 'linear-gradient(135deg, #1e1e1e 0%, #3a3a3a 100%)', // Mastercard (Dark)
      4: 'linear-gradient(135deg, #1a1f71 0%, #0056b3 100%)', // Visa (Blue)
      5: 'linear-gradient(135deg, #d32f2f 0%, #ff5252 100%)', // Hipercard (Red)
      6: 'linear-gradient(135deg, #2d3e50 0%, #4c5c6e 100%)', // Elo (Grey/Dark Blue)
      7: 'linear-gradient(135deg, #00875a 0%, #22a06b 100%)', // Alelo (Green)
      8: 'linear-gradient(135deg, #007bc1 0%, #00b0ff 100%)', // Amex (Light Blue)
      9: 'linear-gradient(135deg, #004a97 0%, #0074e4 100%)', // Diners (Blue/Navy)
    };
    return colors[flagId] || 'linear-gradient(135deg, #6C5DD3 0%, #8E82EF 100%)';
  };

  const getFlagImage = (flagId: number) => {
    const images: { [key: number]: string } = {
      3: '/mastercard.png',
      4: '/visa.png',
      5: '/hipercard.png',
      6: '/elo.png',
      7: '/alelo.png',
      8: '/amex.png',
      9: '/diners.png',
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

  const currentMonthLabel = monthNames[filters.month - 1] || "Periodo";
  const filterSummary = useMemo(() => {
    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      return `${dayjs(filters.dateFrom).format("DD/MM/YYYY")} até ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`;
    }

    return `${currentMonthLabel} de ${filters.year}`;
  }, [currentMonthLabel, filters]);
  const chartLabelPrefix = filters.mode === "month" ? "Dia" : "Data";
  const goalCardTitle = filters.mode === "month" ? "Meta do Mês" : "Meta do Período";
  const periodPlannedSpending = Number(periodBudgetSummary.planned_spending_total || 0);
  const periodRealSpending = Number(periodBudgetSummary.real_spending_total || 0);
  const spentPercentage = periodPlannedSpending > 0 ? (periodRealSpending / periodPlannedSpending) * 100 : 0;
  const isCurrentMonthFilter =
    filters.mode === "month" &&
    filters.month === today.getMonth() + 1 &&
    filters.year === today.getFullYear();
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
  const [gastoPlanejado, setGastoPlanejado] = useState("");

  const refSaldo = useRef<HTMLDivElement | null>(null);
  const refPlanejado = useRef<HTMLDivElement | null>(null);
  const refReal = useRef<HTMLDivElement | null>(null);
  const refCategorias = useRef<HTMLDivElement | null>(null);
  const refTransacoes = useRef<HTMLDivElement | null>(null);

  const handleFinishEditGoal = async (values: any) => {
    try {
      await request({
        endpoint: "spending/store",
        method: "POST",
        data: {
          planned_spending: values.planned_spending,
        },
      });
      setIsEditMode(false);
      getBalance();
      getPeriodBudgetSummary();
      message.success("Meta atualizada com sucesso!");
    } catch (error) {
      message.error("Algo deu errado ao atualizar a meta!");
    }
  };

  const handleClickShowSaldo = () => {
    setShowSaldo(!showSaldo);
    if (showSaldo) {
      setIconShowSaldo("/icons/icon-show-saldo.svg");
    } else {
      setIconShowSaldo("/icons/icon-hide-saldo.svg");
    }
  };

  const getBalance = async () => {
    try {
      const { data } = await request({
        endpoint: "balance",
      });
      setBalance(data.finances);

      const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour");
      if (!hasSeenTour) {
        try {
          const [catRes, transRes] = await Promise.all([
            request({ method: "GET", endpoint: "categories" }),
            request({ method: "GET", endpoint: "transaction/all" })
          ]);
          const cats = catRes?.data?.data?.categories;
          const trans = transRes?.data?.data?.transactions;
          const bal = data.finances;

          if (
            Number(bal?.balance || 0) === 0 &&
            Number(bal?.planned_spending || 0) === 0 &&
            Number(bal?.real_spending || 0) === 0 &&
            (!cats || cats.length === 0) &&
            (!trans || trans.length === 0)
          ) {
            setOpenTour(true);
          } else {
            localStorage.setItem("hasSeenOnboardingTour", "true");
          }
        } catch (error) {
          console.error(error);
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
      const response = await request({
        endpoint: "cards",
      });
      const cardsList = response?.data?.data?.cards || [];

      const cardsWithInvoices = await Promise.all(
        cardsList.map(async (card: any) => {
          try {
            const invoiceRes = await request({
              endpoint: `cards/${card.id}/invoice`,
            });
            return {
              ...card,
              invoice_value: invoiceRes?.data?.data?.invoice || 0,
            };
          } catch (err) {
            return { ...card, invoice_value: 0 };
          }
        })
      );

      const totalValue = cardsWithInvoices.reduce((acc, card) => acc + (card.invoice_value || 0), 0);
      setCards(cardsWithInvoices);
      setTotalCardsInvoice(totalValue);
    } catch (error) {
      console.error(error);
    }
  };

  const getObjectives = async () => {
    try {
      const { data } = await request({
        method: "GET",
        endpoint: "objectives",
      });
      setObjectives(data.data.objectives || []);
    } catch (error) {
      console.error("Erro ao buscar objetivos:", error);
    }
  };

  const getPeriodBudgetSummary = async () => {
    try {
      const queryString = buildAnalysisQueryString(filters);
      const summaryResponse = await request({ method: "GET", endpoint: `analysis/summary?${queryString}` });

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

  const getTransactionsData = async () => {
    try {
      setIsLoadingChart(true);
      const response = await request({
        endpoint: "transaction/all",
      });
      const txs = response?.data?.data?.transactions || [];

      if (txs.length === 0) {
        setChartData([]);
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
    } catch (error) {
      console.error("Erro ao buscar transações para o gráfico:", error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  useEffect(() => {
    getBalance();
    getUser();
    getCardsData();
    getObjectives();
  }, []);

  useEffect(() => {
    getTransactionsData();
    getPeriodBudgetSummary();
  }, [filters]);

  const handleCloseTour = () => {
    setOpenTour(false);
    setTourStep(0);
    localStorage.setItem("hasSeenOnboardingTour", "true");
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

  const getStepGap = (ref: React.RefObject<HTMLElement | null>, extraOffset = 10) => {
  const el = ref.current;
  if (!el) {
    return { offset: 10, radius: 16 };
  }

  const styles = window.getComputedStyle(el);
  const radius = parseInt(styles.borderRadius || "16", 10);

  return {
    offset: extraOffset,
    radius: Number.isNaN(radius) ? 16 : radius,
  };
};

  const steps = [
    {
      title: "Bem-vindo ao Ficker!",
      description:
        "Comece visualizando seu saldo total e o progresso dos seus objetivos financeiros mais importantes logo no primeiro card.",
      target: () => refSaldo.current,
      placement: "bottom" as const,
      offset: 12,
    },
    {
      title: "Gestão de Orçamento",
      description:
        "Aqui você acompanha quanto planejou gastar versus seu gasto real.",
      target: () => refPlanejado.current,
      placement: "bottom" as const,
      offset: 12,
    },
    {
      title: "Meus Cartões",
      description:
        "Visualize faturas e limites disponíveis de forma intuitiva.",
      target: () => refReal.current,
      placement: "bottom" as const,
      offset: 12,
    },
    {
      title: "Categorias de Gastos",
      description:
        "Entenda exatamente para onde seu dinheiro está indo.",
      target: () => refCategorias.current,
      placement: "top" as const,
      offset: 12,
    },
    {
      title: "Últimas Transações",
      description:
        "Acesse rapidamente seu histórico recente.",
      target: () => refTransacoes.current,
      placement: "top" as const,
      offset: 12,
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
          r={4}
          fill="#6C5DD3"
          stroke="#fff"
          strokeWidth={2}
          key={`dot-${index}`}
        />
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh", overflow: "hidden" }}>
      <CustomMenu />
      <div style={{ flex: "1 1 0%", overflowY: "auto", overflowX: "hidden" }}>
        <div className={styles.header} style={{ padding: "30px 30px", marginBottom: 12 }}>
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
              style={{ cursor: 'pointer', background: '#f4f5f7', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <InfoCircleOutlined style={{ fontSize: 20, color: '#808191' }} />
            </div>
            <div className={styles.notification} style={{ background: '#f4f5f7', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Badge dot color="#FF754C" offset={[-2, 4]}>
                <BellOutlined style={{ fontSize: 20, color: '#808191' }} />
              </Badge>
            </div>
          </div>          
        </div>
      {/* The Alert Banner has been moved to the sidebar */}

      <Row gutter={[24, 24]} align="stretch" style={{ padding: "0 30px 12px 30px" }}>
        <Col  xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column" }}>
          <div ref={refSaldo} className={styles.balance} style={{ flex: 1, padding: '24px' }}>
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
                  width: 40, height: 40, borderRadius: '10px', background: '#F4F5F7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#808191', fontSize: 18, transition: 'all 0.2s'
                }}
              >
                {showSaldo ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className={styles.balance_description} style={{ margin: 0, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visão Geral</h3>
            </div>

            <div style={{ width: '100%', height: 70 }}>
              {isLoadingChart ? (
                <div style={{ textAlign: 'center', color: '#808191' }}>Carregando dados...</div>
              ) : chartData.length > 0 ? (
                showAnimatedChart ? (
                  <motion.div
                    key={chartRevealKey}
                    initial={{ clipPath: "inset(0 100% 0 0)" }}
                    animate={{ clipPath: "inset(0 0% 0 0)" }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    style={{ width: "100%", height: 80 }}
                  >
                    <ResponsiveContainer width="100%" height={80}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6C5DD3" stopOpacity={0.08} />
                            <stop offset="95%" stopColor="#6C5DD3" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#6C5DD3"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorTotal)"
                          isAnimationActive={false}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0, fill: '#6C5DD3' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                ) : (
                  <div style={{ width: "100%", height: 120 }} />
                )
              ) : (
                <div style={{ textAlign: 'center', color: '#808191', height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Ainda não possui dados</p>
                  <p style={{ fontSize: 12 }}>Suas transações aparecerão aqui.</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F4F5F7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className={styles.balance_description} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  <RocketOutlined style={{ marginRight: 6, fontSize: 12 }} />
                  Objetivos
                </h3>
                <Button type="link" size="small" onClick={() => router.push('/objectives')} style={{ color: '#6C5DD3', padding: 0 }}>
                  Ver todos
                </Button>
              </div>

              {objectives.length > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 18 }}>
                  {objectives.slice(0, 3).map((obj) => {
                    const percent = Math.round(obj.progress_percentage || 0);
                    const circumference = 2 * Math.PI * 36;
                    const strokeDashoffset = circumference - (percent / 100) * circumference;
                    const colors = ['#6C5DD3', '#00875A', '#FF754C', '#FAAD14'];
                    const color = colors[objectives.indexOf(obj) % colors.length];
                    
                    return (
                      <div key={obj.id} style={{ textAlign: 'center' }}>
                        <div style={{ position: 'relative', width: 80, height: 80 }}>
                          <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              fill="none"
                              stroke="#F4F5F7"
                              strokeWidth="6"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              fill="none"
                              stroke={color}
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              transform="rotate(-90 40 40)"
                              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                            />
                          </svg>
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#11142D'
                          }}>
                            {percent}%
                          </div>
                        </div>
                        <span style={{ 
                          display: 'block', 
                          marginTop: 8, 
                          fontSize: 11, 
                          fontWeight: 600, 
                          color: '#11142D',
                          maxWidth: 80,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {obj.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ fontSize: 13, color: '#808191', marginBottom: 12 }}>Você ainda não definiu objetivos.</p>
                  <Button 
                    type="dashed" 
                    size="small" 
                    icon={<PlusOutlined />} 
                    onClick={() => router.push('/objectives')}
                    style={{ borderRadius: 8, color: '#808191' }}
                  >
                    Criar objetivo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Col>

        <Col xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column" }}>
          <div ref={refPlanejado} className={styles.balance} style={{ flex: 1, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                    <TagOutlined style={{ marginRight: 6, fontSize: 12 }} />
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
                  <LineChartOutlined style={{ marginRight: 6, fontSize: 12 }} />
                  Gasto Real
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
                        ? "Defina uma meta"
                        : "Sem meta acumulada"}
                  </span>
                </div>
            </div>
          </div>

          {/* Quick Actions area */}
          <div className={styles.quickActions} style={{ marginTop: 20 }}>
            <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 16, color: '#808191' }}>Ações</p>
            <div className={styles.buttonsContainer} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div className={styles.actionButton} style={{ background: '#E6F7EF' }} onClick={() => router.push('/EnterTransaction')}>
                <PlusCircleOutlined style={{ fontSize: 24, color: '#00875A' }} />
                <span style={{ color: '#00875A' }}>Entrada</span>
              </div>
              <div className={styles.actionButton} style={{ background: '#FFEBE6' }} onClick={() => router.push('/Outputs')}>
                <MinusCircleOutlined style={{ fontSize: 24, color: '#DE350B' }} />
                <span style={{ color: '#DE350B' }}>Saída</span>
              </div>
              <div className={styles.actionButton} style={{ background: '#E2E2FB' }} onClick={() => router.push('/cards')}>
                <CreditCardOutlined style={{ fontSize: 24, color: '#6C5DD3' }} />
                <span style={{ color: '#6C5DD3' }}>Cartões</span>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column" }}>
          <div ref={refReal} className={styles.balance} style={{ flex: 1, padding: '24px', position: 'relative', overflow: 'visible' }}>
            <p className={styles.balance_description} style={{ marginBottom: 12 }}>Meus Cartões (total de gastos)</p>
            <p className={styles.balance_title} style={{ marginBottom: 24 }}><AnimatedNumber value={totalCardsInvoice} duration={1500} format={formatCurrency} /></p>

            {/* Card Slider / Stack Simulation */}
            <div style={{ position: 'relative', height: 180, marginBottom: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
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
                        width: '80%',
                        height: '130px',
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
                          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2, fontWeight: 500 }}>Fatura</div>
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
                          {String(card.expiration).padStart(2, '0')}/
                          {String(showDate(card.expiration)).padStart(2, '0')}
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
                  Nenhum cartão cadastrado
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

            <Button type="dashed" block icon={<PlusOutlined />} style={{ borderRadius: 12, height: 48, color: '#808191', fontWeight: 500 }}>
              Adicionar um novo cartão
            </Button>
          </div>
        </Col>
      </Row>
      <Row gutter={[24, 24]} align="stretch" style={{ padding: "0 30px 30px 30px" }}>
        <Col ref={refCategorias} xs={24} lg={12} xl={12} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <MyCategoriesList />
          </div>
        </Col>
        <Col ref={refTransacoes} xs={24} lg={12} xl={12} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <LastTransactionsList />
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
        title="Editar Meta do Mês"
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
            label="Valor da Meta"
            name="planned_spending"
            rules={[{ required: true, message: "Por favor, insira o valor da meta!" }]}
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
                Salvar Meta
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
    </div>
  );
};

export default Resume;
