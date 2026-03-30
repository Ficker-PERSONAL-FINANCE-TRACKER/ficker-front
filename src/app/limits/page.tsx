"use client";
import React, { useState, useEffect } from "react";
import { Row, Col, Card, Progress, Button, Typography, Modal, Form, Input, message, Space } from "antd";
import { 
  EditOutlined, 
  WalletOutlined, 
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import CustomMenu from "@/components/CustomMenu";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

// Mock de dados para categorias e seus limites
const MOCK_LIMITS = [
  { id: 1, category: "Alimentação", current: 850, limit: 1200, icon: "🍔", color: "#6C5DD3" },
  { id: 2, category: "Lazer", current: 450, limit: 500, icon: "🎮", color: "#FF754C" },
  { id: 3, category: "Transporte", current: 200, limit: 400, icon: "🚗", color: "#3F8CFF" },
  { id: 4, category: "Educação", current: 600, limit: 1000, icon: "📚", color: "#00C92C" },
  { id: 5, category: "Saúde", current: 150, limit: 800, icon: "🏥", color: "#FFB547" },
  { id: 6, category: "Assinaturas", current: 120, limit: 200, icon: "📱", color: "#8E82EF" },
];

const LimitsPage = () => {
  const router = useRouter();
  const [limits, setLimits] = useState(MOCK_LIMITS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<any>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleEditLimit = (limit: any) => {
    setEditingLimit(limit);
    setIsModalOpen(true);
  };

  const handleSaveLimit = (values: any) => {
    const newLimitValue = parseFloat(values.limit);
    setLimits(prev => prev.map(item => 
      item.id === editingLimit.id ? { ...item, limit: newLimitValue } : item
    ));
    message.success(`Limite de ${editingLimit.category} atualizado!`);
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh", background: "#F4F5F7" }}>
      <CustomMenu />
      <div style={{ flex: 1, padding: "40px", overflowX: "hidden" }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.push("/")}
              style={{ borderRadius: "10px", height: "40px", width: "40px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            />
            <div>
              <Title level={2} style={{ margin: 0, color: "#11142D" }}>Limite de Gastos</Title>
              <Text type="secondary">Defina quanto você pretende gastar em cada categoria por mês.</Text>
            </div>
          </div>
        </motion.div>

        <Row gutter={[24, 24]}>
          {limits.map((item, index) => {
            const percentage = Math.min((item.current / item.limit) * 100, 100);
            const isNearLimit = percentage >= 80 && percentage < 100;
            const isOverLimit = percentage >= 100;

            return (
              <Col xs={24} md={12} xl={8} key={item.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    hoverable
                    style={{ borderRadius: "20px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
                    bodyStyle={{ padding: "24px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ 
                          width: "48px", 
                          height: "48px", 
                          borderRadius: "14px", 
                          background: `${item.color}15`, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          fontSize: "24px"
                        }}>
                          {item.icon}
                        </div>
                        <div>
                          <Text strong style={{ fontSize: "16px", color: "#11142D" }}>{item.category}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: "12px" }}>Mensal</Text>
                        </div>
                      </div>
                      <Button 
                        type="text" 
                        icon={<EditOutlined style={{ color: "#6C5DD3" }} />} 
                        onClick={() => handleEditLimit(item)}
                        style={{ background: "#F4F5F7", borderRadius: "10px" }}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: "13px" }}>Gasto atual</Text>
                        <Text strong style={{ fontSize: "13px", color: isOverLimit ? "#DE350B" : "#11142D" }}>
                          {formatCurrency(item.current)}
                        </Text>
                      </div>
                      <Progress 
                        percent={percentage} 
                        strokeColor={isOverLimit ? "#DE350B" : (isNearLimit ? "#FFB547" : "#6C5DD3")}
                        showInfo={false}
                        strokeWidth={10}
                        style={{ marginBottom: 8 }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: "12px", color: "#808191" }}>
                          {percentage.toFixed(0)}% utilizado
                        </Text>
                        <Text strong style={{ fontSize: "12px", color: "#808191" }}>
                          Limite: {formatCurrency(item.limit)}
                        </Text>
                      </div>
                    </div>

                    {isOverLimit && (
                      <div style={{ 
                        background: "#FFEBE6", 
                        padding: "8px 12px", 
                        borderRadius: "10px", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 8,
                        marginTop: 12
                      }}>
                        <WarningOutlined style={{ color: "#DE350B" }} />
                        <Text style={{ fontSize: "12px", color: "#DE350B", fontWeight: 500 }}>
                          Você ultrapassou o limite!
                        </Text>
                      </div>
                    )}

                    {isNearLimit && !isOverLimit && (
                      <div style={{ 
                        background: "#FFF4E5", 
                        padding: "8px 12px", 
                        borderRadius: "10px", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 8,
                        marginTop: 12
                      }}>
                        <InfoCircleOutlined style={{ color: "#FFB547" }} />
                        <Text style={{ fontSize: "12px", color: "#FFB547", fontWeight: 500 }}>
                          Atenção: Próximo ao limite.
                        </Text>
                      </div>
                    )}
                  </Card>
                </motion.div>
              </Col>
            );
          })}
        </Row>

        <Modal
          title={`Editar Limite - ${editingLimit?.category}`}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          centered
          width={400}
        >
          <Form
            layout="vertical"
            onFinish={handleSaveLimit}
            initialValues={{ limit: editingLimit?.limit }}
            key={editingLimit?.id}
          >
            <Form.Item
              label="Novo Limite Mensal"
              name="limit"
              rules={[{ required: true, message: "Por favor, insira o valor do limite!" }]}
            >
              <Input 
                type="number" 
                prefix="R$" 
                size="large" 
                style={{ borderRadius: "10px" }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={() => setIsModalOpen(false)} style={{ borderRadius: "10px" }}>
                  Cancelar
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  style={{ background: "#6C5DD3", borderColor: "#6C5DD3", borderRadius: "10px" }}
                >
                  Salvar Alterações
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default LimitsPage;
