"use client";
import { request } from "@/service/api";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { Modal, Col, DatePicker, Row, Select, Form, Button, Input, message, Space } from "antd";
import type { DatePickerProps } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Card } from "@/interfaces";
import {
  PlusOutlined,
  HomeOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  SkinOutlined,
  RocketOutlined,
  ShoppingOutlined,
  BookOutlined,
  ToolOutlined,
  CoffeeOutlined,
  StarOutlined,
  RestOutlined,
  ThunderboltOutlined,
  WifiOutlined
} from "@ant-design/icons";

interface OutputModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  initialValues?: Record<string, any>;
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

const SUGGESTED_EXPENSE_CATEGORIES: SuggestedCategory[] = [
  { key: "food", label: "Alimentação", icon: <RestOutlined />, color: "#FFA940" },
  { key: "home", label: "Casa", icon: <HomeOutlined />, color: "#00B0FF" },
  { key: "transport", label: "Transporte", icon: <CarOutlined />, color: "#6C5DD3" },
  { key: "health", label: "Saúde", icon: <MedicineBoxOutlined />, color: "#00875A" },
  { key: "leisure", label: "Lazer", icon: <CoffeeOutlined />, color: "#FF754C" },
  { key: "bills", label: "Contas", icon: <ThunderboltOutlined />, color: "#FFD700" },
  { key: "internet", label: "Internet", icon: <WifiOutlined />, color: "#8E82EF" },
  { key: "shopping", label: "Compras", icon: <ShoppingOutlined />, color: "#FF4D4F" },
  { key: "projects", label: "Projetos", icon: <RocketOutlined />, color: "#6C5DD3" },
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

export const OutputModal = ({ isModalOpen, setIsModalOpen, initialValues }: OutputModalProps) => {
  const [showDescriptionCategory, setShowDescriptionCategory] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [cards, setCards] = useState<Card[]>([]);

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setShowDescriptionCategory(false);
    setShowCards(false);
  };

  const getPaymentMethods = async () => {
    try {
      const response = await request({
        endpoint: "payment/methods",
      });
      setPaymentMethods(response.data.data.payment_methods);
    } catch (error) {}
  };

  const getCategories = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "categories/type/2",
      });
      setCategories(extractCategoriesFromResponse(response));
    } catch (error) {
      console.log(error);
    }
  };

  const getCards = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "cards",
      });
      setCards(response.data.data.cards);
    } catch (error) {
      console.log(error);
    }
  };

  const resolveCategoryPayload = (values: Record<string, any>) => {
    const rawCategoryId = values.category_id;

    if (typeof rawCategoryId === "string" && rawCategoryId.startsWith("suggestion:")) {
      const suggestionLabel = rawCategoryId.replace("suggestion:", "");
      const existingCategory = categories.find(
        (category) => normalizeCategoryName(category.category_description) === normalizeCategoryName(suggestionLabel)
      );

      if (existingCategory) {
        return {
          category_id: existingCategory.id,
          category_description: undefined,
        };
      }

      return {
        category_id: 0,
        category_description: suggestionLabel,
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
          type_id: 2,
        },
      });
      message.success("Transação adicionada com sucesso!");
      handleCancel();
    } catch (errorInfo) {
      message.error("Erro ao adicionar transação!");
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;

    getCategories();
    getCards();
    getPaymentMethods();
    form.resetFields();
    setShowDescriptionCategory(false);
    setShowCards(false);

    if (initialValues) {
      form.setFieldsValue(initialValues);
      if (initialValues.category_id === 0) {
        setShowDescriptionCategory(true);
      }
      if (initialValues.payment_method_id === 4) {
        setShowCards(true);
      }
    }
  }, [isModalOpen, initialValues]);

  return (
    <Modal
      title="Nova Saída"
      open={isModalOpen}
      onCancel={handleCancel}
      okButtonProps={{
        style: {
          display: "none",
        },
      }}
      cancelButtonProps={{
        style: {
          display: "none",
        },
      }}
    >
      <Form
        form={form}
        name="basic"
        data-testid="form"
        onFinish={handleFinish}
        onFinishFailed={(errorInfo) => console.log(errorInfo)}
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

          if (Object.prototype.hasOwnProperty.call(changedValues, "payment_method_id")) {
            setShowCards(changedValues.payment_method_id === 4);
          }
        }}
      >
        <Col style={{ marginTop: 20 }}>
          <label>Descrição</label>
          <Form.Item
            name="transaction_description"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Input className={styles.input} style={{ width: "95%" }} data-testid="description" />
          </Form.Item>
        </Col>
        <Col>
          <label>Data</label>
          <Form.Item name="date" rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}>
            <DatePicker
              data-testid="date"
              className={styles.input}
              placeholder="dd/mm/aaaa"
              format={"DD/MM/YYYY"}
              disabledDate={(current) => {
                return current && current > dayjs().endOf("day");
              }}
            />
          </Form.Item>
        </Col>
        <Row>
          <Col>
            <label>Forma de Pagamento</label>
            <Form.Item
              name="payment_method_id"
              rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
            >
              <Select
                data-testid="payment_method_id"
                className={styles.input}
                style={{ width: 200, height: 40 }}
                options={paymentMethods?.map((paymentMethod) => ({
                  value: paymentMethod.id,
                  label: paymentMethod.description,
                }))}
              />
            </Form.Item>
          </Col>
          {showCards ? (
            <>
              <Col>
                <label>Cartões</label>
                <Form.Item
                  name="card_id"
                  rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
                >
                  <Select
                    data-testid="card_id"
                    className={styles.input}
                    style={{ width: 200, height: 40 }}
                    options={cards.map((card) => ({
                      value: card.id,
                      label: card.card_description,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col>
                <label>Parcelas</label>
                <Form.Item
                  name="installments"
                  rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
                >
                  <Select
                    data-testid="installments"
                    className={styles.input}
                    style={{ width: 150, height: 35 }}
                  >
                    {Array.from({ length: 12 }, (_, index) => (
                      <Select.Option key={index + 1} value={index + 1}>
                        {`${index + 1}x`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </>
          ) : null}
        </Row>
        <Row>
          <Col>
            <label>Categoria</label>
            <Form.Item
              name="category_id"
              rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
            >
              <Select
                data-testid="category_id"
                className={styles.input}
                style={{ width: 200, height: 40 }}
                placeholder="Selecione ou crie"
              >
                <Select.Option value={0}>
                  <Space>
                    <PlusOutlined style={{ color: '#6C5DD3' }} />
                    <span>Nova Categoria</span>
                  </Space>
                </Select.Option>

                <Select.OptGroup label="Sugestões">
                  {SUGGESTED_EXPENSE_CATEGORIES.map((cat) => (
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
          </Col>
          {showDescriptionCategory ? (
            <Col>
              <label>Descrição da Categoria</label>
              <Form.Item
                name="category_description"
                rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
              >
                <Input className={styles.input} data-testid="category_description" />
              </Form.Item>
            </Col>
          ) : null}
        </Row>
        <Col xl={15}>
          <label>Valor</label>
          <Form.Item
            name="transaction_value"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Input className={styles.input} placeholder="R$" data-testid="value" />
          </Form.Item>
        </Col>
        <Row>
          <Button className={styles.modalButtonWhite} onClick={handleCancel}>
            Cancelar
          </Button>
          <Button htmlType="submit" className={styles.modalButtonPurple}>
            Adicionar
          </Button>
        </Row>
      </Form>
    </Modal>
  );
};
