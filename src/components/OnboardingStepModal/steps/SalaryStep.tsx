import React, { useMemo } from "react";
import { Form, InputNumber, Input, Typography, DatePicker, Select, Space, Checkbox, ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import dayjs from "dayjs";
import { PlusOutlined, WalletOutlined, DollarOutlined, HomeOutlined, CarOutlined, MedicineBoxOutlined, RocketOutlined, ShoppingOutlined, CoffeeOutlined, StarOutlined, ThunderboltOutlined, WifiOutlined, ReadOutlined, RestOutlined, TagsOutlined } from "@ant-design/icons";
import { currencyFormatter, currencyParser } from "@/utils/currencyFormatter";
import styles from "../styles.module.scss";
import { GlobalErrorList } from "./GlobalErrorList";

const { Title } = Typography;

interface SalaryStepProps {
  form: any;
  categories: any[];
  showDescriptionCategory: boolean;
  setShowDescriptionCategory: (value: boolean) => void;
}

const SUGGESTED_INCOME_CATEGORIES = [
  { key: "1", label: "Salário", icon: <DollarOutlined />, color: "#00875A" },
  { key: "2", label: "Freelance", icon: <RocketOutlined />, color: "#6C5DD3" },
  { key: "3", label: "Investimentos", icon: <WalletOutlined />, color: "#FFA940" },
  { key: "4", label: "Renda Extra", icon: <StarOutlined />, color: "#00B0FF" },
];

const normalizeCategoryName = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const getCategoryIcon = (category: any) => {
  const id = Number(category?.id);
  const description = category?.category_description?.toLowerCase() || "";
  const normalizedDescription = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (id === 1 || description.includes("salário")) return { icon: <DollarOutlined />, color: "#00875A" };
  if (id === 2 || description.includes("freelance")) return { icon: <RocketOutlined />, color: "#6C5DD3" };
  if (id === 3 || description.includes("investimentos")) return { icon: <WalletOutlined />, color: "#FFA940" };
  if (id === 4 || description.includes("renda extra")) return { icon: <StarOutlined />, color: "#00B0FF" };
  if (normalizedDescription.includes("moradia")) return { icon: <HomeOutlined />, color: "#6C5DD3" };
  if (normalizedDescription.includes("alimentacao")) return { icon: <RestOutlined />, color: "#FF754C" };
  if (normalizedDescription.includes("educacao")) return { icon: <ReadOutlined />, color: "#00B0FF" };
  if (id === 5 || description.includes("transporte")) return { icon: <CarOutlined />, color: "#6C5DD3" };
  if (id === 6 || description.includes("saúde")) return { icon: <MedicineBoxOutlined />, color: "#00875A" };
  if (id === 7 || description.includes("lazer")) return { icon: <CoffeeOutlined />, color: "#FF754C" };
  if (id === 8 || description.includes("contas")) return { icon: <ThunderboltOutlined />, color: "#FFD700" };
  if (id === 9 || description.includes("internet")) return { icon: <WifiOutlined />, color: "#8E82EF" };
  if (id === 10 || description.includes("compras")) return { icon: <ShoppingOutlined />, color: "#FF4D4F" };
  if (id === 11 || description.includes("projetos")) return { icon: <RocketOutlined />, color: "#6C5DD3" };

  return { icon: <TagsOutlined />, color: "#808191" };
};

export const SalaryStep: React.FC<SalaryStepProps> = ({ form, categories, showDescriptionCategory, setShowDescriptionCategory }) => {
  const filteredSuggestions = useMemo(() => {
    return SUGGESTED_INCOME_CATEGORIES.filter(suggestion => {
      return !categories.some(userCat => 
        userCat.id === Number(suggestion.key) || 
        normalizeCategoryName(userCat.category_description) === normalizeCategoryName(suggestion.label)
      );
    });
  }, [categories]);

  return (
    <div className={styles.stepContent}>
      <Title level={4} className={styles.stepTitle}>Registre seu salário</Title>
      <ConfigProvider locale={ptBR}>
        <Form 
          form={form} 
          layout="vertical"
          className={styles.hideFieldErrors}
          onValuesChange={(changedValues) => {
            if (Object.prototype.hasOwnProperty.call(changedValues, "category_id")) {
              const nextValue = changedValues.category_id;
              const shouldShowDescription = nextValue === 0;
              setShowDescriptionCategory(shouldShowDescription);

              if (typeof nextValue === "string" && nextValue.startsWith("suggestion:")) {
                const categoryId = nextValue.replace("suggestion:", "");
                const suggestion = SUGGESTED_INCOME_CATEGORIES.find(cat => cat.key === categoryId);
                if (suggestion) {
                  form.setFieldsValue({ category_description: suggestion.label });
                }
              }

              if (!shouldShowDescription && nextValue !== 0) {
                form.setFieldValue("category_description", undefined);
              }
            }
          }}
        >
          <Form.Item
            name="description"
            label="Descrição"
            rules={[{ required: true, message: "Informe a descrição" }]}
          >
            <Input placeholder="Ex: Salário, saldo inicial..." className={styles.inputField} />
          </Form.Item>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Form.Item
              name="date"
              label="Data"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: "Informe a data" },
                {
                  validator: (_, value) => {
                    if (!value || !value.startOf("day").isAfter(dayjs().startOf("day"))) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error("A data do salário não pode ser futura"));
                  },
                },
              ]}
            >
              <DatePicker 
                format={["DD/MM/YYYY", "DDMMYYYY", "DD-MM-YYYY"]} 
                className={styles.inputField}
                style={{ width: "100%" }}
                placeholder="dd/mm/aaaa"
                disabledDate={(current) => Boolean(current && current.startOf("day").isAfter(dayjs().startOf("day")))}
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
                    <span>Nova categoria</span>
                  </Space>
                </Select.Option>

                {/* <Select.OptGroup label="Sugestões">
                  {filteredSuggestions.map((cat) => (
                    <Select.Option key={cat.key} value={`suggestion:${cat.key}`}>
                      <Space>
                        <span style={{ color: cat.color }}>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select.OptGroup> */}

                {categories.length > 0 && (
                  <Select.OptGroup label="Minhas categorias">
                    {categories.map((category) => {
                      const { icon, color } = getCategoryIcon(category);
                      return (
                        <Select.Option key={category.id} value={category.id}>
                          <Space>
                            <span style={{ color }}>{icon}</span>
                            {category.category_description}
                          </Space>
                        </Select.Option>
                      );
                    })}
                  </Select.OptGroup>
                )}
              </Select>
            </Form.Item>
          </div>

          {showDescriptionCategory && (
            <Form.Item
              name="category_description"
              label="Nome da categoria"
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
            <InputNumber<number>
              className={styles.inputField}
              style={{ width: "100%" }}
              placeholder="R$"
              min={0.01}
              precision={2}
              decimalSeparator=","
              formatter={currencyFormatter}
              parser={currencyParser}
            />
          </Form.Item>

          <Form.Item
            name="is_recurring"
            valuePropName="checked"
            style={{ marginBottom: 0 }}
          >
            <Checkbox>Entrada recorrente (mensal)</Checkbox>
          </Form.Item>

          <GlobalErrorList form={form} />
        </Form>
      </ConfigProvider>
    </div>
  );
};
