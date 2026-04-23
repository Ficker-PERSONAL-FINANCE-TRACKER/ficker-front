import React from "react";
import { Form, InputNumber, Input, Typography, DatePicker, Select, Space, Checkbox } from "antd";
import { PlusOutlined, WalletOutlined, RocketOutlined, DollarOutlined, StarOutlined } from "@ant-design/icons";
import styles from "../styles.module.scss";

const { Title, Text } = Typography;

interface SalaryStepProps {
  form: any;
  categories: any[];
  showDescriptionCategory: boolean;
  setShowDescriptionCategory: (value: boolean) => void;
}

const SUGGESTED_INCOME_CATEGORIES = [
  { key: "salary", label: "Salário", icon: <DollarOutlined />, color: "#00875A" },
  { key: "freelance", label: "Freelance", icon: <RocketOutlined />, color: "#6C5DD3" },
  { key: "investments", label: "Investimentos", icon: <WalletOutlined />, color: "#FFA940" },
  { key: "extra", label: "Renda Extra", icon: <StarOutlined />, color: "#00B0FF" },
];

export const SalaryStep: React.FC<SalaryStepProps> = ({ form, categories, showDescriptionCategory, setShowDescriptionCategory }) => {
  return (
    <div className={styles.stepContent}>
      <Title level={4} className={styles.stepTitle}>Registre seu Sálario</Title>
      <Form 
        form={form} 
        layout="vertical"
        onValuesChange={(changedValues) => {
          if (Object.prototype.hasOwnProperty.call(changedValues, "category_id")) {
            const nextValue = changedValues.category_id;
            const shouldShowDescription = nextValue === 0;
            setShowDescriptionCategory(shouldShowDescription);

            if (typeof nextValue === "string" && nextValue.startsWith("suggestion:")) {
              form.setFieldsValue({ category_description: nextValue.replace("suggestion:", "") });
            }

            if (!shouldShowDescription && nextValue !== 0) {
              form.setFieldValue("category_description", undefined);
            }
          }
        }}
      >
        <Form.Item
          name="description"
          label="Descricao"
          rules={[{ required: true, message: "Informe a descricao" }]}
        >
          <Input placeholder="Ex: Salario, Saldo inicial..." className={styles.inputField} />
        </Form.Item>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item
            name="date"
            label="Data"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Informe a data" }]}
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              style={{ width: "100%", height: 40, borderRadius: 5 }} 
              placeholder="dd/mm/aaaa"
            />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="Categoria"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Selecione uma categoria" }]}
          >
            <Select 
              placeholder="Selecione ou crie" 
              className={styles.inputField}
            >
              <Select.Option value={0}>
                <Space>
                  <PlusOutlined style={{ color: '#6C5DD3' }} />
                  <span>Nova Categoria</span>
                </Space>
              </Select.Option>

              <Select.OptGroup label="Sugestões">
                {SUGGESTED_INCOME_CATEGORIES.map((cat) => (
                  <Select.Option key={cat.key} value={`suggestion:${cat.label}`}>
                    <Space>
                      <span style={{ color: cat.color }}>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select.OptGroup>

              {categories.length > 0 && (
                <Select.OptGroup label="Minhas Categorias">
                  {categories.map((category) => (
                    <Select.Option key={category.id} value={category.id}>
                      {category.category_description}
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              )}
            </Select>
          </Form.Item>
        </div>

        {showDescriptionCategory && (
          <Form.Item
            name="category_description"
            label="Nome da Categoria"
            rules={[{ required: true, message: "Informe o nome da categoria" }]}
          >
            <Input className={styles.inputField} />
          </Form.Item>
        )}

        <Form.Item
          name="transaction_value"
          label="Valor"
          rules={[{ required: true, message: "Informe o valor" }]}
        >
          <InputNumber
            className={`${styles.inputField} ${styles.numberField}`}
            style={{ width: "100%" }}
            placeholder="R$"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value: any) => value?.replace(/\$\s?|(,*)/g, "") as any}
          />
        </Form.Item>

        <Form.Item
          name="is_recurring"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <Checkbox>Entrada recorrente (Mensal)</Checkbox>
        </Form.Item>
      </Form>
    </div>
  );
};
