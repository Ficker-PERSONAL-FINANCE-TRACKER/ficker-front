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
  month: number;
  year: number;
  customMonthStart: number | null;
  customYearStart: number | null;
  customMonthEnd: number | null;
  customYearEnd: number | null;
};

type FilterFormValues = {
  mode: FilterMode;
  month?: number;
  year?: number;
  custom_month_start?: number;
  custom_year_start?: number;
  custom_month_end?: number;
  custom_year_end?: number;
};

const getCoveredMonths = (filters: CategoryFilters) => {
  const start = filters.mode === "custom" && filters.customMonthStart && filters.customYearStart
    ? dayjs().year(filters.customYearStart).month(filters.customMonthStart - 1).startOf("month")
    : dayjs().year(filters.year).month(filters.month - 1).startOf("month");
  const end = filters.mode === "custom" && filters.customMonthEnd && filters.customYearEnd
    ? dayjs().year(filters.customYearEnd).month(filters.customMonthEnd - 1).startOf("month")
    : dayjs().year(filters.year).month(filters.month - 1).startOf("month");
  const months: Array<{ month: number; year: number }> = [];

  let cursor = start.clone();
  while (cursor.isBefore(end) || cursor.isSame(end, "month")) {
    months.push({ month: cursor.month() + 1, year: cursor.year() });
    cursor = cursor.add(1, "month");
  }

  return months;
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
    customMonthStart: null,
    customYearStart: null,
    customMonthEnd: null,
    customYearEnd: null,
  });
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm<FilterFormValues>();

  const yearOptions = useMemo(
    () => Array.from({ length: 7 }, (_, index) => now.getFullYear() - 3 + index).map((year) => ({ value: year, label: String(year) })),
    [now]
  );

  const currentMonthLabel = MONTH_OPTIONS.find((option) => option.value === filters.month)?.label ?? "Período";
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

    return `${currentMonthLabel} de ${filters.year}`;
  }, [currentMonthLabel, filters]);

  const appliedFiltersLabels = useMemo(() => {
    const labels: string[] = [];
    const isDefaultMonth = filters.mode === "month" && filters.month === (now.getMonth() + 1) && filters.year === now.getFullYear();

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
      labels.push(`Mês: ${currentMonthLabel}`);
      labels.push(`Ano: ${filters.year}`);
    }

    return labels;
  }, [currentMonthLabel, filters, now]);

  const isMonthMode = filters.mode === "month";
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
      const coveredMonths = getCoveredMonths(filters);
      const timestamp = Date.now();
      
      const monthlyCategoriesResults = await Promise.allSettled(
        coveredMonths.map(({ month, year }) => 
          request({ method: "GET", endpoint: `categories?month=${month}&year=${year}&t=${timestamp}` })
        )
      );

      const aggregatedData: Record<number, { 
        id: number; 
        category_description: string; 
        limit: number; 
        spending: number;
        type_id?: number;
      }> = {};

      monthlyCategoriesResults.forEach((result) => {
        if (result.status !== "fulfilled") return;
        const monthCategories = (result.value.data?.data?.categories ?? []) as CategoryMonthData[];

        monthCategories.forEach((cat) => {
          if (!aggregatedData[cat.id]) {
            aggregatedData[cat.id] = {
              id: cat.id,
              category_description: cat.category_description,
              limit: 0,
              spending: 0,
              type_id: cat.type_id
            };
          }
          aggregatedData[cat.id].limit += Number(cat.category_limit || 0);
          aggregatedData[cat.id].spending += Number(cat.category_spending || cat.category_real_spending || 0);
        });
      });

      const mergedCategories = Object.values(aggregatedData)
        .filter((cat) => Number(cat.type_id) === 2)
        .map((cat) => ({
          id: cat.id,
          category_description: cat.category_description,
          category_limit: cat.limit,
          category_total_spending: cat.spending,
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
    if (!isMonthMode) {
      message.info("A edição de meta fica disponível no filtro por mês.");
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
          month: filters.month,
          year: filters.year,
        },
      });

      message.success(
        `Meta para ${selectedCategory.category_description} atualizada com sucesso!`
      );
      setIsModalOpen(false);
      await fetchData();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  };

  const openFilterModal = () => {
    filterForm.setFieldsValue({
      mode: filters.mode,
      month: filters.month,
      year: filters.year,
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
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        customMonthStart: Number(values.custom_month_start),
        customYearStart: Number(values.custom_year_start),
        customMonthEnd: Number(values.custom_month_end),
        customYearEnd: Number(values.custom_year_end),
      });
    } else {
      setFilters({
        mode: "month",
        month: Number(values.month),
        year: Number(values.year),
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

  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh", background: "#F8FAFC" }}>
      <CustomMenu />
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Meta de gastos</h2>
            <p className={styles.pageSubtitle}>
              A meta total por categoria soma as metas mensais existentes nos meses cobertos pelo filtro.
            </p>
          </div>
          <div className={styles.headerActions}>
            {!isMonthMode ? (
              <span className={styles.helperText}>
                Edição de metas disponível apenas no filtro por mês.
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
                              {limit > 0 ? `Meta acumulada: ${formatCurrency(limit)}` : "Meta acumulada: não definida"}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditLimit(category)}
                          disabled={!isMonthMode}
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
                        {limit > 0 ? `${percent}% consumido` : spending > 0 ? "Sem meta acumulada para o período" : "Sem uso no período"}
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
          title={`Definir meta para ${selectedCategory?.category_description}`}
          open={isModalOpen}
          onOk={handleSaveLimit}
          onCancel={() => setIsModalOpen(false)}
          okText="Salvar meta"
          cancelText="Cancelar"
          centered
          okButtonProps={{ style: { background: "#6C5DD3" } }}
        >
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#808191", fontSize: 13 }}>
              Defina o valor máximo que você planeja gastar com <strong>{selectedCategory?.category_description}</strong> em {currentMonthLabel.toLowerCase()} de {filters.year}.
            </p>
          </div>
          <Form form={form} layout="vertical">
            <Form.Item
              name="category_limit"
              label="Valor da meta para este mês"
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
              <Checkbox>Manter esta mesma meta para os próximos meses</Checkbox>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Filtrar metas"
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
                  { value: "month", label: "Mês específico" },
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
                <Form.Item name="month" label="Mês" rules={[{ required: true, message: "Selecione um mês" }]}>
                  <Select options={MONTH_OPTIONS} />
                </Form.Item>
                <Form.Item name="year" label="Ano" rules={[{ required: true, message: "Selecione um ano" }]}>
                  <Select options={yearOptions} />
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
