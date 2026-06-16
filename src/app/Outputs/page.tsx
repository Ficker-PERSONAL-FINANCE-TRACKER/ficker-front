"use client";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "antd";
import { OutputModal } from "./modal";
import { request } from "@/service/api";
import { TransactionTab, type TransactionSortConfig } from "@/components/TransactionTab";
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
  const [sortConfig, setSortConfig] = useState<TransactionSortConfig>({ sortBy: "created_at", direction: "desc" });
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
      filters.category_ids?.forEach((categoryId) => params.append("category_ids[]", String(categoryId)));
      if (!filters.category_ids?.length && filters.category_id) params.set("category_id", String(filters.category_id));
      filters.payment_method_ids?.forEach((paymentMethodId) => params.append("payment_method_ids[]", String(paymentMethodId)));
      if (!filters.payment_method_ids?.length && filters.payment_method_id) params.set("payment_method_id", String(filters.payment_method_id));
      filters.card_ids?.forEach((cardId) => params.append("card_ids[]", String(cardId)));
      if (!filters.card_ids?.length && filters.card_id) params.set("card_id", String(filters.card_id));
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("sort_by", sortConfig.sortBy);
      params.set("sort_direction", sortConfig.direction);
      params.set("page", String(pagination.current));
      params.set("per_page", String(pagination.pageSize));

      if (isFilterApplied) {
        if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
          params.set("date_from", filters.dateFrom);
          params.set("date_to", filters.dateTo);
        } else if (filters.month && filters.year) {
          params.set("month", String(filters.month));
          params.set("year", String(filters.year));
        } else if (filters.months?.length && filters.years?.length) {
          filters.months.forEach((month) => params.append("months[]", String(month)));
          filters.years.forEach((year) => params.append("years[]", String(year)));
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
      months: undefined,
      year: now.getFullYear(),
      years: undefined,
      dateFrom: null,
      dateTo: null,
    });
    setIsFilterApplied(false);
    setPagination((current) => ({ ...current, current: 1 }));
  };

  useEffect(() => {
    getTransactions();
  }, [isModalOpen, isEditModalOpen, filters, isFilterApplied, searchTerm, sortConfig, pagination.current, pagination.pageSize]);

  const handleSortChange = (nextSortConfig: TransactionSortConfig) => {
    setSortConfig(nextSortConfig);
    setPagination((current) => ({ ...current, current: 1 }));
  };

  const appliedFiltersLabels = useMemo(() => {
    const labels: string[] = [];

    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      labels.push(`Período: ${dayjs(filters.dateFrom).format("DD/MM/YYYY")} - ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`);
    } else if (isFilterApplied && filters.month && filters.year) {
      labels.push(`Mês: ${monthNames[filters.month - 1]}`);
      labels.push(`Ano: ${filters.year}`);
    } else if (isFilterApplied && filters.months?.length && filters.years?.length) {
      labels.push(`Meses: ${filters.months.map((month) => monthNames[month - 1]).join(", ")}`);
      labels.push(`Anos: ${filters.years.join(", ")}`);
    }

    if (filters.category_id && filters.category_name) labels.push(`Categoria: ${filters.category_name}`);
    if (filters.category_names?.length) labels.push(`Categorias: ${filters.category_names.join(", ")}`);
    if (filters.payment_method_id && filters.payment_method_name) labels.push(`Forma de pagamento: ${filters.payment_method_name}`);
    if (filters.payment_method_names?.length) labels.push(`Formas de pagamento: ${filters.payment_method_names.join(", ")}`);
    if (filters.card_id && filters.card_name) labels.push(`Cartão: ${filters.card_name}`);
    if (filters.card_names?.length) labels.push(`Cartões: ${filters.card_names.join(", ")}`);

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
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            sortableColumns={["transaction_description", "date", "category_description", "transaction_value", "payment_method_description"]}
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
