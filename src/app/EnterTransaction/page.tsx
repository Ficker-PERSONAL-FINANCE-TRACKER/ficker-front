"use client";
import styles from "./entertransaction.module.scss";
import CustomMenu from "@/components/CustomMenu";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "antd";
import { EnterTransactionModal } from "./modal";
import { request } from "@/service/api";
import { TransactionTab } from "@/components/TransactionTab";
import SearchField from "@/components/SearchField";
import { ITransaction } from "@/interfaces";
import dayjs from "dayjs";
import { EnterTemporalFilter, type IncomeFilters } from "./temporalFilter";
import { AppliedFiltersBar } from "@/components/AppliedFiltersBar";

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
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<IncomeFilters>({
    mode: "month",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    dateFrom: null,
    dateTo: null,
  });

  const getTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category_id) params.set("category_id", String(filters.category_id));
      params.set("page", String(pagination.current));
      params.set("per_page", String(pagination.pageSize));

      if (isFilterApplied) {
        if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
          params.set("date_from", filters.dateFrom);
          params.set("date_to", filters.dateTo);
        } else if (filters.month && filters.year) {
          params.set("month", String(filters.month));
          params.set("year", String(filters.year));
        }
      }

      const queryString = params.toString();
      const endpoint = `transaction/type/1${queryString ? `?${queryString}` : ""}`;

      const response = await request({
        method: "GET",
        endpoint,
      });
      setTransactions(response?.data?.data?.transactions ?? []);
      setPagination((current) => ({
        ...current,
        total: Number(response?.data?.meta?.total ?? response?.data?.total ?? 0),
      }));
    } catch (error) {
      console.log(error);
      setTransactions([]);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    getTransactions();
  }, [isModalOpen, isEditModalOpen, filters, isFilterApplied, pagination.current, pagination.pageSize]);

  const handleFilterChange = (nextFilters: IncomeFilters) => {
    setFilters(nextFilters);
    setIsFilterApplied(true);
    setPagination((current) => ({ ...current, current: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      mode: "month",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      dateFrom: null,
      dateTo: null,
    });
    setIsFilterApplied(false);
    setPagination((current) => ({ ...current, current: 1 }));
  };

  const appliedFiltersLabels = useMemo(() => {
    const labels: string[] = [];

    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      labels.push(`Período: ${dayjs(filters.dateFrom).format("DD/MM/YYYY")} - ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`);
    } else if (isFilterApplied && filters.month && filters.year) {
      labels.push(`Mês: ${monthNames[filters.month - 1]}`);
      labels.push(`Ano: ${filters.year}`);
    }

    if (filters.category_id && filters.category_name) labels.push(`Categoria: ${filters.category_name}`);

    return labels;
  }, [filters, isFilterApplied, monthNames]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <CustomMenu />
      <EnterTransactionModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <div style={{ width: "90vw", flex: "1 1 0%", overflowX: "hidden" }}>
        <div className={styles.titleArea}>
          <div>
            <h2>Entradas</h2>
          </div>
          <div className={styles.buttonsArea}>
            <SearchField style={{ width: 300, marginRight: 0, flex: "0 0 auto" }} />
            <button className={styles.button} onClick={showModal} style={{ whiteSpace: "nowrap" }}>
              Nova entrada
            </button>
            <EnterTemporalFilter filters={filters} onChange={handleFilterChange} />
          </div>
        </div>

        {appliedFiltersLabels.length > 0 && (
          <div className={styles.gridPadding}>
            <AppliedFiltersBar filters={appliedFiltersLabels} onClear={handleClearFilters} />
          </div>
        )}

        <div className={styles.gridPadding}>
          <TransactionTab
            data={transactions}
            typeId={1}
            editModal={isEditModalOpen}
            setEditModal={setIsEditModalOpen}
          />
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger={false}
            onChange={(page) => setPagination((current) => ({ ...current, current: page }))}
            style={{ marginTop: 24, textAlign: "right" }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnterTransaction;
