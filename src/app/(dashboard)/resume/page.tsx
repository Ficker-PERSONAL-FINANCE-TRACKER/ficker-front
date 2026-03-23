"use client";
import Image from "next/image";
import { Button, Col, Row, Typography, message, Tour, Badge, Space } from "antd";
import type { TourProps } from "antd";
import { 
  BellOutlined, PlusOutlined, SwapOutlined, 
  CreditCardOutlined, PlusCircleOutlined, 
  MinusCircleOutlined, ShopOutlined, EyeOutlined, EyeInvisibleOutlined, MoreOutlined
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
      3: 'linear-gradient(135deg, #7B61FF 0%, #5E5CE6 50%, #4D3CFF 100%)', // Mastercard
      4: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)', // Visa
      5: 'linear-gradient(135deg, #e3001b 0%, #ff4b4b 100%)', // Hipercard
      6: 'linear-gradient(135deg, #2D3E50 0%, #4C5C6E 100%)', // Elo
      7: 'linear-gradient(135deg, #00875A 0%, #22A06B 100%)', // Alelo
      8: 'linear-gradient(135deg, #007bc1 0%, #00B0FF 100%)', // Amex
      9: 'linear-gradient(135deg, #004a97 0%, #0074E4 100%)', // Diners
    };
    return colors[flagId] || 'linear-gradient(135deg, #11142D 0%, #444E72 100%)';
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
  const [gastoPlanejado, setGastoPlanejado] = useState("0");

  const [openTour, setOpenTour] = useState(false);
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

  const handleBlur = () => {
    setIsEditMode(false);
    // Faça a requisição de atualização aqui com o novo valor (gastoPlanejado)
  };

  const handleKeyDown = async (e: any) => {
    if (e.keyCode === 13) {
      setIsEditMode(false);
      try {
        await request({
          endpoint: "spending/store",
          method: "POST",
          data: {
            planned_spending: gastoPlanejado,
          },
        });
        getBalance();
      } catch (error) {
        message.error("Algo deu errado!");
      }
    }
  };

  const getUser = async () => {
    try {
      const response = await request({
        endpoint: "user",
      });
      setUser(response.data);
    } catch (error) { }
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

      // Group by month
      const grouped: { [key: string]: { name: string, entrada: number, saida: number, total: number } } = {};
      
      // Sort transactions by date first
      const sortedTxs = [...txs].sort((a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix());

      sortedTxs.forEach((tx: any) => {
        const date = dayjs(tx.date);
        let monthKey = date.format("MMM"); // e.g., "mar."
        monthKey = monthKey.charAt(0).toUpperCase() + monthKey.slice(1).replace(".", "");
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = { 
            name: monthKey, 
            entrada: 0, 
            saida: 0, 
            total: 0 
          };
        }
        
        const value = parseFloat(tx.transaction_value || 0);
        if (tx.type_id === 1) { // 1 = Entrada
          grouped[monthKey].entrada += value;
        } else if (tx.type_id === 2) { // 2 = Saída
          grouped[monthKey].saida += value;
        }
        grouped[monthKey].total = grouped[monthKey].entrada - grouped[monthKey].saida;
      });

      // Convert to array and ensure we have at least 6 months if possible, or just what we have
      const data = Object.values(grouped);
      setChartData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  useEffect(() => {
    getBalance();
    getUser();
    getCardsData();
    getTransactionsData();
  }, []);

  const handleCloseTour = () => {
    setOpenTour(false);
    localStorage.setItem("hasSeenOnboardingTour", "true");
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

  return (
    <>
      <div className={styles.header}>
        <div>
            <span style={{ color: "#808191", fontSize: "14px", fontWeight: 500 }}>{dateRange}</span>
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

        <Row align={"middle"} justify={"space-between"} style={{ marginBottom: 32 }}>
          <div>
            <h2 className={styles.greeting}>Olá, {user?.name || "User"}!</h2>
          </div>
        </Row>

        {/* The Alert Banner has been moved to the sidebar */}

        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column" }}>
            <div ref={refSaldo} className={styles.balance} style={{ flex: 1, padding: '24px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 4 }}>Saldo</p>
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
                <span style={{ fontSize: 20, fontWeight: 600, color: '#11142D' }}>Visão Geral</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF754C' }} />
                    <span style={{ fontSize: 12, color: '#808191' }}>Saída</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#A0E75A' }} />
                    <span style={{ fontSize: 12, color: '#808191' }}>Entrada</span>
                  </div>
                  <MoreOutlined style={{ color: '#808191', fontSize: 20, cursor: 'pointer' }} />
                </div>
              </div>

              <div style={{ width: '100%', height: 160, marginTop: 10 }}>
                {isLoadingChart ? (
                  <div style={{ textAlign: 'center', color: '#808191' }}>Carregando dados...</div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A0E75A" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#A0E75A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f5" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#808191', fontSize: 10 }} 
                        dy={5}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#808191', fontSize: 10 }}
                        dx={-5}
                      />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="entrada" 
                        stroke="#A0E75A" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorSaldo)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="saida" 
                        stroke="#FF754C" 
                        strokeWidth={2} 
                        fillOpacity={0.1} 
                        fill="#FF754C" 
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
                  <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 4 }}>Meta do Mês</p>
                  <p className={styles.balance_title} style={{ fontSize: 28, marginBottom: 16 }}>
                    <AnimatedNumber value={balance.planned_spending} duration={1500} format={formatCurrency} />
                  </p>
                </div>
                <Button type="text" onClick={handleClickEditGastoPlanejado} icon={
                  <Image src="/edit.png" alt="Editar" width={20} height={20} />
                } />
              </div>

              <div style={{ marginTop: 8 }}>
                <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 4 }}>Gasto Real</p>
                <p className={styles.balance_title} style={{ fontSize: 28, marginBottom: 16 }}>
                  <AnimatedNumber value={balance.real_spending} duration={1500} format={formatCurrency} />
                </p>
                
                <div style={{ width: '100%', height: 10, background: '#f0f0f5', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    width: `${Math.min((balance.real_spending / balance.planned_spending) * 100 || 0, 100)}%`,
                    height: '100%',
                    background: '#FFA940',
                    borderRadius: 5
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#808191' }}>{((balance.real_spending / balance.planned_spending) * 100 || 0).toFixed(0)}%</span>
                  <span style={{ fontSize: 11, color: '#808191' }}>
                    Restam {formatCurrency(balance.planned_spending - balance.real_spending).replace(",00", "")}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions area */}
            <div className={styles.quickActions} style={{ marginTop: 24, padding: '20px 24px', display: 'block' }}>
              <p className={styles.balance_description} style={{ fontSize: 13, marginBottom: 20, color: '#808191' }}>Menu de ações rápidas</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div className={styles.actionButton} style={{ flex: 1, border: 'none', padding: 0 }} onClick={() => router.push('/EnterTransaction')}>
                  <div className={styles.actionIcon} style={{ background: '#E6F7EF', color: '#00875A', borderRadius: 12, width: 48, height: 48 }}>
                    <PlusCircleOutlined style={{ fontSize: 24 }} />
                  </div>
                  <span style={{ fontSize: 12, marginTop: 8 }}>Entrada</span>
                </div>
                <div className={styles.actionButton} style={{ flex: 1, border: 'none', padding: 0 }} onClick={() => router.push('/Outputs')}>
                  <div className={styles.actionIcon} style={{ background: '#FFEBE6', color: '#DE350B', borderRadius: 12, width: 48, height: 48 }}>
                    <MinusCircleOutlined style={{ fontSize: 24 }} />
                  </div>
                  <span style={{ fontSize: 12, marginTop: 8 }}>Saída</span>
                </div>
                <div className={styles.actionButton} style={{ flex: 1, border: 'none', padding: 0 }} onClick={() => router.push('/cards')}>
                  <div className={styles.actionIcon} style={{ background: '#E2E2FB', color: '#6C5DD3', borderRadius: 12, width: 48, height: 48 }}>
                    <CreditCardOutlined style={{ fontSize: 24 }} />
                  </div>
                  <span style={{ fontSize: 12, marginTop: 8 }}>Cartões</span>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={8} xl={8} style={{ display: "flex", flexDirection: "column" }}>
            <div ref={refReal} className={styles.balance} style={{ flex: 1, padding: '16px 24px', position: 'relative' }}>
              <p className={styles.balance_description} style={{ marginBottom: 12 }}>Meus Cartões (total de gastos)</p>
              <p className={styles.balance_title} style={{ marginBottom: 24 }}><AnimatedNumber value={totalCardsInvoice} duration={1500} format={formatCurrency} /></p>
              
              {/* Card Slider / Stack Simulation */}
              <div style={{ position: 'relative', height: 180, marginBottom: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                {cards.length > 0 ? (
                  cards.map((card, idx) => {
                    const n = cards.length;
                    let distance = idx - currentCardIndex;
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
                        whileHover={{ scale: isActive ? 1.02 : 1, translateY: isActive ? -5 : 0 }}
                        style={{ 
                          position: 'absolute',
                          width: '80%',
                          height: '120px',
                          background: getFlagColor(card.flag_id),
                          borderRadius: 20,
                          padding: '14px 20px',
                          color: '#fff',
                          boxShadow: isActive ? '0px 10px 30px rgba(0, 0, 0, 0.2)' : 'none',
                          zIndex: 10 - Math.abs(distance),
                          opacity: isVisible ? (isActive ? 1 : 0.4) : 0,
                          filter: isActive ? 'none' : 'blur(2px)',
                          transform: `translateX(${distance * 85}px) scale(${1 - Math.abs(distance) * 0.15}) translateY(${Math.abs(distance) * 5}px)`,
                          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          cursor: isActive ? 'default' : 'pointer',
                          pointerEvents: isVisible ? 'auto' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Wave decoration (simulated with CSS circles) */}
                        <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', zIndex: 0 }} />
                        <div style={{ position: 'absolute', bottom: '-25%', left: '-25%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.03)', zIndex: 0 }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 }}>Fatura</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                              <AnimatedNumber value={card.invoice} duration={1500} format={formatCurrency} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Image src={getFlagImage(card.flag_id)} alt="Flag" width={32} height={18} style={{ objectFit: 'contain' }} />
                            {card.flag_id === 3 && (
                                <div style={{ fontSize: 7, color: '#fff', marginTop: 1, opacity: 0.9, fontWeight: 500, textTransform: 'lowercase' }}>mastercard</div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: 12, letterSpacing: 2, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                            **** **** **** ****
                          </div>
                          <div style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>
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
    </>
  );
};

export default Resume;
