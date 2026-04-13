"use client";

import { useMemo, useRef, useState } from "react";
import { Button, DatePicker, Form, Modal, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import styles from "./resume.module.scss";

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

export type ResumeFilterMode = "month" | "custom";

export type ResumeFilters = {
  mode: ResumeFilterMode;
  month: number;
  year: number;
  dateFrom: string | null;
  dateTo: string | null;
};

type FilterFormValues = {
  mode: ResumeFilterMode;
  month?: number;
  year?: number;
  range?: [Dayjs, Dayjs];
};

interface ResumeTemporalFilterProps {
  filters: ResumeFilters;
  onChange: (filters: ResumeFilters) => void;
}

export const ResumeTemporalFilter = ({ filters, onChange }: ResumeTemporalFilterProps) => {
  const now = new Date();
  const [form] = Form.useForm<FilterFormValues>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => now.getFullYear() - 3 + index).map((year) => ({
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

  const closeModal = () => {
    setIsModalOpen(false);
    triggerRef.current?.blur();
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

    closeModal();
  };

  const selectedMode = Form.useWatch("mode", form) ?? filters.mode;

  return (
    <>
      <Button className={styles.filterButton} onClick={openModal} ref={triggerRef}>
        Filtrar
      </Button>

      <Modal
        title="Filtrar início"
        open={isModalOpen}
        onOk={handleApply}
        onCancel={closeModal}
        focusTriggerAfterClose={false}
        okText="Aplicar"
        cancelText="Cancelar"
        centered
      >
        <Form form={form} layout="vertical" initialValues={{ mode: filters.mode }}>
          <Form.Item name="mode" label="Modo de filtro" rules={[{ required: true, message: "Selecione um modo" }]}>
            <Select
              options={[
                { value: "month", label: "Mês específico" },
                { value: "custom", label: "Intervalo personalizado" },
              ]}
            />
          </Form.Item>

          {selectedMode === "custom" ? (
            <Form.Item
              name="range"
              label="Período"
              rules={[{ required: true, message: "Selecione um intervalo" }]}
            >
              <RangePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
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
    </>
  );
};
