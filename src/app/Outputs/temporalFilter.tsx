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
};

type FilterFormValues = {
  mode: OutputFilterMode;
  month?: number;
  year?: number;
  range?: [Dayjs, Dayjs];
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

  const fetchAvailableYears = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "transaction/years",
      });
      const years = response.data.data.years || [];
      const options = years.map((y: number) => ({ value: y, label: String(y) }));
      setYearOptions(options.length > 0 ? options : [{ value: now.getFullYear(), label: String(now.getFullYear()) }]);
    } catch (error) {
      setYearOptions([{ value: now.getFullYear(), label: String(now.getFullYear()) }]);
    }
  };

  const openModal = () => {
    fetchAvailableYears();
    form.setFieldsValue({
      mode: filters.mode,
      month: filters.month,
      year: filters.year,
      range:
        filters.mode === "custom" && filters.dateFrom && filters.dateTo
          ? [dayjs(filters.dateFrom), dayjs(filters.dateTo)]
          : undefined,
    });
    setIsModalOpen(true);
  };

  const handleApply = async () => {
    const values = await form.validateFields();

    if (values.mode === "custom" && values.range) {
      onChange({
        mode: "custom",
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        dateFrom: values.range[0].startOf("day").format("YYYY-MM-DD"),
        dateTo: values.range[1].endOf("day").format("YYYY-MM-DD"),
      });
    } else {
      onChange({
        mode: "month",
        month: Number(values.month),
        year: Number(values.year),
        dateFrom: null,
        dateTo: null,
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
          </Form>
        </ConfigProvider>
      </Modal>
    </>
  );
};
