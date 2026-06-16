"use client";
import { getApiErrorMessage, request } from "@/service/api";
import { currencyFormatter, currencyParser } from "@/utils/currencyFormatter";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { Modal, Col, DatePicker, Row, Select, Form, Button, Input, InputNumber, message, Space, ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");
import { Card } from "@/interfaces";
import {
  PlusOutlined,
  HomeOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  RocketOutlined,
  ShoppingOutlined,
  CoffeeOutlined,
  ReadOutlined,
  RestOutlined,
  StarOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  TagsOutlined,
  WalletOutlined,
  DollarOutlined
} from "@ant-design/icons";

interface OutputModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  initialValues?: Record<string, any>;
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

const SUGGESTED_EXPENSE_CATEGORIES: SuggestedCategory[] = [
  { key: "5", label: "Transporte", icon: <CarOutlined />, color: "#6C5DD3" },
  { key: "6", label: "Saúde", icon: <MedicineBoxOutlined />, color: "#00875A" },
  { key: "7", label: "Lazer", icon: <CoffeeOutlined />, color: "#FF754C" },
  { key: "8", label: "Contas", icon: <ThunderboltOutlined />, color: "#FFD700" },
  { key: "9", label: "Internet", icon: <WifiOutlined />, color: "#8E82EF" },
  { key: "10", label: "Compras", icon: <ShoppingOutlined />, color: "#FF4D4F" },
  { key: "11", label: "Projetos", icon: <RocketOutlined />, color: "#6C5DD3" },
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

export const OutputModal = ({ isModalOpen, setIsModalOpen, initialValues, onSuccess }: OutputModalProps) => {
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
      setPaymentMethods(response?.data?.data?.payment_methods ?? []);
    } catch (error) {
      setPaymentMethods([]);
    }
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
      setCards(response?.data?.data?.cards ?? []);
    } catch (error) {
      console.log(error);
      setCards([]);
    }
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
          type_id: 2,
        },
      });
      message.success("Transação adicionada com sucesso!");
      handleCancel();
      if (onSuccess) onSuccess();
    } catch (errorInfo) {
      message.error(getApiErrorMessage(errorInfo));
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

  const filteredSuggestions = useMemo(() => {
    return SUGGESTED_EXPENSE_CATEGORIES.filter(suggestion => {
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
      title="Nova saída"
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
      <ConfigProvider locale={ptBR}>
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
                const categoryId = nextValue.replace("suggestion:", "");
                const suggestion = SUGGESTED_EXPENSE_CATEGORIES.find(cat => cat.key === categoryId);
                if (suggestion) {
                  form.setFieldsValue({ category_description: suggestion.label });
                }
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
              <label>Forma de pagamento</label>
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
                      options={(cards ?? []).map((card) => ({
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
              <InputNumber<number>
                className={styles.input}
                style={{ width: "100%" }}
                placeholder="R$"
                data-testid="value"
                min={0.01}
                precision={2}
                decimalSeparator=","
                formatter={currencyFormatter}
                parser={currencyParser}
              />
            </Form.Item>
          </Col>
        </Form>
      </ConfigProvider>
    </Modal>
  );
};
