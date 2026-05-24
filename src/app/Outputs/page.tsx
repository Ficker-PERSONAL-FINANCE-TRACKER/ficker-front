"use client";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "antd";
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
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState("");
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
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
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
      const endpoint = `transaction/type/2${queryString ? `?${queryString}` : ""}`;

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

  const handleFilterChange = (nextFilters: OutputFilters) => {
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

  useEffect(() => {
    getTransactions();
  }, [isModalOpen, isEditModalOpen, filters, isFilterApplied, searchTerm, pagination.current, pagination.pageSize]);

  const appliedFiltersLabels = useMemo(() => {
    const labels: string[] = [];

    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      labels.push(`Período: ${dayjs(filters.dateFrom).format("DD/MM/YYYY")} - ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`);
    } else if (isFilterApplied && filters.month && filters.year) {
      labels.push(`Mês: ${monthNames[filters.month - 1]}`);
      labels.push(`Ano: ${filters.year}`);
    }

    if (filters.category_id && filters.category_name) labels.push(`Categoria: ${filters.category_name}`);
    if (filters.payment_method_id && filters.payment_method_name) labels.push(`Forma de pagamento: ${filters.payment_method_name}`);
    if (filters.card_id && filters.card_name) labels.push(`Cartão: ${filters.card_name}`);

    return labels;
  }, [filters, isFilterApplied, monthNames]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <CustomMenu />
      <OutputModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <div style={{ width: "90vw", flex: "1 1 0%", overflowX: "hidden" }}>
        <div className={styles.titleArea}>
          <div>
            <h2>Saídas</h2>
          </div>
          <div className={styles.buttonsArea}>
            <SearchField
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPagination((current) => ({ ...current, current: 1 }));
              }}
              style={{ width: 300, marginRight: 0, flex: "0 0 auto" }}
            />
            <button className={styles.button} onClick={showModal} style={{ whiteSpace: "nowrap" }}>
              Nova saída
            </button>
            <OutputTemporalFilter filters={filters} onChange={handleFilterChange} />
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
            typeId={2}
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

export default Outputs;
