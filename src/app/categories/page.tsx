"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Progress, Button, Modal, Form, InputNumber, message, Card, Empty, Spin, Checkbox, Select } from "antd";
import CustomMenu from "@/components/CustomMenu";
import { request } from "@/service/api";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  EditOutlined,
  DollarOutlined,
  RocketOutlined,
  WalletOutlined,
  StarOutlined,
  RestOutlined,
  HomeOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  CoffeeOutlined,
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

type CategoryBase = {
  id: number;
  type_id?: number;
  category_description: string;
};

type CategoryMonthData = {
  id: number;
  type_id?: number;
  category_description: string;
  category_spending: number;
  category_real_spending?: number;
  category_limit?: number;
};

type AnalysisCategory = {
  category_id: number;
  category_description: string;
  real_spending_total: number;
  credit_card_purchase_total?: number;
  expense_composition_total?: number;
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

const buildAnalysisQueryString = (filters: CategoryFilters) => {
  const params = new URLSearchParams();

  if (
    filters.mode === "custom" &&
    filters.customMonthStart &&
    filters.customYearStart &&
    filters.customMonthEnd &&
    filters.customYearEnd
  ) {
    params.set("date_from", dayjs().year(filters.customYearStart).month(filters.customMonthStart - 1).startOf("month").format("YYYY-MM-DD"));
    params.set("date_to", dayjs().year(filters.customYearEnd).month(filters.customMonthEnd - 1).endOf("month").format("YYYY-MM-DD"));
  } else {
    params.set("month", String(filters.month));
    params.set("year", String(filters.year));
  }

  params.set("type_id", "2");
  return params.toString();
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

  const isMonthMode = filters.mode === "month";

  const getCategoryIcon = (description: string) => {
    const desc = description?.toLowerCase() || "";
    if (desc.includes("salário")) return { icon: <DollarOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (desc.includes("freelance")) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (desc.includes("investimentos")) return { icon: <WalletOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (desc.includes("renda extra")) return { icon: <StarOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (desc.includes("alimentação")) return { icon: <RestOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (desc.includes("casa")) return { icon: <HomeOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (desc.includes("transporte")) return { icon: <CarOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (desc.includes("saúde")) return { icon: <MedicineBoxOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (desc.includes("lazer")) return { icon: <CoffeeOutlined />, color: "#FF754C", bg: "#FFEBE6" };
    if (desc.includes("contas")) return { icon: <ThunderboltOutlined />, color: "#FFD700", bg: "#FFFBE6" };
    if (desc.includes("internet")) return { icon: <WifiOutlined />, color: "#8E82EF", bg: "#F5F3FF" };
    if (desc.includes("compras")) return { icon: <ShoppingOutlined />, color: "#FF4D4F", bg: "#FFF1F0" };
    return { icon: <TagsOutlined />, color: "#808191", bg: "#F8FAFC" };
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const analysisQueryString = buildAnalysisQueryString(filters);
      const coveredMonths = getCoveredMonths(filters);

      const [categoryTypesResponse, analysisCategoriesResponse, ...monthlyCategoriesResponses] = await Promise.all([
        request({ method: "GET", endpoint: "categories/type/2" }),
        request({ method: "GET", endpoint: `analysis/categories?${analysisQueryString}` }),
        ...coveredMonths.map(({ month, year }) => request({ method: "GET", endpoint: `categories?month=${month}&year=${year}` })),
      ]);

      const baseCategories = ((categoryTypesResponse.data ?? []) as CategoryBase[]).filter((category) => Number(category.type_id) === 2);
      const analysisCategories = (analysisCategoriesResponse.data?.data?.categories ?? []) as AnalysisCategory[];

      const spendingByCategory = analysisCategories.reduce<Record<number, number>>((acc, category) => {
        acc[category.category_id] = Number(
          category.expense_composition_total ?? (Number(category.real_spending_total || 0) + Number(category.credit_card_purchase_total || 0))
        );
        return acc;
      }, {});

      const limitByCategory = monthlyCategoriesResponses.reduce<Record<number, number>>((acc, response) => {
        const monthCategories = (response.data?.data?.categories ?? []) as CategoryMonthData[];

        monthCategories
          .filter((category) => Number(category.type_id) === 2)
          .forEach((category) => {
            acc[category.id] = Number(acc[category.id] || 0) + Number(category.category_limit || 0);
          });

        return acc;
      }, {});

      const mergedCategories = baseCategories
        .map((category) => ({
          id: category.id,
          category_description: category.category_description,
          category_limit: Number(limitByCategory[category.id] || 0),
          category_total_spending: Number(spendingByCategory[category.id] || 0),
        }))
        .sort((a, b) => b.category_total_spending - a.category_total_spending || a.category_description.localeCompare(b.category_description, "pt-BR"));

      setCategories(mergedCategories);
    } catch (error) {
      message.error("Erro ao carregar categorias");
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

      message.success(`Meta para ${selectedCategory.category_description} atualizada para ${currentMonthLabel.toLowerCase()}!`);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error("Erro ao salvar meta");
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

    setIsFilterModalOpen(false);
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
            <h2 className={styles.pageTitle}>Meta de Gastos</h2>
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
            <Button className={styles.filterButton} onClick={openFilterModal}>
              Filtrar
            </Button>
          </div>
        </div>

        <div className={styles.contentArea}>
          {loading ? (
            <div className={styles.loadingArea}><Spin size="large" /></div>
          ) : categories.length === 0 ? (
            <Empty description="Nenhuma categoria encontrada" />
          ) : (
            <Row gutter={[24, 24]}>
              {categories.map((category) => {
                const { icon, color, bg } = getCategoryIcon(category.category_description);
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
                              {limit > 0 ? `Meta acumulada: ${formatCurrency(limit)}` : "Meta acumulada: nao definida"}
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
          )}
        </div>

        <Modal
          title={`Definir Meta para ${selectedCategory?.category_description}`}
          open={isModalOpen}
          onOk={handleSaveLimit}
          onCancel={() => setIsModalOpen(false)}
          okText="Salvar Meta"
          cancelText="Cancelar"
          centered
          okButtonProps={{ style: { background: "#6C5DD3" } }}
        >
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#808191", fontSize: 13 }}>
              Defina o valor maximo que voce planeja gastar com <strong>{selectedCategory?.category_description}</strong> em {currentMonthLabel.toLowerCase()} de {filters.year}.
            </p>
          </div>
          <Form form={form} layout="vertical">
            <Form.Item
              name="category_limit"
              label="Valor da Meta para este mês"
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
              <Checkbox>Manter esta mesma meta para os proximos meses</Checkbox>
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
