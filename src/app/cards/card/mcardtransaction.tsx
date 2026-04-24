"use client";
import { getApiErrorMessage, request } from "@/service/api";
import { Modal, Col, DatePicker, Row, Select, Form, Button, Input, message, Space } from "antd";
import type { DatePickerProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import styles from "../../EnterTransaction/entertransaction.module.scss";
import { 
  PlusOutlined, 
  WalletOutlined,
  DollarOutlined,
  CarOutlined, 
  MedicineBoxOutlined, 
  RocketOutlined, 
  ShoppingOutlined,
  CoffeeOutlined,
  StarOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  TagsOutlined
} from "@ant-design/icons";
interface CardTransactionModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  cardId: number;
}

interface Category {
  id: number;
  category_description: string;
  created_at: Date;
  updated_at: Date;
}

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

export const CardTransactionModal = ({ isModalOpen, setIsModalOpen, cardId }: CardTransactionModalProps) => {
  const [showDescriptionCategory, setShowDescriptionCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form] = Form.useForm();

  const defaultCategories = [
    { id: '1', label: 'Salário', icon: <DollarOutlined />, color: '#00875A' },
    { id: '2', label: 'Freelance', icon: <RocketOutlined />, color: '#6C5DD3' },
    { id: '3', label: 'Investimentos', icon: <WalletOutlined />, color: '#FFA940' },
    { id: '4', label: 'Renda Extra', icon: <StarOutlined />, color: '#00B0FF' },
    { id: '5', label: 'Transporte', icon: <CarOutlined />, color: '#6C5DD3' },
    { id: '6', label: 'Saúde', icon: <MedicineBoxOutlined />, color: '#00875A' },
    { id: '7', label: 'Lazer', icon: <CoffeeOutlined />, color: '#FF754C' },
    { id: '8', label: 'Contas', icon: <ThunderboltOutlined />, color: '#FFD700' },
    { id: '9', label: 'Internet', icon: <WifiOutlined />, color: '#8E82EF' },
    { id: '10', label: 'Compras', icon: <ShoppingOutlined />, color: '#FF4D4F' },
    { id: '11', label: 'Projetos', icon: <RocketOutlined />, color: '#6C5DD3' },
  ];

  const handleCancel = () => {
    setIsModalOpen(false);
    setShowDescriptionCategory(false);
    form.resetFields();
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

  const resolveCategoryPayload = (values: Record<string, any>) => {
    const rawCategoryId = values.category_id;

    const selectedDefault = defaultCategories.find((category) => category.id === String(rawCategoryId));

    if (selectedDefault) {
      return {
        category_id: Number(selectedDefault.id),
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
          payment_method_id: 4,
          card_id: cardId,
        },
      });
      message.success("Transação adicionada com sucesso!");
      handleCancel();
    } catch (errorInfo) {
      message.error(getApiErrorMessage(errorInfo));
    }
  };
  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    console.log(date, dateString);
  };

  const filteredSuggestions = useMemo(() => {
    return defaultCategories.filter(suggestion => {
      return !categories.some(userCat => 
        userCat.id === Number(suggestion.id) || 
        normalizeCategoryName(userCat.category_description) === normalizeCategoryName(suggestion.label)
      );
    });
  }, [categories]);

  useEffect(() => {
    getCategories();
    form.resetFields();
  }, []);

  return (
    <Modal
      title="Nova Transação no Crédito"
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
          if (Object.keys(changedValues)[0] === "category_id") {
            setShowDescriptionCategory(changedValues.category_id === 0);
          }
        }}
      >
        <Col>
          <label>Descrição</label>
          <Form.Item
            name="transaction_description"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Input className={styles.input} style={{ width: "95%" }} data-testid="description" />
          </Form.Item>
        </Col>
        <Col style={{ marginTop: 20 }}>
          <label>Data</label>
          <Form.Item name="date" rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}>
            <DatePicker
              data-testid="date"
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
                data-testid="category_id"
                className={styles.input}
                style={{ width: 200, height: 35 }}
                placeholder="Selecione ou crie"
              >
                <Select.Option value={0}>
                  <Space>
                    <PlusOutlined style={{ color: '#6C5DD3' }} />
                    <span>Nova categoria</span>
                  </Space>
                </Select.Option>
                
                {/* <Select.OptGroup label="Sugestões">
                  {filteredSuggestions.map(cat => (
                    <Select.Option key={cat.id} value={cat.id}>
                      <Space>
                        <span style={{ color: cat.color }}>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select.OptGroup> */}

                {categories && categories.length > 0 && (
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
        <Col>
          <label>Parcelas</label>
          <Form.Item
            name="installments"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Select data-testid="installments" className={styles.input} style={{ width: 150, height: 35 }}>
              {Array.from({ length: 12 }, (_, index) => (
                <Select.Option key={index + 1} value={index + 1}>
                  {`${index + 1}x`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col style={{ marginBottom: 20 }} xl={15}>
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
