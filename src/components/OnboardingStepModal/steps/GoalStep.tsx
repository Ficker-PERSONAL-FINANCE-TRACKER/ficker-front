import React from "react";
import { Form, InputNumber, Typography } from "antd";
import { currencyFormatter, currencyParser } from "@/utils/currencyFormatter";
import styles from "../styles.module.scss";
import { GlobalErrorList } from "./GlobalErrorList";

const { Title, Text } = Typography;

interface GoalStepProps {
  form: any;
}

export const GoalStep: React.FC<GoalStepProps> = ({ form }) => {
  return (
    <div className={styles.stepContent}>
      <Title level={4} className={styles.stepTitle}>Qual é seu teto de gastos?</Title>
      <Text type="secondary" className={styles.stepDescription}>
        Defina quanto você planeja gastar por mês para manter suas finanças sob controle.
      </Text>
      <Form form={form} layout="vertical" className={styles.hideFieldErrors}>
        <Form.Item
          name="planned_spending"
          label="Teto de gastos (R$)"
          rules={[{ required: true, message: "Informe seu teto de gastos" }]}
        >
          <InputNumber<number>
            className={styles.inputField}
            style={{ width: "100%" }}
            placeholder="Ex: 3000"
            min={0.01}
            precision={2}
            decimalSeparator=","
            formatter={currencyFormatter}
            parser={currencyParser}
          />
        </Form.Item>
        <GlobalErrorList form={form} />
      </Form>
    </div>
  );
};
