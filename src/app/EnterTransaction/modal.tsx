"use client";
import { getApiErrorMessage, request } from "@/service/api";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { Modal, Col, DatePicker, Row, Select, Form, Button, Input, message, InputNumber, Space, Switch } from "antd";
import type { DatePickerProps } from "antd";
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import {
  PlusOutlined,
  WalletOutlined,
  HomeOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  SkinOutlined,
  RocketOutlined,
  ShoppingOutlined,
  BookOutlined,
  DollarOutlined,
  ToolOutlined,
  CoffeeOutlined,
  StarOutlined,
  SyncOutlined,
  TagsOutlined,
  RestOutlined,
  ThunderboltOutlined,
  WifiOutlined
} from "@ant-design/icons";

interface EnterTransactionModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  onSuccess?: () => void;
}

interface Category {
  id: number;
  category_description: string;
  created_at: Date;
  updated_at: Date;
}

interface SuggestedCategory {
  key: string;
  label: string;
  icon: JSX.Element;
  color: string;
}

const SUGGESTED_INCOME_CATEGORIES: SuggestedCategory[] = [
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

const extractCategoriesFromResponse = (response: any): Category[] => {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data?.categories)) {
    return payload.data.categories;
  }

  if (Array.isArray(payload?.categories)) {
    return payload.categories;
  }

  return [];
};

const getCategoryIcon = (category: any) => {
  const id = Number(category?.id);
  const description = category?.category_description?.toLowerCase() || "";

  if (id === 1 || description.includes("salário")) return { icon: <DollarOutlined />, color: "#00875A" };
  if (id === 2 || description.includes("freelance")) return { icon: <RocketOutlined />, color: "#6C5DD3" };
  if (id === 3 || description.includes("investimentos")) return { icon: <WalletOutlined />, color: "#FFA940" };
  if (id === 4 || description.includes("renda extra")) return { icon: <StarOutlined />, color: "#00B0FF" };
  if (id === 5 || description.includes("transporte")) return { icon: <CarOutlined />, color: "#6C5DD3" };
  if (id === 6 || description.includes("saúde")) return { icon: <MedicineBoxOutlined />, color: "#00875A" };
  if (id === 7 || description.includes("lazer")) return { icon: <CoffeeOutlined />, color: "#FF754C" };
  if (id === 8 || description.includes("contas")) return { icon: <ThunderboltOutlined />, color: "#FFD700" };
  if (id === 9 || description.includes("internet")) return { icon: <WifiOutlined />, color: "#8E82EF" };
  if (id === 10 || description.includes("compras")) return { icon: <ShoppingOutlined />, color: "#FF4D4F" };
  if (id === 11 || description.includes("projetos")) return { icon: <RocketOutlined />, color: "#6C5DD3" };

  return { icon: <TagsOutlined />, color: "#808191" };
};

export const EnterTransactionModal = ({ isModalOpen, setIsModalOpen, onSuccess }: EnterTransactionModalProps) => {
  const [showDescriptionCategory, setShowDescriptionCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form] = Form.useForm();

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setShowDescriptionCategory(false);
  };

  const resolveCategoryPayload = (values: Record<string, any>) => {
    const rawCategoryId = values.category_id;

    if (typeof rawCategoryId === "string" && rawCategoryId.startsWith("suggestion:")) {
      const categoryId = Number(rawCategoryId.replace("suggestion:", ""));
      return {
        category_id: categoryId,
        category_description: undefined,
      };
    }

    return {
      category_id: rawCategoryId,
      category_description: rawCategoryId === 0 ? values.category_description : undefined,
    };
  };

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      const categoryPayload = resolveCategoryPayload(values);

      await request({
        method: "POST",
        endpoint: "transaction/store",
        data: {
          ...values,
          ...categoryPayload,
          date: dayjs(values.date).format("YYYY-MM-DD"),
          type_id: 1,
          is_recurring: values.is_recurring || false,
        },
      });
      message.success("Transação adicionada com sucesso!");
      handleCancel();
      if (onSuccess) onSuccess();
    } catch (errorInfo) {
      message.error(getApiErrorMessage(errorInfo));
    }
  };

  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    console.log(date, dateString);
  };

  const getCategories = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "categories/type/1",
      });
      setCategories(extractCategoriesFromResponse(response));
    } catch (error) {
      console.log(error);
    }
  };

  const filteredSuggestions = useMemo(() => {
    return SUGGESTED_INCOME_CATEGORIES.filter(suggestion => {
      return !categories.some(userCat => 
        userCat.id === Number(suggestion.key) || 
        normalizeCategoryName(userCat.category_description) === normalizeCategoryName(suggestion.label)
      );
    });
  }, [categories]);

  useEffect(() => {
    if (!isModalOpen) return;
    form.resetFields();
    setShowDescriptionCategory(false);
    getCategories();
  }, [isModalOpen]);

  return (
    <Modal
      title="Nova entrada"
      open={isModalOpen}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText="Adicionar"
      cancelText="Cancelar"
      centered
      okButtonProps={{
        style: {
          background: "#6C5DD3",
          borderColor: "#6C5DD3",
        },
      }}
    >
      <Form
        form={form}
        name="basic"
        onFinish={handleFinish}
        initialValues={{
          transaction_value: "",
        }}
        onFinishFailed={(errorInfo) => console.log(errorInfo)}
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

          if (changedValues.transaction_value) {
            const result = changedValues.transaction_value.replace(/[^0-9]/g, "");
            form.setFieldsValue({ transaction_value: result });
          }
        }}
      >
        <Col style={{ marginTop: 20 }}>
          <label>Descrição</label>
          <Form.Item
            name="transaction_description"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Input className={styles.input} style={{ width: "95%" }} />
          </Form.Item>
        </Col>
        <Col style={{ marginTop: 20 }}>
          <label>Data</label>
          <Form.Item name="date" rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}>
            <DatePicker
              onChange={onChange}
              className={styles.input}
              placeholder="dd/mm/aaaa"
              format={"DD/MM/YYYY"}
              disabledDate={(current) => {
                return current && current > dayjs().endOf("day");
              }}
            />
          </Form.Item>
        </Col>
        <Row style={{ marginTop: 20 }}>
          <Col>
            <label>Categoria</label>
            <Form.Item
              name="category_id"
              rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
            >
              <Select
                className={styles.input}
                style={{ width: 200, height: 40 }}
                placeholder="Selecione ou crie"
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
          </Col>
          {showDescriptionCategory ? (
            <Col>
              <label>Descrição da categoria</label>
              <Form.Item
                name="category_description"
                rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
              >
                <Input className={styles.input} />
              </Form.Item>
            </Col>
          ) : null}
        </Row>
        <Col style={{ marginBottom: 20 }} xl={15}>
          <label>Valor</label>
          <Form.Item
            name="transaction_value"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Input className={styles.input} placeholder="R$" />
          </Form.Item>
        </Col>

        <Col style={{ marginBottom: 20 }}>
          <Form.Item
            name="is_recurring"
            valuePropName="checked"
          >
            <Space>
              <Switch size="small" />
              <span>Entrada recorrente (mensal)</span>
          </Space>
        </Form.Item>
      </Col>
    </Form>
  </Modal>
  );
};
