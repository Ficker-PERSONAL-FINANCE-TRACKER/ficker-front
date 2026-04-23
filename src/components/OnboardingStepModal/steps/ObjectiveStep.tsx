import React from "react";
import { Form, Input, InputNumber, Typography, Select } from "antd";
import styles from "../styles.module.scss";

const { Title, Text } = Typography;

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
      <Form form={form} layout="vertical">
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
            <InputNumber
              className={`${styles.inputField} ${styles.numberField}`}
              style={{ width: "100%" }}
              placeholder="Ex: 20000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value: any) => value?.replace(/\$\s?|(,*)/g, "") as any}
            />
          </Form.Item>
          <Form.Item
            name="current_saved"
            label="Valor ja guardado"
            style={{ flex: 1 }}
          >
            <InputNumber
              className={`${styles.inputField} ${styles.numberField}`}
              style={{ width: "100%" }}
              placeholder="Ex: 10000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value: any) => value?.replace(/\$\s?|(,*)/g, "") as any}
            />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item
            name="target_month"
            label="Mes final do objetivo"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Informe o mes final" }]}
          >
            <Select options={MONTH_OPTIONS} placeholder="Selecione o mes" className={styles.inputField} />
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
      </Form>
    </div>
  );
};
