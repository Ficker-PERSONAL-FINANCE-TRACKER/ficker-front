import React from "react";
import { Form, InputNumber, Typography } from "antd";
import styles from "../styles.module.scss";

const { Title, Text } = Typography;

interface GoalStepProps {
  form: any;
}

export const GoalStep: React.FC<GoalStepProps> = ({ form }) => {
  return (
    <div className={styles.stepContent}>
      <Title level={4} className={styles.stepTitle}>Qual é sua meta de gastos?</Title>
      <Text type="secondary" className={styles.stepDescription}>
        Defina quanto você planeja gastar por mês para manter suas finanças sob controle.
      </Text>
      <Form form={form} layout="vertical">
        <Form.Item
          name="planned_spending"
          label="Meta de gastos (R$)"
          rules={[{ required: true, message: "Informe sua meta de gastos" }]}
        >
          <InputNumber
            className={`${styles.inputField} ${styles.numberField}`}
            style={{ width: "100%" }}
            placeholder="Ex: 3000"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value: any) => value?.replace(/\$\s?|(,*)/g, "") as any}
          />
        </Form.Item>
      </Form>
    </div>
  );
};
