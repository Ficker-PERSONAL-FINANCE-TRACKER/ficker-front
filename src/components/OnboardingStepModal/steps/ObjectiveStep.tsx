import React from "react";
import { Form, Input, InputNumber, Typography, Select } from "antd";
import { currencyFormatter, currencyParser } from "@/utils/currencyFormatter";
import styles from "../styles.module.scss";
import { GlobalErrorList } from "./GlobalErrorList";

const { Title } = Typography;

interface ObjectiveStepProps {
  form: any;
  objectivesData?: any[];
  onSkip?: () => void;
}

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

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, index) => ({ value: currentYear + index, label: String(currentYear + index) }));

export const ObjectiveStep: React.FC<ObjectiveStepProps> = ({ form, onSkip }) => {
  return (
    <div className={styles.stepContent}>
      <Title level={4} className={styles.stepTitle}>Defina seu objetivo</Title>
      <Form form={form} layout="vertical" className={styles.hideFieldErrors}>
        <Form.Item
          name="name"
          label="Nome do objetivo"
          rules={[{ required: true, message: "Informe o nome do objetivo" }]}
        >
          <Input placeholder="Exemplo: Comprar um carro" className={styles.inputField} />
        </Form.Item>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item
            name="total_value"
            label="Valor total do objetivo"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Informe o valor total" }]}
          >
            <InputNumber<number>
              className={styles.inputField}
              style={{ width: "100%" }}
              placeholder="Ex: 20000"
              min={0.01}
              precision={2}
              decimalSeparator=","
              formatter={currencyFormatter}
              parser={currencyParser}
            />
          </Form.Item>
          <Form.Item
            name="current_saved"
            label="Valor já guardado"
            style={{ flex: 1 }}
          >
            <InputNumber<number>
              className={styles.inputField}
              style={{ width: "100%" }}
              placeholder="Ex: 10000"
              min={0}
              precision={2}
              decimalSeparator=","
              formatter={currencyFormatter}
              parser={currencyParser}
            />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item
            name="target_month"
            label="Mês final do objetivo"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Informe o mês final" }]}
          >
            <Select options={MONTH_OPTIONS} placeholder="Selecione o mês" className={styles.inputField} />
          </Form.Item>
          <Form.Item
            name="target_year"
            label="Ano final do objetivo"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Informe o ano final" }]}
          >
            <Select options={YEAR_OPTIONS} placeholder="Selecione o ano" className={styles.inputField} />
          </Form.Item>
        </div>
        <GlobalErrorList form={form} />
      </Form>
    </div>
  );
};
