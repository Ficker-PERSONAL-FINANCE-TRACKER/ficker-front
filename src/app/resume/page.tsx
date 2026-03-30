"use client";
import Image from "next/image";
import { Button, Col, Row, Typography, message, Tour, Badge, Space, Modal, Form, Input } from "antd";
import type { TourProps } from "antd";
import { 
  BellOutlined, PlusOutlined, SwapOutlined, 
  CreditCardOutlined, PlusCircleOutlined, 
  MinusCircleOutlined, ShopOutlined, EyeOutlined, EyeInvisibleOutlined, MoreOutlined,
  WalletOutlined, TagOutlined, LineChartOutlined
} from "@ant-design/icons";
import styles from "./resume.module.scss";
import MyCategoriesList from "@/components/MyCategoriesList";
import LastTransactionsList from "@/components/LastTransactionsList";
import { useEffect, useState, useRef } from "react";
import { request } from "@/service/api";
import { useRouter } from "next/navigation";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import AnimatedNumber from "@/components/AnimatedNumber";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { motion } from "framer-motion";
import CustomMenu from "@/components/CustomMenu";

dayjs.locale("pt-br");

interface BalanceProps {
  balance: number;
  planned_spending: number;
  real_spending: number;
}

const Resume = () => {
  const router = useRouter();
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [showAlertBanner, setShowAlertBanner] = useState(true);
  const [balance, setBalance] = useState<BalanceProps>({} as BalanceProps);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [period, setPeriod] = useState<"this" | "last">("this");
  const [cards, setCards] = useState<any[]>([]);
  const [totalCardsInvoice, setTotalCardsInvoice] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

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

  const monthName = monthNames[today.getMonth()];

  const dateRange = `${firstDayOfMonth.getDate()} de ${monthName} - ${lastDayOfMonth.getDate()} de ${monthName}`;

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
  const [gastoPlanejado, setGastoPlanejado] = useState("");

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
      message.success("Meta atualizada com sucesso!");
    } catch (error) {
      message.error("Algo deu errado ao atualizar a meta!");
    }
  };
  const refSaldo = useRef(null);
  const refPlanejado = useRef(null);
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
    const spentPercentage = (balance.real_spending / balance.planned_spending) * 100 || 0;
    if (spentPercentage < 90 && balance.planned_spending > 0) {
      const timer = setTimeout(() => {
        setShowAlertBanner(false);
      }, 8000); 
      return () => clearTimeout(timer);
    } else {
      setShowAlertBanner(true);
    }
  }, [balance.real_spending, balance.planned_spending]);

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
      const referenceDate = period === "this" ? dayjs() : dayjs().subtract(1, "month");
      const startOfMonth = referenceDate.startOf("month");
      const daysInMonth = referenceDate.daysInMonth();

      // Calcular o saldo acumulado ANTES do mês de referência
      let runningBalance = txs.reduce((acc: number, tx: any) => {
        const txDate = dayjs(tx.date);
        if (txDate.isBefore(startOfMonth)) {
          const value = parseFloat(tx.transaction_value || 0);
          return tx.type_id === 1 ? acc + value : acc - value;
        }
        return acc;
      }, 0);

      // Inicializar todos os dias do mês com valores zero
      const grouped: { [key: string]: { name: string, entrada: number, saida: number, total: number } } = {};
      for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = String(i).padStart(2, "0");
        grouped[dayStr] = { 
          name: dayStr, 
          entrada: 0, 
          saida: 0, 
          total: 0 
        };
      }
      
      // Filtrar e somar transações apenas do mês selecionado
      txs.forEach((tx: any) => {
        const txDate = dayjs(tx.date);
        
        // Verifica se a transação pertence ao mês e ano de referência
        if (txDate.isSame(referenceDate, 'month')) {
          const dayKey = txDate.format("DD");
          const value = parseFloat(tx.transaction_value || 0);
          
          if (grouped[dayKey]) {
            if (tx.type_id === 1) { // 1 = Entrada
              grouped[dayKey].entrada += value;
            } else if (tx.type_id === 2) { // 2 = Saída
              grouped[dayKey].saida += value;
            }
          }
        }
      });

      // Converter para array ordenado por dia e calcular saldo acumulado dia a dia
      const data = Object.values(grouped).sort((a, b) => parseInt(a.name) - parseInt(b.name));
      data.forEach((day: any) => {
        runningBalance += (day.entrada - day.saida);
        day.total = runningBalance;
      });

      // Filtrar para começar a partir da primeira movimentação ou saldo inicial
      const firstActiveDayIndex = data.findIndex(day => day.total !== 0 || day.entrada > 0 || day.saida > 0);
      const filteredData = firstActiveDayIndex !== -1 ? data.slice(firstActiveDayIndex) : [];

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
    getTransactionsData();
  }, [period]);

  const handleCloseTour = () => {
    setOpenTour(false);
    localStorage.setItem("hasSeenOnboardingTour", "true");
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#fff', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ fontWeight: 700, marginBottom: '8px', color: '#11142D' }}>Dia {label}</p>
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

  const steps: TourProps['steps'] = [
    {
      title: 'Bem-vindo ao Ficker!',
      description: 'Vamos fazer um tour rápido para você conhecer o sistema. Este é o seu Saldo Atual.',
      target: () => refSaldo.current,
    },
    {
      title: 'Gasto Planejado',
      description: 'Aqui você pode definir e visualizar quanto planeja gastar no mês. Clique no ícone de lápis para editar.',
      target: () => refPlanejado.current,
    },
    {
      title: 'Gasto Real',
      description: 'Este é o valor que você já gastou até agora. Fique de olho para não passar do planejado!',
      target: () => refReal.current,
    },
    {
      title: 'Minhas Categorias',
      description: 'Você pode criar categorias customizadas para organizar suas despesas e receitas.',
      target: () => refCategorias.current,
    },
    {
      title: 'Últimas Transações',
      description: 'Aqui aparecerá o histórico das suas movimentações financeiras recentes.',
      target: () => refTransacoes.current,
    },
    {
      title: 'Entradas',
      description: 'Aqui você registra todo o dinheiro que entra, como seu salário e outros ganhos.',
      target: () => document.querySelector('a[href="/EnterTransaction"]')?.closest('.ant-menu-item') as HTMLElement,
    },
    {
      title: 'Saídas',
      description: 'Registre suas despesas, contas e qualquer tipo de gasto de dinheiro.',
      target: () => document.querySelector('a[href="/Outputs"]')?.closest('.ant-menu-item') as HTMLElement,
    },
    {
      title: 'Meus Cartões',
      description: 'Acompanhe as suas faturas de cartões de crédito para ter um controle detalhado.',
      target: () => document.querySelector('a[href="/cards"]')?.closest('.ant-menu-item') as HTMLElement,
    },
    {
      title: 'Análises',
      description: 'Visualize gráficos e relatórios detalhados para entender e planejar seu dinheiro.',
      target: () => document.querySelector('a[href="/analysis"]')?.closest('.ant-menu-item') as HTMLElement,
    },
    {
      title: 'Primeira Entrada',
      description: (
        <div>
          <p style={{ marginBottom: 10 }}>Tudo pronto! Que tal registrar sua primeira movimentação financeira agora?</p>
          <Button type="primary" onClick={() => {
            handleCloseTour();
            router.push('/EnterTransaction');
          }}>
            Fazer primeira entrada
          </Button>
        </div>
      ),
      target: () => document.querySelector('a[href="/EnterTransaction"]')?.closest('.ant-menu-item') as HTMLElement,
    }
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
    <div style={{ display: "flex", flexDirection: "row" }}>
        <CustomMenu />
        <div style={{ width: "90vw", flex: "1 1 0%", padding: "30px 40px", overflowX: "hidden" }}>
          <div className={styles.header}>
            <div>
                <h2 className={styles.greeting} style={{ margin: 0 }}>Olá, {user?.name ? user.name.split(" ").slice(0, 2).join(" ") : "John Amorim"}!</h2>
              </div>
              <div className={styles.topActions}>
                <div className={styles.periodSelector}>
                  <button
                    className={period === "this" ? styles.active : ""}
                    onClick={() => setPeriod("this")}
                  >
                    Este Mês
                  </button>
                  <button
                    className={period === "last" ? styles.active : ""}
                    onClick={() => setPeriod("last")}
                  >
                    Último Mês
                  </button>
                </div>
                <div className={styles.notification}>
                  <Badge dot color="#FF754C">
                    <BellOutlined style={{ fontSize: 22 }} />
                  </Badge>
                </div>
              </div>
            </div>

            {/* The Alert Banner has been moved to the sidebar */}

            <Row gutter={[24, 24]} align="stretch">
              <Col xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column" }}>
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
                        width: 60, height: 60, borderRadius: '50%', background: '#F4F5F7',
                        display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#808191', fontSize: 24
                      }}
                    >
                      {showSaldo ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 className={styles.balance_description} style={{ margin: 0 }}>Visão Geral</h3>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6C5DD3' }} />
                        <span style={{ fontSize: 11, color: '#808191' }}>Saldo</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: 160, marginTop: 10 }}>
                    {isLoadingChart ? (
                      <div style={{ textAlign: 'center', color: '#808191' }}>Carregando dados...</div>
                    ) : chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6C5DD3" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#6C5DD3" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#808191', fontSize: 10 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis hide />
                          <Tooltip content={<CustomTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="total" 
                              stroke="#6C5DD3" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorTotal)" 
                              dot={<RenderDot />}
                              activeDot={{ r: 6, strokeWidth: 0, fill: '#6C5DD3' }}
                            />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#808191' }}>
                        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Ainda não possui dados</p>
                        <p style={{ fontSize: 12 }}>Suas transações aparecerão aqui.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Col>

              <Col xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column" }}>
                <div ref={refPlanejado} className={styles.balance} style={{ flex: 1, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                        <TagOutlined style={{ marginRight: 6, fontSize: 12 }} />
                        Meta do Mês
                      </p>
                      <p className={styles.balance_title} style={{ fontSize: 28, marginBottom: 16 }}>
                        <AnimatedNumber value={balance.planned_spending} duration={1500} format={formatCurrency} />
                      </p>
                    </div>
                    <Button type="text" onClick={handleClickEditGastoPlanejado} icon={
                      <Image src="/edit.png" alt="Editar" width={20} height={20} />
                    } />
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                      <LineChartOutlined style={{ marginRight: 6, fontSize: 12 }} />
                      Gasto Real
                    </p>
                    <p className={styles.balance_title} style={{ fontSize: 28, marginBottom: 16 }}>
                      <AnimatedNumber value={balance.real_spending} duration={1500} format={formatCurrency} />
                    </p>
                    
                    <div style={{ width: '100%', height: 10, background: '#f0f0f5', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{
                        width: `${Math.min((balance.real_spending / balance.planned_spending) * 100 || 0, 100)}%`,
                        height: '100%',
                        background: (() => {
                          const percent = (balance.real_spending / balance.planned_spending) * 100 || 0;
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
                          const percent = (balance.real_spending / balance.planned_spending) * 100 || 0;
                          if (percent >= 90) return '#DE350B';
                          if (percent >= 70) return '#FFA940';
                          return '#00875A';
                        })()
                      }}>
                        {balance.planned_spending > 0 
                          ? `${((balance.real_spending / balance.planned_spending) * 100 || 0).toFixed(0)}%` 
                          : "0%"}
                      </span>
                      <span style={{ fontSize: 11, color: '#808191' }}>
                        {balance.planned_spending > 0 
                          ? `Restam ${formatCurrency(balance.planned_spending - balance.real_spending).replace(",00", "")}`
                          : "Defina uma meta"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions area */}
                <div className={styles.quickActions} style={{ marginTop: 20 }}>
                  <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 16, color: '#808191' }}>Ações rápidas</p>
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
                <div ref={refReal} className={styles.balance} style={{ flex: 1, padding: '16px 24px', position: 'relative', overflow: 'visible' }}>
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
              <Row gutter={[24, 24]} align="stretch" style={{ marginTop: 24, marginBottom: 24 }}>
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
            <Tour open={openTour} onClose={handleCloseTour} steps={steps} />
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
                initialValues={{ planned_spending: balance.planned_spending }}
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
