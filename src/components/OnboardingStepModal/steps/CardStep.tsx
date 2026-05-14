import React from "react";
import { Form, Input, Typography, Select } from "antd";
import styles from "../styles.module.scss";

const { Title } = Typography;

interface CardStepProps {
  form: any;
  cardsData?: any[];
  flags?: any[];
  onSkip?: () => void;
}

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

export const CardStep: React.FC<CardStepProps> = ({ form, flags = [] }) => {
  return (
    <div className={styles.stepContent}>
      <Title level={4} className={styles.stepTitle}>Qual é o seu cartão de crédito?</Title>
      <Form form={form} layout="vertical">
        <Form.Item
          name="flag_id"
          label="Bandeira"
          rules={[{ required: true, message: "Informe a bandeira" }]}
        >
          <Select placeholder="Selecione" className={styles.inputField}>
            {flags.map((flag) => (
              <Select.Option key={flag.id} value={Number(flag.id)}>
                {flag.flag_description}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="card_description"
          label="Descrição"
          rules={[{ required: true, message: "Informe a descrição" }]}
        >
          <Input placeholder="Ex: Cartão Nubank, Cartão Itaú..." className={styles.inputField} />
        </Form.Item>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item
            name="expiration"
            label="Dia de vencimento"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Informe o vencimento" }]}
          >
            <Select placeholder="Dia" className={styles.inputField} options={DAY_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="closure"
            label="Dia de fechamento"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Informe o fechamento" }]}
          >
            <Select placeholder="Dia" className={styles.inputField} options={DAY_OPTIONS} />
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};
