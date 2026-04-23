"use client";
import styles from "./entertransaction.module.scss";
import CustomMenu from "@/components/CustomMenu";
import { useEffect, useMemo, useState } from "react";
import { EnterTransactionModal } from "./modal";
import { request } from "@/service/api";
import { TransactionTab } from "@/components/TransactionTab";
import SearchField from "@/components/SearchField";
import { ITransaction } from "@/interfaces";
import dayjs from "dayjs";
import { EnterTemporalFilter, type IncomeFilters } from "./temporalFilter";

const EnterTransaction = () => {
  const now = new Date();
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<IncomeFilters>({
    mode: "month",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    dateFrom: null,
    dateTo: null,
  });

  const getTransactions = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "transaction/type/1",
      });
      setTransactions(response.data.data.transactions);
    } catch (error) {
      console.log(error);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = dayjs(transaction.date);

      if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
        const start = dayjs(filters.dateFrom).startOf("day");
        const end = dayjs(filters.dateTo).endOf("day");

        return (
          (transactionDate.isAfter(start) || transactionDate.isSame(start, "day")) &&
          (transactionDate.isBefore(end) || transactionDate.isSame(end, "day"))
        );
      }

      return transactionDate.month() + 1 === filters.month && transactionDate.year() === filters.year;
    });
  }, [filters, transactions]);

  const filterSummary = useMemo(() => {
    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      return `${dayjs(filters.dateFrom).format("DD/MM/YYYY")} até ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`;
    }

    return `${monthNames[filters.month - 1]} de ${filters.year}`;
  }, [filters, monthNames]);

  useEffect(() => {
    getTransactions();
  }, [isModalOpen, isEditModalOpen]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <CustomMenu />
      <EnterTransactionModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <div style={{ width: "90vw", flex: "1 1 0%", overflowX: "hidden" }}>
        <div className={styles.titleArea}>
          <div>
            <h2>Entradas</h2>
          </div>
          <div className={styles.buttonsArea} style={{ width: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <SearchField style={{ width: 300, marginRight: 0, flex: "0 0 auto" }} />
            <button className={styles.button} onClick={showModal} style={{ whiteSpace: "nowrap" }}>
              Nova entrada
            </button>
            <EnterTemporalFilter filters={filters} onChange={setFilters} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 30px", marginTop: -4, marginBottom: 10 }}>
          <span style={{ color: "#808191", fontSize: 13, fontWeight: 600 }}>{filterSummary}</span>
        </div>
        <div style={{ padding: "0 30px" }}>
          <TransactionTab
            data={filteredTransactions}
            typeId={1}
            editModal={isEditModalOpen}
            setEditModal={setIsEditModalOpen}
          />
        </div>
      </div>
    </div>
  );
};

export default EnterTransaction;
