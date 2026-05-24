"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Progress, Button, Modal, Form, InputNumber, message, Card, Empty, Spin, Checkbox, Select, Pagination } from "antd";
import CustomMenu from "@/components/CustomMenu";
import { AppliedFiltersBar } from "@/components/AppliedFiltersBar";
import { getApiErrorMessage, request } from "@/service/api";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  EditOutlined,
  CalendarOutlined,
  DollarOutlined,
  RocketOutlined,
  WalletOutlined,
  StarOutlined,
  RestOutlined,
  HomeOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  CoffeeOutlined,
  ReadOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  ShoppingOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import styles from "./categories.module.scss";

const MONTH_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const CATEGORIES_PER_PAGE = 9;

type CategoryMonthData = {
  id: number;
  type_id?: number;
  category_description: string;
  category_spending: number;
  category_real_spending?: number;
  category_limit?: number;
};

type CategoryView = {
  id: number;
  category_description: string;
  category_limit: number;
  category_total_spending: number;
};

type FilterMode = "month" | "custom";

type CategoryFilters = {
  mode: FilterMode;
  month: number | null;
  year: number | null;
  months: number[];
  years: number[];
  customMonthStart: number | null;
  customYearStart: number | null;
  customMonthEnd: number | null;
  customYearEnd: number | null;
};

type FilterFormValues = {
  mode: FilterMode;
  month?: number;
  year?: number;
  months?: number[];
  years?: number[];
  custom_month_start?: number;
  custom_year_start?: number;
  custom_month_end?: number;
  custom_year_end?: number;
};

const getCoveredMonths = (filters: CategoryFilters) => {
  if (filters.mode === "month") {
    const selectedMonths = filters.months.length > 0 ? filters.months : filters.month ? [filters.month] : [];
    const selectedYears = filters.years.length > 0 ? filters.years : filters.year ? [filters.year] : [];

    return selectedYears
      .flatMap((year) => selectedMonths.map((month) => ({ month, year })))
      .sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
  }

  const start = filters.mode === "custom" && filters.customMonthStart && filters.customYearStart
    ? dayjs().year(filters.customYearStart).month(filters.customMonthStart - 1).startOf("month")
    : dayjs().year(filters.year ?? dayjs().year()).month((filters.month ?? dayjs().month() + 1) - 1).startOf("month");
  const end = filters.mode === "custom" && filters.customMonthEnd && filters.customYearEnd
    ? dayjs().year(filters.customYearEnd).month(filters.customMonthEnd - 1).startOf("month")
    : dayjs().year(filters.year ?? dayjs().year()).month((filters.month ?? dayjs().month() + 1) - 1).startOf("month");
  const months: Array<{ month: number; year: number }> = [];

  let cursor = start.clone();
  while (cursor.isBefore(end) || cursor.isSame(end, "month")) {
    months.push({ month: cursor.month() + 1, year: cursor.year() });
    cursor = cursor.add(1, "month");
  }

  return months;
};

const buildCategoriesQueryString = (filters: CategoryFilters) => {
  const params = new URLSearchParams();
  const coveredMonths = getCoveredMonths(filters);

  if (filters.mode === "custom") {
    coveredMonths.forEach(({ month, year }) => {
      params.append("periods[]", `${year}-${String(month).padStart(2, "0")}`);
    });
  } else {
    const selectedMonths = filters.months.length > 0 ? filters.months : filters.month ? [filters.month] : [];
    const selectedYears = filters.years.length > 0 ? filters.years : filters.year ? [filters.year] : [];

    selectedMonths.forEach((month) => params.append("months[]", String(month)));
    selectedYears.forEach((year) => params.append("years[]", String(year)));
  }

  params.append("t", String(Date.now()));
  return params.toString();
};

const CategoriesPage = () => {
  const now = new Date();
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryView | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>({
    mode: "month",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    months: [now.getMonth() + 1],
    years: [now.getFullYear()],
    customMonthStart: null,
    customYearStart: null,
    customMonthEnd: null,
    customYearEnd: null,
  });
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm<FilterFormValues>();
  const [transactionYears, setTransactionYears] = useState<number[]>([]);

  const yearOptions = useMemo(
    () => transactionYears.map((year) => ({ value: year, label: String(year) })),
    [transactionYears]
  );

  const selectedPeriods = useMemo(() => getCoveredMonths(filters), [filters]);
  const selectedMonthNames = useMemo(() => {
    const uniqueMonths = Array.from(new Set(selectedPeriods.map((period) => period.month)));
    return uniqueMonths
      .map((month) => MONTH_OPTIONS.find((option) => option.value === month)?.label)
      .filter(Boolean)
      .join(", ");
  }, [selectedPeriods]);
  const selectedYearsLabel = useMemo(() => {
    const uniqueYears = Array.from(new Set(selectedPeriods.map((period) => period.year)));
    return uniqueYears.join(", ");
  }, [selectedPeriods]);
  const currentMonthLabel = selectedPeriods.length === 1
    ? MONTH_OPTIONS.find((option) => option.value === selectedPeriods[0].month)?.label ?? "Período"
    : "Período";
  const filterSummary = useMemo(() => {
    if (
      filters.mode === "custom" &&
      filters.customMonthStart &&
      filters.customYearStart &&
      filters.customMonthEnd &&
      filters.customYearEnd
    ) {
      const startLabel = MONTH_OPTIONS.find((option) => option.value === filters.customMonthStart)?.label ?? "Início";
      const endLabel = MONTH_OPTIONS.find((option) => option.value === filters.customMonthEnd)?.label ?? "Fim";

      return `${startLabel} de ${filters.customYearStart} até ${endLabel} de ${filters.customYearEnd}`;
    }

    if (selectedPeriods.length === 1) {
      return `${currentMonthLabel} de ${selectedPeriods[0].year}`;
    }

    return `${selectedMonthNames || "Meses"} de ${selectedYearsLabel || "Anos"}`;
  }, [currentMonthLabel, filters, selectedMonthNames, selectedPeriods, selectedYearsLabel]);

  const appliedFiltersLabels = useMemo(() => {
    const labels: string[] = [];
    const isDefaultMonth = filters.mode === "month"
      && selectedPeriods.length === 1
      && selectedPeriods[0].month === (now.getMonth() + 1)
      && selectedPeriods[0].year === now.getFullYear();

    if (
      filters.mode === "custom" &&
      filters.customMonthStart &&
      filters.customYearStart &&
      filters.customMonthEnd &&
      filters.customYearEnd
    ) {
      const startLabel = MONTH_OPTIONS.find((option) => option.value === filters.customMonthStart)?.label ?? "Início";
      const endLabel = MONTH_OPTIONS.find((option) => option.value === filters.customMonthEnd)?.label ?? "Fim";
      labels.push(`Período: ${startLabel} de ${filters.customYearStart} - ${endLabel} de ${filters.customYearEnd}`);
    } else if (!isDefaultMonth) {
      labels.push(`Meses: ${selectedMonthNames || currentMonthLabel}`);
      labels.push(`Anos: ${selectedYearsLabel}`);
    }

    return labels;
  }, [currentMonthLabel, filters, now, selectedMonthNames, selectedPeriods, selectedYearsLabel]);

  const canEditLimit = filters.mode === "month" && selectedPeriods.length === 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * CATEGORIES_PER_PAGE;
    return categories.slice(start, start + CATEGORIES_PER_PAGE);
  }, [categories, currentPage]);

  const getCategoryIcon = (category: any) => {
    const id = Number(category?.id);
    const description = category?.category_description?.toLowerCase() || "";
    const normalizedDescription = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Map by ID (Highest priority)
    if (id === 1) return { icon: <DollarOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (id === 2) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (id === 3) return { icon: <WalletOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (id === 4) return { icon: <StarOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (id === 5) return { icon: <CarOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (id === 6) return { icon: <MedicineBoxOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (id === 7) return { icon: <CoffeeOutlined />, color: "#FF754C", bg: "#FFEBE6" };
    if (id === 8) return { icon: <ThunderboltOutlined />, color: "#FFD700", bg: "#FFFBE6" };
    if (id === 9) return { icon: <WifiOutlined />, color: "#8E82EF", bg: "#F5F3FF" };
    if (id === 10) return { icon: <ShoppingOutlined />, color: "#FF4D4F", bg: "#FFF1F0" };
    if (id === 11) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };

    // Fallback by description (for legacy or untracked IDs)
    if (description.includes("salário")) return { icon: <DollarOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (description.includes("freelance")) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (description.includes("investimentos")) return { icon: <WalletOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (description.includes("renda extra")) return { icon: <StarOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (normalizedDescription.includes("moradia")) return { icon: <HomeOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (normalizedDescription.includes("alimentacao")) return { icon: <RestOutlined />, color: "#FF754C", bg: "#FFEBE6" };
    if (normalizedDescription.includes("educacao")) return { icon: <ReadOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (description.includes("transporte")) return { icon: <CarOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (description.includes("saúde")) return { icon: <MedicineBoxOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (description.includes("lazer")) return { icon: <CoffeeOutlined />, color: "#FF754C", bg: "#FFEBE6" };
    if (description.includes("contas")) return { icon: <ThunderboltOutlined />, color: "#FFD700", bg: "#FFFBE6" };
    if (description.includes("internet")) return { icon: <WifiOutlined />, color: "#8E82EF", bg: "#F5F3FF" };
    if (description.includes("compras")) return { icon: <ShoppingOutlined />, color: "#FF4D4F", bg: "#FFF1F0" };
    if (description.includes("projetos")) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };

    // Default icon for custom categories
    return { icon: <TagsOutlined />, color: "#808191", bg: "#F8FAFC" };
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const response = await request({ method: "GET", endpoint: `categories?${buildCategoriesQueryString(filters)}` });
      const responseCategories = (response.data?.data?.categories ?? []) as CategoryMonthData[];

      const mergedCategories = responseCategories
        .filter((cat) => Number(cat.type_id) === 2)
        .map((cat) => ({
          id: cat.id,
          category_description: cat.category_description,
          category_limit: Number(cat.category_limit || 0),
          category_total_spending: Number(cat.category_spending || cat.category_real_spending || 0),
        }))
        .sort((a, b) => b.category_total_spending - a.category_total_spending || a.category_description.localeCompare(b.category_description, "pt-BR"));

      setCategories(mergedCategories);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dayjs.locale("pt-br");
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(categories.length / CATEGORIES_PER_PAGE));
    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [categories.length, currentPage]);

  const handleEditLimit = (category: CategoryView) => {
    if (!canEditLimit) {
      message.info("A edição de teto fica disponível ao selecionar um único mês.");
      return;
    }

    setSelectedCategory(category);
    form.setFieldsValue({
      category_limit: category.category_limit || 0,
      keep_future: true,
    });
    setIsModalOpen(true);
  };

  const handleSaveLimit = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedCategory) {
        message.error("Categoria não selecionada");
        return;
      }

      await request({
        method: "PUT",
        endpoint: `categories/${selectedCategory.id}/limit`,
        data: {
          category_limit: Number(values.category_limit || 0),
          keep_future: Boolean(values.keep_future),
          month: selectedPeriods[0].month,
          year: selectedPeriods[0].year,
        },
      });

      message.success(
        `Teto para ${selectedCategory.category_description} atualizado com sucesso!`
      );
      setIsModalOpen(false);
      await fetchData();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  };

  const fetchTransactionYears = async () => {
    try {
      const response = await request({ method: "GET", endpoint: "transaction/years" });
      setTransactionYears(response?.data?.data?.years ?? []);
    } catch {
      setTransactionYears([]);
    }
  };

  const openFilterModal = () => {
    fetchTransactionYears();
    filterForm.setFieldsValue({
      mode: filters.mode,
      month: selectedPeriods[0]?.month ?? now.getMonth() + 1,
      year: selectedPeriods[0]?.year ?? now.getFullYear(),
      months: filters.months.length > 0 ? filters.months : [selectedPeriods[0]?.month ?? now.getMonth() + 1],
      years: filters.years.length > 0 ? filters.years : [selectedPeriods[0]?.year ?? now.getFullYear()],
      custom_month_start: filters.customMonthStart ?? undefined,
      custom_year_start: filters.customYearStart ?? undefined,
      custom_month_end: filters.customMonthEnd ?? undefined,
      custom_year_end: filters.customYearEnd ?? undefined,
    });
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = async () => {
    const values = await filterForm.validateFields();

    if (values.mode === "custom") {
      const start = dayjs().year(Number(values.custom_year_start)).month(Number(values.custom_month_start) - 1).startOf("month");
      const end = dayjs().year(Number(values.custom_year_end)).month(Number(values.custom_month_end) - 1).startOf("month");

      if (end.isBefore(start)) {
        message.error("O mês final precisa ser igual ou posterior ao mês inicial.");
        return;
      }

      setFilters({
        mode: "custom",
        month: null,
        year: null,
        months: [],
        years: [],
        customMonthStart: Number(values.custom_month_start),
        customYearStart: Number(values.custom_year_start),
        customMonthEnd: Number(values.custom_month_end),
        customYearEnd: Number(values.custom_year_end),
      });
    } else {
      setFilters({
        mode: "month",
        month: null,
        year: null,
        months: values.months?.map(Number) ?? [now.getMonth() + 1],
        years: values.years?.map(Number) ?? [now.getFullYear()],
        customMonthStart: null,
        customYearStart: null,
        customMonthEnd: null,
        customYearEnd: null,
      });
    }

    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      mode: "month" as const,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      months: [now.getMonth() + 1],
      years: [now.getFullYear()],
      customMonthStart: null,
      customYearStart: null,
      customMonthEnd: null,
      customYearEnd: null,
    };

    setFilters(defaultFilters);
    setCurrentPage(1);
    filterForm.setFieldsValue({
      mode: defaultFilters.mode,
      month: defaultFilters.month,
      year: defaultFilters.year,
      months: defaultFilters.months,
      years: defaultFilters.years,
      custom_month_start: undefined,
      custom_year_start: undefined,
      custom_month_end: undefined,
      custom_year_end: undefined,
    });
  };

  const formatCurrency = (value: number | string) =>
    Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "#FF4D4F";
    if (percent >= 70) return "#FFA940";
    return "#52C41A";
  };

  const selectedMode = Form.useWatch("mode", filterForm) ?? filters.mode;
  const validateMonthYearPair = (_: unknown, value: unknown) => {
    const values = filterForm.getFieldsValue();
    const months = values.months ?? [];
    const years = values.years ?? [];

    if ((months.length === 0 && years.length > 0) || (years.length === 0 && months.length > 0)) {
      return Promise.reject(new Error("Selecione ao menos um mês e um ano."));
    }

    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      return Promise.reject(new Error("Selecione ao menos uma opção."));
    }

    return Promise.resolve();
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh", background: "#F8FAFC" }}>
      <CustomMenu />
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Teto de gastos</h2>
            <p className={styles.pageSubtitle}>
              O teto total por categoria soma os tetos mensais existentes nos meses cobertos pelo filtro.
            </p>
          </div>
          <div className={styles.headerActions}>
            {!canEditLimit ? (
              <span className={styles.helperText}>
                Edição de tetos disponível apenas com um único mês selecionado.
              </span>
            ) : null}
            <span className={styles.filterSummary}>{filterSummary}</span>
            <Button className={styles.filterButton} icon={<CalendarOutlined />} onClick={openFilterModal}>
              Filtrar
            </Button>
          </div>
        </div>

        {appliedFiltersLabels.length > 0 && (
          <AppliedFiltersBar filters={appliedFiltersLabels} onClear={handleClearFilters} />
        )}

        <div className={styles.contentArea}>
          {loading ? (
            <div className={styles.loadingArea}><Spin size="large" /></div>
          ) : categories.length === 0 ? (
            <Empty description="Nenhuma categoria encontrada" />
          ) : (
            <>
              <Row gutter={[24, 24]}>
                {paginatedCategories.map((category) => {
                const { icon, color, bg } = getCategoryIcon(category);
                const limit = Number(category.category_limit || 0);
                const spending = Number(category.category_total_spending || 0);
                const percent = limit > 0 ? Math.min(Math.round((spending / limit) * 100), 100) : 0;

                return (
                  <Col xs={24} sm={12} xl={8} key={category.id}>
                    <Card className={styles.categoryCard} bordered={false} bodyStyle={{ padding: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            color,
                          }}>
                            {icon}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{category.category_description}</h3>
                            <span style={{ fontSize: 12, color: "#808191" }}>
                              {limit > 0 ? `Teto acumulado: ${formatCurrency(limit)}` : "Teto acumulado: não definido"}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditLimit(category)}
                          disabled={!canEditLimit}
                          style={{ color: "#808191" }}
                        />
                      </div>

                      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#808191" }}>Gasto na categoria no filtro</span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(spending)}</span>
                      </div>

                      <Progress
                        percent={percent}
                        strokeColor={getProgressColor(percent)}
                        trailColor="#F0F0F5"
                        showInfo={false}
                        strokeWidth={8}
                      />

                      <div style={{ marginTop: 8, textAlign: "right", fontSize: 12, color: "#808191" }}>
                        {limit > 0 ? `${percent}% consumido` : spending > 0 ? "Sem teto acumulado para o período" : "Sem uso no período"}
                      </div>
                    </Card>
                  </Col>
                );
                })}
              </Row>
              {categories.length > CATEGORIES_PER_PAGE && (
                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                  <Pagination
                    current={currentPage}
                    pageSize={CATEGORIES_PER_PAGE}
                    total={categories.length}
                    showSizeChanger={false}
                    onChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <Modal
          title={`Definir teto para ${selectedCategory?.category_description}`}
          open={isModalOpen}
          onOk={handleSaveLimit}
          onCancel={() => setIsModalOpen(false)}
          okText="Salvar teto"
          cancelText="Cancelar"
          centered
          okButtonProps={{ style: { background: "#6C5DD3" } }}
        >
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#808191", fontSize: 13 }}>
              Defina o valor máximo que você planeja gastar com <strong>{selectedCategory?.category_description}</strong> em {currentMonthLabel.toLowerCase()} de {selectedPeriods[0]?.year}.
            </p>
          </div>
          <Form form={form} layout="vertical">
            <Form.Item
              name="category_limit"
              label="Valor do teto para este mês"
              rules={[{ required: true, message: "Por favor, insira um valor" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={(value) => value!.replace(/R\$\s?|\./g, "").replace(",", ".")}
                placeholder="R$ 0,00"
              />
            </Form.Item>

            <Form.Item name="keep_future" valuePropName="checked">
              <Checkbox>Manter este mesmo teto para os próximos meses</Checkbox>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Filtrar tetos"
          open={isFilterModalOpen}
          onOk={handleApplyFilters}
          onCancel={() => setIsFilterModalOpen(false)}
          okText="Aplicar"
          cancelText="Cancelar"
          centered
        >
          <Form form={filterForm} layout="vertical" initialValues={{ mode: filters.mode }}>
            <Form.Item name="mode" label="Modo de filtro" rules={[{ required: true, message: "Selecione um modo" }]}>
              <Select
                options={[
                  { value: "month", label: "Meses e anos" },
                  { value: "custom", label: "Intervalo personalizado" },
                ]}
              />
            </Form.Item>

            {selectedMode === "custom" ? (
              <>
                <div className={styles.filterFieldsRow}>
                  <Form.Item name="custom_month_start" label="Mês inicial" rules={[{ required: true, message: "Selecione o mês inicial" }]}>
                    <Select options={MONTH_OPTIONS} />
                  </Form.Item>
                  <Form.Item name="custom_year_start" label="Ano inicial" rules={[{ required: true, message: "Selecione o ano inicial" }]}>
                    <Select options={yearOptions} />
                  </Form.Item>
                </div>
                <div className={styles.filterFieldsRow}>
                  <Form.Item name="custom_month_end" label="Mês final" rules={[{ required: true, message: "Selecione o mês final" }]}>
                    <Select options={MONTH_OPTIONS} />
                  </Form.Item>
                  <Form.Item name="custom_year_end" label="Ano final" rules={[{ required: true, message: "Selecione o ano final" }]}>
                    <Select options={yearOptions} />
                  </Form.Item>
                </div>
              </>
            ) : (
              <div className={styles.filterFieldsRow}>
                <Form.Item name="months" label="Meses" rules={[{ validator: validateMonthYearPair }]}>
                  <Select
                    mode="multiple"
                    allowClear
                    maxTagCount="responsive"
                    options={MONTH_OPTIONS}
                    placeholder="Selecione os meses"
                  />
                </Form.Item>
                <Form.Item name="years" label="Anos" rules={[{ validator: validateMonthYearPair }]}>
                  <Select
                    mode="multiple"
                    allowClear
                    maxTagCount="responsive"
                    options={yearOptions}
                    placeholder="Selecione os anos"
                  />
                </Form.Item>
              </div>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default CategoriesPage;
