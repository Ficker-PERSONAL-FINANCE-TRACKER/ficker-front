"use client";

import { useCallback, useState } from "react";
import { Button, DatePicker, Form, Modal, Select, Segmented, Input, ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import dayjs, { Dayjs } from "dayjs";
import { request } from "@/service/api";
import { CalendarOutlined } from "@ant-design/icons";
import styles from "../../EnterTransaction/entertransaction.module.scss";

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

export type CardDetailFilterMode = "month" | "custom";

export type CardDetailFilters = {
  mode: CardDetailFilterMode;
  month: number | null;
  year: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  category_id?: number;
  category_name?: string;
};

type FilterFormValues = {
  mode: CardDetailFilterMode;
  month?: number;
  year?: number;
  range?: [Dayjs, Dayjs];
  category?: { value: number; label: string };
};

interface CardDetailFilterProps {
  filters: CardDetailFilters;
  onChange: (filters: CardDetailFilters) => void;
}

export const CardDetailFilter = ({ filters, onChange }: CardDetailFilterProps) => {
  const now = new Date();
  const [form] = Form.useForm<FilterFormValues>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [availableYears, setYearOptions] = useState<{ value: number; label: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; category_description: string }[]>([]);

  const validateMonthYearPair = () => {
    const month = form.getFieldValue("month");
    const year = form.getFieldValue("year");

    if ((month && !year) || (!month && year)) {
      return Promise.reject(new Error("Informe mês e ano ou deixe ambos vazios"));
    }

    return Promise.resolve();
  };

  const fetchFilterData = async () => {
    try {
      const [yearsRes, catsRes] = await Promise.all([
        request({ method: "GET", endpoint: "transaction/years" }),
        request({ method: "GET", endpoint: "categories/type/2" }), // Type 2 is usually for Expenses/Card Purchases
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
      month: filters.month ?? undefined,
      year: filters.year ?? undefined,
      category:
        filters.category_id && filters.category_name
          ? { value: filters.category_id, label: filters.category_name }
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
      category_id: values.category?.value,
      category_name: values.category?.label,
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
      const hasMonthYear = Boolean(values.month && values.year);

      onChange({
        mode: "month",
        month: hasMonthYear ? Number(values.month) : null,
        year: hasMonthYear ? Number(values.year) : null,
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
        }}
      >
        Filtrar
      </Button>

      <Modal
        title="Filtrar transações do cartão"
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
                format="DD/MM/YYYY"
                style={{ width: "100%", height: 45 }}
              />
              </Form.Item>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
                <Form.Item name="month" label="Mês" dependencies={["year"]} rules={[{ validator: validateMonthYearPair }]}>
                  <Select allowClear options={MONTH_OPTIONS} placeholder="Todos os meses" style={{ height: 45 }} />
                </Form.Item>
                <Form.Item name="year" label="Ano" dependencies={["month"]} rules={[{ validator: validateMonthYearPair }]}>
                  <Select allowClear options={availableYears} placeholder="Todos os anos" style={{ height: 45 }} />
                </Form.Item>
              </div>
            )}

            <div style={{ marginTop: 24, borderTop: "1px solid #F1F5F9", paddingTop: 24 }}>
              <Form.Item name="category" label="Categoria">
                <Select
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
