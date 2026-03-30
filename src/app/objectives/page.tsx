"use client";
import React, { useState } from "react";
import { Row, Col, Card, Modal, Form, Input, InputNumber, DatePicker, Button, message, Space, Typography } from "antd";
import CustomMenu from "@/components/CustomMenu";
import { 
  UserOutlined, 
  HomeOutlined, 
  CarOutlined, 
  GlobalOutlined, 
  ShoppingOutlined, 
  EllipsisOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  GiftOutlined
} from "@ant-design/icons";
import styles from "./objectives.module.scss";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface ObjectiveType {
  id: string;
  title: string;
  icon: React.ReactNode;
  isRetirement?: boolean;
}

const objectiveTypes: ObjectiveType[] = [
  { id: "retirement", title: "Aposentadoria", icon: <UserOutlined />, isRetirement: true },
  { id: "house", title: "Comprar uma casa", icon: <HomeOutlined /> },
  { id: "car", title: "Comprar um carro", icon: <CarOutlined /> },
  { id: "travel", title: "Planejar viagem", icon: <GlobalOutlined /> },
  { id: "item", title: "Comprar um bem", icon: <ShoppingOutlined /> },
  { id: "investment", title: "Fazer um aporte", icon: <ThunderboltOutlined /> },
  { id: "succession", title: "Planejar sucessão", icon: <SafetyCertificateOutlined /> },
  { id: "other", title: "Outros", icon: <EllipsisOutlined /> },
];

const ObjectivesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ObjectiveType | null>(null);
  const [form] = Form.useForm();

  const handleOpenModal = (type: ObjectiveType) => {
    setSelectedType(type);
    form.resetFields();
    form.setFieldsValue({ name: type.title });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log("Objetivo salvo:", values);
      message.success("Objetivo definido com sucesso!");
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh", background: "#F8FAFC" }}>
      <CustomMenu />
      <div style={{ flex: 1 }}>
        <div style={{ padding: "10px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Objetivos</h3>
          </div>
        </div>

        <div style={{ padding: "0 30px 30px 30px" }}>
          <p style={{ color: "#808191", marginBottom: 20, fontSize: 13 }}>Acompanhe todos os seus objetivos de vida no Ficker</p>

          <Row gutter={[24, 24]}>
            {objectiveTypes.map((type) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={type.id}>
                <Card 
                  hoverable 
                  className={styles.objectiveCard}
                  onClick={() => handleOpenModal(type)}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.iconWrapper}>
                      {type.icon}
                    </div>
                    <span className={styles.cardTitle}>{type.title}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <Modal
          title="Defina seu objetivo"
          open={isModalOpen}
          onOk={handleSave}
          onCancel={() => setIsModalOpen(false)}
          okText="Salvar objetivo"
          cancelText="Cancelar"
          centered
          width={450}
          okButtonProps={{ style: { background: "#6C5DD3", width: "100%", height: 45, borderRadius: 8, marginTop: 20 }, className: styles.modalOkBtn }}
          cancelButtonProps={{ style: { display: "none" } }}
        >
          <Form form={form} layout="vertical" className={styles.modalForm}>
            <Form.Item name="name" label="Nome do objetivo" rules={[{ required: true }]}>
              <Input placeholder="Exemplo: Comprar um carro" className={styles.input} />
            </Form.Item>

            {selectedType?.isRetirement ? (
              <>
                <Form.Item name="monthly_income" label="Com que renda mensal quero viver?" rules={[{ required: true }]}>
                  <InputNumber 
                    style={{ width: "100%" }} 
                    placeholder="Exemplo: 20.000,00" 
                    className={styles.input}
                    formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                    parser={value => value!.replace(/R\$\s?|(\.*)/g, "").replace(",", ".")}
                  />
                </Form.Item>
                <Form.Item name="current_saved" label="Valor que você já guardou">
                  <InputNumber 
                    style={{ width: "100%" }} 
                    placeholder="Exemplo: 10.000,00" 
                    className={styles.input}
                    formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                    parser={value => value!.replace(/R\$\s?|(\.*)/g, "").replace(",", ".")}
                  />
                </Form.Item>
                <Form.Item name="birth_date" label="Data de nascimento" rules={[{ required: true }]}>
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Exemplo: 20/09/2024" className={styles.input} />
                </Form.Item>
                <Form.Item name="retirement_age" label="Idade que deseja se aposentar" rules={[{ required: true }]}>
                  <InputNumber style={{ width: "100%" }} placeholder="Exemplo: 50" className={styles.input} />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="total_value" label="Valor total do objetivo" rules={[{ required: true }]}>
                  <InputNumber 
                    style={{ width: "100%" }} 
                    placeholder="Exemplo: 20.000,00" 
                    className={styles.input}
                    formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                    parser={value => value!.replace(/R\$\s?|(\.*)/g, "").replace(",", ".")}
                  />
                </Form.Item>
                <Form.Item name="current_saved" label="Valor que você já guardou">
                  <InputNumber 
                    style={{ width: "100%" }} 
                    placeholder="Exemplo: 10.000,00" 
                    className={styles.input}
                    formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                    parser={value => value!.replace(/R\$\s?|(\.*)/g, "").replace(",", ".")}
                  />
                </Form.Item>
                <Form.Item name="target_year" label="Ano final do objetivo" rules={[{ required: true }]}>
                  <InputNumber style={{ width: "100%" }} placeholder="Exemplo: 2030" className={styles.input} />
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ObjectivesPage;
