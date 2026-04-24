"use client";

import { useMemo, useState } from "react";
import { Button, DatePicker, Form, Modal, Select, Segmented, Input, ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import dayjs, { Dayjs } from "dayjs";
import { request } from "@/service/api";
import { CalendarOutlined } from "@ant-design/icons";
import styles from "../EnterTransaction/entertransaction.module.scss";

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

export type OutputFilterMode = "month" | "custom";

export type OutputFilters = {
  mode: OutputFilterMode;
  month: number;
  year: number;
  dateFrom: string | null;
  dateTo: string | null;
  category_id?: number;
  payment_method_id?: number;
  card_id?: number;
  flag_id?: number;
};

type FilterFormValues = {
  mode: OutputFilterMode;
  month?: number;
  year?: number;
  range?: [Dayjs, Dayjs];
  category_id?: number;
  payment_method_id?: number;
  card_id?: number;
  flag_id?: number;
};

interface OutputTemporalFilterProps {
  filters: OutputFilters;
  onChange: (filters: OutputFilters) => void;
}

export const OutputTemporalFilter = ({ filters, onChange }: OutputTemporalFilterProps) => {
  const now = new Date();
  const [form] = Form.useForm<FilterFormValues>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [availableYears, setYearOptions] = useState<{ value: number; label: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; category_description: string }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ id: number; payment_method_description: string }[]>([]);
  const [cards, setCards] = useState<{ id: number; card_description: string }[]>([]);
  const [flags, setFlags] = useState<{ id: number; flag_description: string }[]>([]);

  const fetchFilterData = async () => {
    try {
      const [yearsRes, catsRes, pmRes, cardsRes, flagsRes] = await Promise.all([
        request({ method: "GET", endpoint: "transaction/years" }),
        request({ method: "GET", endpoint: "categories/type/2" }),
        request({ method: "GET", endpoint: "payment-methods" }),
        request({ method: "GET", endpoint: "cards" }),
        request({ method: "GET", endpoint: "flags" }),
      ]);

      const years = yearsRes.data.data.years || [];
      setYearOptions(years.map((y: number) => ({ value: y, label: String(y) })));
      
      setCategories(catsRes.data?.data?.categories || catsRes.data || []);
      setPaymentMethods(pmRes.data?.data || pmRes.data || []);
      setCards(cardsRes.data?.data?.cards || cardsRes.data || []);
      setFlags(flagsRes.data?.data || flagsRes.data || []);
    } catch (error) {
      console.error("Error fetching filter data", error);
    }
  };

  const openModal = () => {
    fetchFilterData();
    form.setFieldsValue({
      mode: filters.mode,
      month: filters.month,
      year: filters.year,
      category_id: filters.category_id,
      payment_method_id: filters.payment_method_id,
      card_id: filters.card_id,
      flag_id: filters.flag_id,
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
      category_id: values.category_id,
      payment_method_id: values.payment_method_id,
      card_id: values.card_id,
      flag_id: values.flag_id,
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
      onChange({
        mode: "month",
        month: Number(values.month),
        year: Number(values.year),
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
          fontWeight: 600,
          marginTop: 10
        }}
      >
        Filtrar
      </Button>

      <Modal
        title="Filtrar saídas"
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
                <RangePicker format="DD/MM/YYYY" style={{ width: "100%", height: 45 }} />
              </Form.Item>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
                <Form.Item name="month" label="Mês" rules={[{ required: true, message: "Selecione um mês" }]}>
                  <Select options={MONTH_OPTIONS} placeholder="Mês" style={{ height: 45 }} />
                </Form.Item>
                <Form.Item name="year" label="Ano" rules={[{ required: true, message: "Selecione um ano" }]}>
                  <Select options={availableYears} placeholder="Ano" style={{ height: 45 }} />
                </Form.Item>
              </div>
            )}

            <div style={{ marginTop: 24, borderTop: "1px solid #F1F5F9", paddingTop: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
                <Form.Item name="category_id" label="Categoria">
                  <Select
                    placeholder="Todas as categorias"
                    allowClear
                    style={{ height: 45 }}
                    options={categories.map((c) => ({ value: c.id, label: c.category_description }))}
                  />
                </Form.Item>
                <Form.Item name="payment_method_id" label="Método de pagamento">
                  <Select
                    placeholder="Todos os métodos"
                    allowClear
                    style={{ height: 45 }}
                    options={paymentMethods.map((pm) => ({ value: pm.id, label: pm.payment_method_description }))}
                  />
                </Form.Item>
                <Form.Item name="card_id" label="Cartão">
                  <Select
                    placeholder="Todos os cartões"
                    allowClear
                    style={{ height: 45 }}
                    options={cards.map((c) => ({ value: c.id, label: c.card_description }))}
                  />
                </Form.Item>
                <Form.Item name="flag_id" label="Bandeira">
                  <Select
                    placeholder="Todas as bandeiras"
                    allowClear
                    style={{ height: 45 }}
                    options={flags.map((f) => ({ value: f.id, label: f.flag_description }))}
                  />
                </Form.Item>
              </div>
            </div>
          </Form>
        </ConfigProvider>
      </Modal>
    </>
  );
};
