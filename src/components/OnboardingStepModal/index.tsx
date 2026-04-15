"use client";

import React, { useEffect, useState } from "react";
import { Modal, Steps, Form, InputNumber, Select, Button, Input, Card, Row, Col, message, Space, Typography } from "antd";
import { request } from "@/service/api";
import { UserOutlined, DollarOutlined, CreditCardOutlined, RocketOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface OnboardingStepModalProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingStepModal: React.FC<OnboardingStepModalProps> = ({ open, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formSalary] = Form.useForm();
  const [formGoal] = Form.useForm();
  const [formCard] = Form.useForm();
  const [formObjective] = Form.useForm();

  const [cardsData, setCardsData] = useState<any[]>([]);
  const [objectivesData, setObjectivesData] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      const { data } = await request({ method: "GET", endpoint: "user" });
      if (data?.data?.recurring_income) {
        formSalary.setFieldsValue({
          recurring_income: data.data.recurring_income,
          description: data.data.income_description || "Salario",
        });
      }
    } catch {
      console.log("No salary data yet");
    }

    try {
      const { data } = await request({ method: "GET", endpoint: "balance" });
      if (data?.data?.planned_spending) {
        formGoal.setFieldsValue({ planned_spending: data.data.planned_spending });
      }
    } catch {
      console.log("No goal data yet");
    }

    try {
      const { data } = await request({ method: "GET", endpoint: "card/all" });
      if (data?.data?.cards) {
        setCardsData(data.data.cards);
      }
    } catch {
      console.log("No cards data yet");
    }

    try {
      const { data } = await request({ method: "GET", endpoint: "objectives" });
      if (data?.data?.objectives) {
        setObjectivesData(data.data.objectives);
      }
    } catch {
      console.log("No objectives data yet");
    }
  };

  const handleSaveSalary = async () => {
    setLoading(true);
    try {
      const values = formSalary.getFieldsValue();
      await request({
        method: "PUT",
        endpoint: "user",
        data: {
          recurring_income: values.recurring_income,
          income_description: values.description,
        },
      });
      message.success("Salario configurado com sucesso!");
      setCurrentStep(1);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Erro ao salvar salario.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    setLoading(true);
    try {
      const values = formGoal.getFieldsValue();
      await request({
        method: "PUT",
        endpoint: "balance",
        data: {
          planned_spending: values.planned_spending,
        },
      });
      message.success("Meta de gasto configurada com sucesso!");
      setCurrentStep(2);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Erro ao salvar meta.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async () => {
    setLoading(true);
    try {
      const values = formCard.getFieldsValue();
      if (values.last_digits && values.flag_id) {
        await request({
          method: "POST",
          endpoint: "card",
          data: {
            last_digits: values.last_digits,
            flag_id: values.flag_id,
            invoice: 0,
          },
        });
        message.success("Cartao adicionado com sucesso!");
        loadInitialData();
      }
      setCurrentStep(3);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Erro ao salvar cartao.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveObjective = async () => {
    setLoading(true);
    try {
      const values = formObjective.getFieldsValue();
      if (values.name && values.total_value) {
        await request({
          method: "POST",
          endpoint: "objectives",
          data: {
            name: values.name,
            total_value: values.total_value,
            current_saved: values.current_saved || 0,
            type: values.type || "other",
          },
        });
        message.success("Objetivo adicionado com sucesso!");
      }
      await completeOnboarding();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Erro ao salvar objetivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipObjective = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await request({
        method: "POST",
        endpoint: "onboarding/complete",
      });
      message.success("Configuracao inicial concluida!");
      onComplete();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Erro ao finalizar configuracao.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipCard = () => {
    setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { title: "Salario", icon: <UserOutlined /> },
    { title: "Meta", icon: <DollarOutlined /> },
    { title: "Cartao", icon: <CreditCardOutlined /> },
    { title: "Objetivos", icon: <RocketOutlined /> },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ padding: "20px 0" }}>
            <Title level={4} style={{ marginBottom: 8 }}>Qual e o seu salario?</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
              Informe sua renda mensal para ajudar a planejar seus gastos.
            </Text>
            <Form form={formSalary} layout="vertical">
              <Form.Item
                name="recurring_income"
                label="Renda Recorrente (R$)"
                rules={[{ required: true, message: "Informe sua renda mensal" }]}
              >
                <InputNumber
                  style={{ width: "100%", height: 48 }}
                  placeholder="Ex: 5000"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value: any) => value?.replace(/\$\s?|(,*)/g, "") as any}
                />
              </Form.Item>
              <Form.Item
                name="description"
                label="Descricao (opcional)"
              >
                <Input placeholder="Ex: Salario, Freelance..." />
              </Form.Item>
            </Form>
          </div>
        );

      case 1:
        return (
          <div style={{ padding: "20px 0" }}>
            <Title level={4} style={{ marginBottom: 8 }}>Qual e sua meta de gasto?</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
              Defina quanto voce planeja gastar por mes para manter suas financas sob controle.
            </Text>
            <Form form={formGoal} layout="vertical">
              <Form.Item
                name="planned_spending"
                label="Meta de Gasto Mensal (R$)"
                rules={[{ required: true, message: "Informe sua meta de gasto" }]}
              >
                <InputNumber
                  style={{ width: "100%", height: 48 }}
                  placeholder="Ex: 3000"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value: any) => value?.replace(/\$\s?|(,*)/g, "") as any}
                />
              </Form.Item>
            </Form>
          </div>
        );

      case 2:
        return (
          <div style={{ padding: "20px 0" }}>
            <Title level={4} style={{ marginBottom: 8 }}>Voce tem cartoes de credito?</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
              Adicione seus cartoes para acompanhar suas faturas.
            </Text>

            {cardsData.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Text strong>Seus cartoes:</Text>
                <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                  {cardsData.map((card) => (
                    <Col span={12} key={card.id}>
                      <Card size="small" style={{ background: "#f5f5f5", border: "none" }}>
                        <Text>**** {card.last_digits}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>Fatura: R$ {card.invoice?.toLocaleString() || 0}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            <Form form={formCard} layout="vertical">
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="last_digits"
                    label="Ultimos 4 digitos"
                  >
                    <Input maxLength={4} placeholder="1234" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="flag_id"
                    label="Bandeira"
                  >
                    <Select placeholder="Selecione">
                      <Select.Option value={3}>Mastercard</Select.Option>
                      <Select.Option value={4}>Visa</Select.Option>
                      <Select.Option value={5}>Hipercard</Select.Option>
                      <Select.Option value={6}>Elo</Select.Option>
                      <Select.Option value={7}>Alelo</Select.Option>
                      <Select.Option value={8}>Amex</Select.Option>
                      <Select.Option value={9}>Diners</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        );

      case 3:
        return (
          <div style={{ padding: "20px 0" }}>
            <Title level={4} style={{ marginBottom: 8 }}>Voce tem objetivos financeiros?</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
              Defina seus objetivos para acompanhar seu progresso.
            </Text>

            {objectivesData.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Text strong>Seus objetivos:</Text>
                <div style={{ marginTop: 12 }}>
                  {objectivesData.map((obj) => (
                    <Card size="small" key={obj.id} style={{ marginBottom: 8, background: "#f5f5f5", border: "none" }}>
                      <Text strong>{obj.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {obj.progress_percentage?.toFixed(0)}% - R$ {obj.current_saved?.toLocaleString()} / R$ {obj.total_value?.toLocaleString()}
                      </Text>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Form form={formObjective} layout="vertical">
              <Row gutter={12}>
                <Col span={16}>
                  <Form.Item
                    name="name"
                    label="Nome do objetivo"
                  >
                    <Input placeholder="Ex: Viagem, Casa propria..." />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="total_value"
                    label="Valor total (R$)"
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="50000"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(value: any) => value?.replace(/\$\s?|(,*)/g, "") as any}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      closable={false}
      footer={null}
      width={560}
      centered
      bodyStyle={{ padding: "24px" }}
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src="/logo.png" alt="Ficker" style={{ height: 40, marginBottom: 16 }} />
        <Title level={3} style={{ marginBottom: 4 }}>Configure sua conta</Title>
        <Text type="secondary">Precisamos de algumas informacoes para personalizar sua experiencia.</Text>
      </div>

      <Steps
        current={currentStep}
        items={steps}
        style={{ marginBottom: 32 }}
      />

      {renderStepContent()}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <div>
          {currentStep > 0 && (
            <Button onClick={handleBack}>
              Voltar
            </Button>
          )}
        </div>
        <Space>
          {currentStep === 2 && (
            <Button onClick={handleSkipCard}>
              Pular
            </Button>
          )}
          {currentStep === 3 && (
            <Button onClick={handleSkipObjective}>
              Pular
            </Button>
          )}
          {currentStep < 3 ? (
            <Button
              type="primary"
              loading={loading}
              onClick={
                currentStep === 0
                  ? handleSaveSalary
                  : currentStep === 1
                    ? handleSaveGoal
                    : handleSaveCard
              }
              style={{ background: "#6C5DD3", borderColor: "#6C5DD3" }}
            >
              Continuar
            </Button>
          ) : (
            <Button
              type="primary"
              loading={loading}
              onClick={handleSaveObjective}
              style={{ background: "#6C5DD3", borderColor: "#6C5DD3" }}
            >
              Finalizar
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default OnboardingStepModal;
