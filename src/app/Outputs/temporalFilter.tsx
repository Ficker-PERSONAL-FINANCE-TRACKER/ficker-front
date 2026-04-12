"use client";

import { useMemo, useState } from "react";
import { DatePicker, Form, Modal, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import styles from "../EnterTransaction/entertransaction.module.scss";

const { RangePicker } = DatePicker;

const MONTH_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Marco" },
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

  const yearOptions = useMemo(
    () => Array.from({ length: 7 }, (_, index) => now.getFullYear() - 3 + index).map((year) => ({
      value: year,
      label: String(year),
    })),
    [now]
  );

  const openModal = () => {
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
      <button
        onClick={openModal}
        className={styles.button}
        type="button"
        style={{
          width: "fit-content",
          minWidth: "unset",
          marginTop: 10,
          paddingInline: 18,
          whiteSpace: "nowrap",
          flex: "0 0 auto",
        }}
      >
        Filtrar
      </button>

      <Modal
        title="Filtrar saidas"
        open={isModalOpen}
        onOk={handleApply}
        onCancel={() => setIsModalOpen(false)}
        okText="Aplicar"
        cancelText="Cancelar"
        centered
      >
        <Form form={form} layout="vertical" initialValues={{ mode: filters.mode }}>
          <Form.Item name="mode" label="Modo de filtro" rules={[{ required: true, message: "Selecione um modo" }]}>
            <Select
              options={[
                { value: "month", label: "Mes especifico" },
                { value: "custom", label: "Intervalo personalizado" },
              ]}
            />
          </Form.Item>

          {selectedMode === "custom" ? (
            <Form.Item
              name="range"
              label="Periodo"
              rules={[{ required: true, message: "Selecione um intervalo" }]}
            >
              <RangePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              <Form.Item name="month" label="Mes" rules={[{ required: true, message: "Selecione um mes" }]}>
                <Select options={MONTH_OPTIONS} />
              </Form.Item>
              <Form.Item name="year" label="Ano" rules={[{ required: true, message: "Selecione um ano" }]}>
                <Select options={yearOptions} />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
};
