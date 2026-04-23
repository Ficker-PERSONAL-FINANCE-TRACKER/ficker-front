"use client";
import { request } from "@/service/api";
import { Modal, Col, DatePicker, Row, Select, Form, Button, Input, message, Space } from "antd";
import type { DatePickerProps } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import styles from "../../EnterTransaction/entertransaction.module.scss";
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

export const CardTransactionModal = ({ isModalOpen, setIsModalOpen, cardId }: CardTransactionModalProps) => {
  const [showDescriptionCategory, setShowDescriptionCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form] = Form.useForm();

  const defaultCategories = [
    { id: 'exp_food', label: 'Alimentação', icon: <RestOutlined />, color: '#FFA940' },
    { id: 'exp_home', label: 'Casa', icon: <HomeOutlined />, color: '#00B0FF' },
    { id: 'exp_transp', label: 'Transporte', icon: <CarOutlined />, color: '#6C5DD3' },
    { id: 'exp_health', label: 'Saúde', icon: <MedicineBoxOutlined />, color: '#00875A' },
    { id: 'exp_leisure', label: 'Lazer', icon: <CoffeeOutlined />, color: '#FF754C' },
    { id: 'exp_bills', label: 'Contas', icon: <ThunderboltOutlined />, color: '#FFD700' },
    { id: 'exp_internet', label: 'Internet', icon: <WifiOutlined />, color: '#8E82EF' },
    { id: 'exp_shop', label: 'Compras', icon: <ShoppingOutlined />, color: '#FF4D4F' },
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

    const selectedDefault = defaultCategories.find((category) => category.id === rawCategoryId);

    if (selectedDefault) {
      const existingCategory = categories.find(
        (category) => normalizeCategoryName(category.category_description) === normalizeCategoryName(selectedDefault.label)
      );

      if (existingCategory) {
        return {
          category_id: existingCategory.id,
          category_description: undefined,
        };
      }

      return {
        category_id: 0,
        category_description: selectedDefault.label,
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
      message.error("Erro ao adicionar transação!");
    }
  };
  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    console.log(date, dateString);
  };

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
                
                <Select.OptGroup label="Sugestões">
                  {defaultCategories.map(cat => (
                    <Select.Option key={cat.id} value={cat.id}>
                      <Space>
                        <span style={{ color: cat.color }}>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select.OptGroup>

                {categories && categories.length > 0 && (
                  <Select.OptGroup label="Minhas categorias">
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
