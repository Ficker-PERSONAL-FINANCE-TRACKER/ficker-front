"use client";
import { request } from "@/service/api";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { Modal, Col, DatePicker, Row, Select, Form, Button, Input, message, InputNumber, Space } from "antd";
import type { DatePickerProps } from "antd";
import { useEffect, useState } from "react";
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
  StarOutlined
} from "@ant-design/icons";

interface EnterTransactionModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
}

interface Category {
  id: number;
  category_description: string;
  created_at: Date;
  updated_at: Date;
}

export const EnterTransactionModal = ({ isModalOpen, setIsModalOpen }: EnterTransactionModalProps) => {
  const [showDescriptionCategory, setShowDescriptionCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const defaultCategories = [
    { id: 'income_salary', label: 'Salário', icon: <DollarOutlined />, color: '#00875A' },
    { id: 'income_freelance', label: 'Freelance', icon: <RocketOutlined />, color: '#6C5DD3' },
    { id: 'income_invest', label: 'Investimentos', icon: <WalletOutlined />, color: '#FFA940' },
    { id: 'income_extra', label: 'Renda Extra', icon: <StarOutlined />, color: '#00B0FF' },
  ];

  const [form] = Form.useForm();

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      
      let categoryId = values.category_id;
      let categoryDescription = values.category_description;

      // Se for uma categoria padrão, tratamos como uma "nova" com o nome pré-definido
      const selectedDefault = defaultCategories.find(c => c.id === values.category_id);
      if (selectedDefault) {
        categoryId = 0;
        categoryDescription = selectedDefault.label;
      }

      await request({
        method: "POST",
        endpoint: "transaction/store",
        data: {
          ...values,
          category_id: categoryId,
          category_description: categoryDescription,
          date: dayjs(values.date).format("YYYY-MM-DD"),
          type_id: 1,
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

  const getCategories = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "categories/type/1",
      });
      setCategories(response.data.data.categories);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    form.resetFields();
    getCategories();
  }, []);

  return (
    <Modal
      title="Nova Entrada"
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
        onFinish={handleFinish}
        initialValues={{
          transaction_value: "",
        }}
        onFinishFailed={(errorInfo) => console.log(errorInfo)}
        onValuesChange={(changedValues) => {
          if (Object.keys(changedValues)[0] === "category_id") {
            setShowDescriptionCategory(changedValues.category_id === 0);
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
                    <span>Nova Categoria</span>
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
        {/* <Col style={{ marginBottom: 20 }} xl={15}>
          <label>Método de pagamento</label>
          <Form.Item
            name="payment_method_id"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Select
              className={styles.input}
              style={{ width: 200, height: 40 }}
              options={[
                { value: 0, label: "Dinheiro" },
                { value: 1, label: "Cartão de Crédito" },
                { value: 2, label: "Cartão de Débito" },
              ]}
            />
          </Form.Item>
        </Col> */}
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
