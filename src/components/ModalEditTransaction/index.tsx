"use client";
import { getApiErrorMessage, request } from "@/service/api";
import { currencyFormatter, currencyParser } from "@/utils/currencyFormatter";
import { Modal, Col, DatePicker, Row, Select, Form, Button, Input, InputNumber, message, Space } from "antd";
import type { DatePickerProps } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import Image from "next/image";
import styles from "@/app/EnterTransaction/entertransaction.module.scss";
import { ITransaction } from "@/interfaces";

interface EditTransactionModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  transaction: ITransaction;
}
interface Category {
  id: number;
  category_description: string;
  created_at: Date;
  updated_at: Date;
}

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

export const EditTransactionModal = ({
  isModalOpen,
  setIsModalOpen,
  transaction,
}: EditTransactionModalProps) => {
  const [showDescriptionCategory, setShowDescriptionCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form] = Form.useForm();

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: "Excluir transação?",
      content: "Esta ação não pode ser desfeita e removerá permanentemente o registro desta transação.",
      okText: "Excluir",
      okType: "danger",
      cancelText: "Cancelar",
      centered: true,
      onOk: async () => {
        try {
          await request({
            method: "DELETE",
            endpoint: `transaction/${transaction.id}`,
          });
          message.success("Transação excluída com sucesso!");
          handleCancel();
        } catch (error) {
          message.error(getApiErrorMessage(error));
          console.log(error);
        }
      },
    });
  };

  const getCategories = async (typeId: number) => {
    try {
      const response = await request({
        method: "GET",
        endpoint: `categories/type/${typeId}`,
      });
      setCategories(extractCategoriesFromResponse(response));
    } catch (error) {
      console.log(error);
    }
  };

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      console.log(values);
      await request({
        method: "PUT",
        endpoint: `transaction/${transaction.id}`,
        data: {
          ...values,
          date: dayjs(values.date).format("YYYY-MM-DD"),
        },
      });
      message.success("Transação atualizada com sucesso!");
      handleCancel();
    } catch (errorInfo) {
      message.error(getApiErrorMessage(errorInfo));
    }
  };
  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    console.log(date, dateString);
  };

  useEffect(() => {
    if (!isModalOpen) return;

    getCategories(transaction.type_id);
    form.setFieldsValue({
      transaction_description: transaction.transaction_description,
      date: dayjs(transaction.date),
      category_id: transaction.category_id,
      installments: transaction.installments,
      transaction_value: Number(transaction.transaction_value),
      category_description: transaction.category_id === 0 ? transaction.category_description : undefined,
    });
    setShowDescriptionCategory(transaction.category_id === 0);
  }, [isModalOpen, transaction, form]);

  return (
    <Modal
      title="Editar transação"
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
      centered
    >
      <Form
        form={form}
        name="basic"
        data-testid="form"
        initialValues={{
          transaction_description: transaction.transaction_description,
          date: dayjs(transaction.date),
          category_id: transaction.category_id,
          installments: transaction.installments,
          transaction_value: transaction.transaction_value,
        }}
        onFinish={handleFinish}
        onFinishFailed={(errorInfo) => console.log(errorInfo)}
        onValuesChange={(changedValues) => {
          if (Object.keys(changedValues)[0] === "category_id") {
            setShowDescriptionCategory(changedValues.category_id === 0);
          }
        }}
      >
        <div>
          <label>Descrição</label>
          <Form.Item
            name="transaction_description"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Input className={styles.input} style={{ width: "95%" }} data-testid="description" />
          </Form.Item>
        </div>
        <div style={{ marginTop: 20 }}>
          <label>Data</label>
          <Form.Item name="date" rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}>
            <DatePicker
              data-testid="date"
              onChange={onChange}
              className={styles.input}
              placeholder="dd/mm/aaaa"
              format={["DD/MM/YYYY", "DDMMYYYY", "DD-MM-YYYY"]}
              defaultValue={dayjs(transaction.date)}
              disabledDate={(current) => {
                return current && current > dayjs().endOf("day");
              }}
            />
          </Form.Item>
        </div>
        <Row style={{ marginTop: 20 }}>
          <Col>
            <label>Categoria</label>
            <Form.Item
              name="category_id"
              rules={[
                {
                  required: true,
                  message: "Este campo precisa ser preenchido!",
                },
              ]}
            >
              <Select
                data-testid="category_id"
                className={styles.input}
                style={{ width: 200, height: 35 }}
                options={[
                  { value: 0, label: "Nova categoria" },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.category_description,
                  })),
                ]}
              />
            </Form.Item>
          </Col>
          {showDescriptionCategory ? (
            <Col>
              <label>Descrição da categoria</label>
              <Form.Item
                name="category_description"
                rules={[
                  {
                    required: true,
                    message: "Este campo precisa ser preenchido!",
                  },
                ]}
              >
                <Input className={styles.input} data-testid="category_description" />
              </Form.Item>
            </Col>
          ) : null}
        </Row>
        {transaction.installments ? (
          <div>
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
          </div>
        ) : null}
        <div style={{ marginBottom: 20 }}>
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
        </div>
        <Row
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 32,
          }}
        >
          <Button className={styles.secondaryLink} onClick={handleDelete} title="Excluir transação">
            <Image src="/icons/icon-delete.svg" alt="Excluir" width={20} height={20} />
          </Button>
          <Space>
            <Button onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              type="primary" 
              onClick={() => form.submit()} 
              style={{ background: "#6C5DD3", borderColor: "#6C5DD3" }}
            >
              Salvar
            </Button>
          </Space>
        </Row>
      </Form>
    </Modal>
  );
};
