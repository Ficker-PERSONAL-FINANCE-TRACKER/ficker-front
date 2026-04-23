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
import { AppliedFiltersBar } from "@/components/AppliedFiltersBar";

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
      const params = new URLSearchParams();
      if (filters.category_id) params.set("category_id", String(filters.category_id));
      if (filters.payment_method_id) params.set("payment_method_id", String(filters.payment_method_id));
      if (filters.card_id) params.set("card_id", String(filters.card_id));
      if (filters.flag_id) params.set("flag_id", String(filters.flag_id));

      const queryString = params.toString();
      const endpoint = `transaction/type/2${queryString ? `?${queryString}` : ""}`;

      const response = await request({
        method: "GET",
        endpoint,
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
  }, [isModalOpen, isEditModalOpen, filters]);

  const appliedFiltersLabels = useMemo(() => {
    const labels: string[] = [];
    const isDefaultMonth = filters.mode === "month" && filters.month === (now.getMonth() + 1) && filters.year === now.getFullYear();

    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      labels.push(`Período: ${dayjs(filters.dateFrom).format("DD/MM/YYYY")} - ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`);
    } else if (!isDefaultMonth) {
      labels.push(`Mês: ${monthNames[filters.month - 1]}`);
      labels.push(`Ano: ${filters.year}`);
    }

    if (filters.category_id) labels.push("Categoria selecionada");
    if (filters.payment_method_id) labels.push("Método de pagamento selecionado");
    if (filters.card_id) labels.push("Cartão selecionado");
    if (filters.flag_id) labels.push("Bandeira selecionada");

    return labels;
  }, [filters, monthNames, now]);

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

        {appliedFiltersLabels.length > 0 && (
          <div style={{ padding: "0 30px" }}>
            <AppliedFiltersBar filters={appliedFiltersLabels} />
          </div>
        )}

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
