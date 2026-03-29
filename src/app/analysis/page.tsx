"use client";
import LastTransactionsList from "@/components/LastTransactionsList";
import { Col, Row, Spin } from "antd";
import Link from "next/link";
import Image from "next/image";
import styles from "./analysis.module.scss";
import ExpensesByCategoryChartContainer from "@/components/ExpensesByCategoryChartContainer";
import PlannedSpendingByRealSpendingChartContainer from "@/components/PlannedSpendingByRealSppendingChartContainer";
import AnalysesByMonthChartContainer from "@/components/AnalysesByMonthChartContainer";
import { useEffect, useState } from "react";
import { request } from "@/service/api";
import CustomMenu from "@/components/CustomMenu";



type TotalTransactions = {
  total: number;
  mostExpensive: number;
};

const Analysis = () => {
  const [transactions, setTransactions] = useState<TotalTransactions>({} as TotalTransactions);
  const [totalOutTransactions, setTotalOutTransactions] = useState<number>(0);
  const [totalEnterTransactions, setTotalEnterTransactions] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const getOutTransactions = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "transaction/type/2",
      });
      setTotalOutTransactions(response.data.data.transactions.length);
    } catch (error) {
      console.log(error);
    }
  };
  const getEnterTransactions = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "transaction/type/1",
      });
      setTotalEnterTransactions(response.data.data.transactions.length);
    } catch (error) {
      console.log(error);
    }
  };

  const getTransactions = async () => {
    try {
      const { data } = await request({
        method: "GET",
        endpoint: "transaction/all",
        loaderStateSetter: setLoading,
      });
      setTransactions({ total: data.total, mostExpensive: data.most_expensive });
    } catch (error) {
      console.log(error);
    }
  };

  const formatCurrency = (value: any) => {
    if (value === null || value === undefined) {
      return null;
    }
    const formattedValue = parseFloat(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return formattedValue;
  };

  useEffect(() => {
    getTransactions();
    getOutTransactions();
    getEnterTransactions();
  }, []);

  const Loading = () => {
    return (
      <Row justify={"center"}>
        <Spin />
      </Row>
    );
  };
  return (
     <div style={{ display: "flex", flexDirection: "row" }}>
        <CustomMenu />
        <div style={{ width: "90vw" }}>
          <div style={{ background: "#fff", padding: 10, alignItems: "center" }}>
            <Link href={"/"} style={{ background: "#fff", padding: 10, alignItems: "center" }}>
              <Image src="/logo.png" alt="Logo" width={130} height={27} />
            </Link>
          </div>
          
          <Row align={"middle"} justify={"space-between"} style={{ marginBottom: 30 }}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: "2rem" }}>Análises</h2>
            </div>
          </Row>
          
          {loading ? (
            <Loading />
          ) : (
            <>
              <Row gutter={[24, 24]} align="stretch">
                <Col xs={24} sm={12} lg={6} style={{ display: "flex", flexDirection: "column" }}>
                  <div className={styles.balance} style={{ flex: 1, boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.03)" }}>
                    <p className={styles.balance_description}>Transação Mais Cara</p>
                    <p className={styles.balance_title}>{formatCurrency(transactions?.mostExpensive || 0)}</p>
                  </div>
                </Col>
                <Col xs={24} sm={12} lg={6} style={{ display: "flex", flexDirection: "column" }}>
                  <div className={styles.balance} style={{ flex: 1, boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.03)" }}>
                    <p className={styles.balance_description}>Transações de Entrada</p>
                    <p className={styles.balance_title}>{totalEnterTransactions}</p>
                  </div>
                </Col>
                <Col xs={24} sm={12} lg={6} style={{ display: "flex", flexDirection: "column" }}>
                  <div className={styles.balance} style={{ flex: 1, boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.03)" }}>
                    <p className={styles.balance_description}>Transações de Saída</p>
                    <p className={styles.balance_title}>{totalOutTransactions}</p>
                  </div>
                </Col>
                <Col xs={24} sm={12} lg={6} style={{ display: "flex", flexDirection: "column" }}>
                  <div className={styles.balance} style={{ flex: 1, boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.03)" }}>
                    <p className={styles.balance_description}>Transações Totais</p>
                    <p className={styles.balance_title}>{transactions?.total}</p>
                  </div>
                </Col>
              </Row>
              <Row gutter={[24, 24]} align="stretch" style={{ marginTop: 24 }}>
                <Col xs={24} lg={12} xl={12} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <PlannedSpendingByRealSpendingChartContainer />
                  </div>
                </Col>
                <Col xs={24} lg={12} xl={12} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <AnalysesByMonthChartContainer />
                  </div>
                </Col>
              </Row>
              <Row gutter={[24, 24]} align="stretch" style={{ marginTop: 24, marginBottom: 24 }}>
                <Col xs={24} lg={12} xl={12} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <ExpensesByCategoryChartContainer />
                  </div>
                </Col>
                <Col xs={24} lg={12} xl={12} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <LastTransactionsList />
                  </div>
                </Col>
              </Row>
            </>
          )}
        </div>
    </div>
  );
};

export default Analysis;
