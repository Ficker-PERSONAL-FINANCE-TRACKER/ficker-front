"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button, DatePicker, Form, Modal, Select, Segmented, Input } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { CalendarOutlined } from "@ant-design/icons";
import { request } from "@/service/api";
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
  month: number | null;
  months?: number[];
  year: number | null;
  years?: number[];
  dateFrom: string | null;
  dateTo: string | null;
};

type FilterFormValues = {
  mode: ResumeFilterMode;
  months?: number[];
  years?: number[];
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
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const yearOptions = useMemo(
    () => availableYears.map((year) => ({ value: year, label: String(year) })),
    [availableYears]
  );

  const disabledDate = useCallback(
    (current: Dayjs) => {
      if (!availableYears.length) return false;
      return !availableYears.includes(current.year());
    },
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

  const fetchYears = async () => {
    try {
      const res = await request({ method: "GET", endpoint: "transaction/years" });
      setAvailableYears(res?.data?.data?.years ?? []);
    } catch {
      setAvailableYears([]);
    }
  };

  const openModal = () => {
    fetchYears();
    form.setFieldsValue({
      mode: filters.mode,
      months: filters.months ?? (filters.month ? [filters.month] : undefined),
      years: filters.years ?? (filters.year ? [filters.year] : undefined),
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
        months: undefined,
        year: now.getFullYear(),
        years: undefined,
        dateFrom: values.range[0].startOf("day").format("YYYY-MM-DD"),
        dateTo: values.range[1].endOf("day").format("YYYY-MM-DD"),
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
      });
    }

    closeModal();
  };

  const selectedMode = Form.useWatch("mode", form) ?? filters.mode;

  return (
    <>
      <Button
        className={styles.filterButton}
        onClick={openModal}
        ref={triggerRef}
        icon={<CalendarOutlined />}
      >
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
              label="Intervalo de Datas"
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
                <Select mode="multiple" allowClear options={yearOptions} placeholder="Todos os anos" style={{ minHeight: 45 }} />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
};
