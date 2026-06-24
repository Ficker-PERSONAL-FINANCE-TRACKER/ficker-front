"use client";

import { useCallback, useMemo, useState } from "react";
import { Button, DatePicker, Form, Modal, Select, Segmented, Input, ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import dayjs, { Dayjs } from "dayjs";
import { request } from "@/service/api";
import { CalendarOutlined } from "@ant-design/icons";
import styles from "./entertransaction.module.scss";

const { RangePicker } = DatePicker;

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

export type IncomeFilterMode = "month" | "custom";

export type IncomeFilters = {
  mode: IncomeFilterMode;
  month: number | null;
  months?: number[];
  year: number | null;
  years?: number[];
  dateFrom: string | null;
  dateTo: string | null;
  category_id?: number;
  category_name?: string;
  category_ids?: number[];
  category_names?: string[];
};

type FilterFormValues = {
  mode: IncomeFilterMode;
  months?: number[];
  years?: number[];
  range?: [Dayjs, Dayjs];
  categories?: { value: number; label: string }[];
};

interface EnterTemporalFilterProps {
  filters: IncomeFilters;
  onChange: (filters: IncomeFilters) => void;
}

export const EnterTemporalFilter = ({ filters, onChange }: EnterTemporalFilterProps) => {
  const now = new Date();
  const [form] = Form.useForm<FilterFormValues>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [availableYears, setYearOptions] = useState<{ value: number; label: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; category_description: string }[]>([]);

  const availableYearNumbers = availableYears.map((y) => y.value);

  const disabledDate = useCallback(
    (current: Dayjs) => {
      if (!availableYearNumbers.length) return false;
      return !availableYearNumbers.includes(current.year());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availableYears]
  );

  const validateMonthYearPair = () => {
    const months = form.getFieldValue("months");
    const years = form.getFieldValue("years");
    const hasMonths = Array.isArray(months) && months.length > 0;
    const hasYears = Array.isArray(years) && years.length > 0;

    if ((hasMonths && !hasYears) || (!hasMonths && hasYears)) {
      return Promise.reject(new Error("Informe mês e ano ou deixe ambos vazios"));
    }

    return Promise.resolve();
  };

  const fetchFilterData = async () => {
    try {
      const [yearsRes, catsRes] = await Promise.all([
        request({ method: "GET", endpoint: "transaction/years" }),
        request({ method: "GET", endpoint: "categories/type/1" }),
      ]);

      const years = yearsRes?.data?.data?.years ?? [];
      setYearOptions(years.map((y: number) => ({ value: y, label: String(y) })));

      setCategories(catsRes?.data?.data?.categories ?? []);
    } catch (error) {
      console.error("Error fetching filter data", error);
    }
  };

  const openModal = () => {
    fetchFilterData();
    form.setFieldsValue({
      mode: filters.mode,
      months: filters.months ?? (filters.month ? [filters.month] : undefined),
      years: filters.years ?? (filters.year ? [filters.year] : undefined),
      categories:
        filters.category_ids && filters.category_names
          ? filters.category_ids.map((id, index) => ({ value: id, label: filters.category_names?.[index] ?? String(id) }))
          : filters.category_id && filters.category_name
            ? [{ value: filters.category_id, label: filters.category_name }]
            : undefined,
      range:
        filters.mode === "custom" && filters.dateFrom && filters.dateTo
          ? [dayjs(filters.dateFrom), dayjs(filters.dateTo)]
          : undefined,
    });
    setIsModalOpen(true);
  };

  const handleApply = async () => {
    const values = await form.validateFields();

    const commonFilters = {
      category_ids: values.categories?.map((category) => category.value),
      category_names: values.categories?.map((category) => category.label),
    };

    if (values.mode === "custom" && values.range) {
      onChange({
        mode: "custom",
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        dateFrom: values.range[0].startOf("day").format("YYYY-MM-DD"),
        dateTo: values.range[1].endOf("day").format("YYYY-MM-DD"),
        ...commonFilters,
      });
    } else {
      const hasMonthYear = Boolean(values.months?.length && values.years?.length);

      onChange({
        mode: "month",
        month: null,
        months: hasMonthYear ? values.months?.map(Number) : undefined,
        year: null,
        years: hasMonthYear ? values.years?.map(Number) : undefined,
        dateFrom: null,
        dateTo: null,
        ...commonFilters,
      });
    }

    setIsModalOpen(false);
  };

  const selectedMode = Form.useWatch("mode", form) ?? filters.mode;

  return (
    <>
      <Button
        onClick={openModal}
        className={styles.filterButton}
        icon={<CalendarOutlined />}
        style={{
          width: "fit-content",
          height: 40,
          borderRadius: 8,
          background: "#6C5DD3",
          color: "#fff",
          border: "none",
          marginTop: 10,
        }}
      >
        Filtrar
      </Button>

      <Modal
        title="Filtrar entradas"
        open={isModalOpen}
        onOk={handleApply}
        onCancel={() => setIsModalOpen(false)}
        okText="Aplicar"
        cancelText="Cancelar"
        centered
      >
        <ConfigProvider locale={ptBR}>
          <Form form={form} layout="vertical" initialValues={{ mode: filters.mode }}>
            <div style={{ marginBottom: 20 }}>
              <Segmented
                block
                value={selectedMode}
                onChange={(value) => form.setFieldValue("mode", value)}
                options={[
                  { value: "month", label: "Mês" },
                  { value: "custom", label: "Período" },
                ]}
                style={{ background: "#F8FAFC", borderRadius: 10, padding: 4 }}
              />
            </div>

            <Form.Item name="mode" hidden>
              <Input />
            </Form.Item>

            {selectedMode === "custom" ? (
              <Form.Item
                name="range"
                label="Intervalo de datas"
                rules={[{ required: true, message: "Selecione um intervalo" }]}
              >
                <RangePicker
                format={["DD/MM/YYYY", "DDMMYYYY", "DD-MM-YYYY"]}
                style={{ width: "100%", height: 45 }}
                disabledDate={disabledDate}
              />
              </Form.Item>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
                <Form.Item name="months" label="Mês" dependencies={["years"]} rules={[{ validator: validateMonthYearPair }]}>
                  <Select mode="multiple" allowClear options={MONTH_OPTIONS} placeholder="Todos os meses" style={{ minHeight: 45 }} />
                </Form.Item>
                <Form.Item name="years" label="Ano" dependencies={["months"]} rules={[{ validator: validateMonthYearPair }]}>
                  <Select mode="multiple" allowClear options={availableYears} placeholder="Todos os anos" style={{ minHeight: 45 }} />
                </Form.Item>
              </div>
            )}

            <div style={{ marginTop: 24, borderTop: "1px solid #F1F5F9", paddingTop: 24 }}>
              <Form.Item name="categories" label="Categoria">
                <Select
                  mode="multiple"
                  labelInValue
                  placeholder="Todas as categorias"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  style={{ height: 45 }}
                  options={categories.map((c) => ({ value: c.id, label: c.category_description }))}
                />
              </Form.Item>
            </div>
          </Form>
        </ConfigProvider>
      </Modal>
    </>
  );
};
