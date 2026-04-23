"use client";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { useEffect, useMemo, useState } from "react";
import { OutputModal } from "./modal";
import { request } from "@/service/api";
import { TransactionTab } from "@/components/TransactionTab";
import SearchField from "@/components/SearchField";
import { ITransaction } from "@/interfaces";
import CustomMenu from "@/components/CustomMenu";
import dayjs from "dayjs";
import { OutputTemporalFilter, type OutputFilters } from "./temporalFilter";

const Outputs = () => {
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
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [filters, setFilters] = useState<OutputFilters>({
    mode: "month",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    dateFrom: null,
    dateTo: null,
  });

  const showModal = () => {
    setIsModalOpen(true);
  };

  const getTransactions = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "transaction/type/2",
      });
      setTransactions(response.data.data.transactions);
    } catch (error) {
      console.log(error);
    }
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
      <OutputModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <div style={{ width: "90vw", flex: "1 1 0%", overflowX: "hidden" }}>
        <div className={styles.titleArea}>
          <div>
            <h2>Saídas</h2>
          </div>
          <div className={styles.buttonsArea} style={{ width: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <SearchField style={{ width: 300, marginRight: 0, flex: "0 0 auto" }} />
            <button className={styles.button} onClick={showModal} style={{ whiteSpace: "nowrap" }}>
              Nova saída
            </button>
            <OutputTemporalFilter filters={filters} onChange={setFilters} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 30px", marginTop: -4, marginBottom: 10 }}>
          <span style={{ color: "#808191", fontSize: 13, fontWeight: 600 }}>{filterSummary}</span>
        </div>
        <div style={{ padding: "0 30px" }}>
          <TransactionTab
            data={filteredTransactions}
            typeId={2}
            editModal={isEditModalOpen}
            setEditModal={setIsEditModalOpen}
          />
        </div>
      </div>
    </div>
  );
};

export default Outputs;
