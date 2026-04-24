"use client";
import { getApiErrorMessage, request } from "@/service/api";
import { Modal, Col, Row, Select, Form, Button, Input, message } from "antd";
import { useEffect } from "react";
import styles from "@/app/EnterTransaction/entertransaction.module.scss";

interface ModalNewCategoryProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  onCategoryCreated?: () => void;
}

export const ModalNewCategory = ({ isModalOpen, setIsModalOpen, onCategoryCreated }: ModalNewCategoryProps) => {
  const [form] = Form.useForm();

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      await request({
        method: "POST",
        endpoint: `category/store`,
        data: {
          ...values,
        },
      });
      message.success("Categoria adicionada com sucesso!");
      onCategoryCreated?.();
      handleCancel();
    } catch (errorInfo) {
      message.error(getApiErrorMessage(errorInfo));
    }
  };

  useEffect(() => {
    form.resetFields();
  }, []);

  return (
    <Modal
      title="Nova Categoria"
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
        data-testid="form"
        onFinish={handleFinish}
        onFinishFailed={(errorInfo) => console.log(errorInfo)}
      >
        <Col>
          <label>Descrição</label>
          <Form.Item
            name="category_description"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Input className={styles.input} style={{ width: "95%" }} data-testid="description" />
          </Form.Item>
        </Col>
        <Col>
          <label>Tipo</label>
          <Form.Item
            name="type_id"
            rules={[{ required: true, message: "Este campo precisa ser preenchido!" }]}
          >
            <Select
              data-testid="type_id"
              className={styles.input}
              style={{ width: 150, height: 35 }}
              defaultValue={0}
            >
              <Select.Option key={0} value={0} disabled>
                Selecione o tipo de categoria
              </Select.Option>
              <Select.Option key={1} value={1}>
                Entrada
              </Select.Option>
              <Select.Option key={2} value={2}>
                Saída
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Form>
    </Modal>
  );
};
