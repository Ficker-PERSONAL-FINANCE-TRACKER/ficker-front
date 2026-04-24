"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Empty,
  Spin,
  Button,
  Progress,
  Tag,
  Popconfirm,
  Select,
} from "antd";
import CustomMenu from "@/components/CustomMenu";
import { request } from "@/service/api";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import {
  UserOutlined,
  HomeOutlined,
  CarOutlined,
  GlobalOutlined,
  ShoppingOutlined,
  EllipsisOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import styles from "./objectives.module.scss";

type ObjectiveTypeId = "retirement" | "house" | "car" | "travel" | "item" | "investment" | "succession" | "other";

interface ObjectiveType {
  id: ObjectiveTypeId;
  title: string;
  icon: React.ReactNode;
  isRetirement?: boolean;
}

type Objective = {
  id: number;
  user_id: number;
  type: ObjectiveTypeId;
  name: string;
  total_value: number | null;
  monthly_income: number | null;
  current_saved: number;
  birth_date: string | null;
  retirement_age: number | null;
  target_year: number | null;
  target_month: number | null;
  progress_percentage: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  recommendations?: {
    current_age: number;
    years_until_retirement: number;
    estimated_required_corpus: number;
    gap_to_target: number;
    recommended_monthly_contribution: number;
  };
};

type ObjectiveFormValues = {
  name: string;
  total_value?: number;
  monthly_income?: number;
  current_saved?: number;
  birth_date?: Dayjs;
  retirement_age?: number;
  target_year?: number;
  target_month?: number;
};

const MONTH_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

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

const currencyFormatter = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "";
  return `R$ ${String(value)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const currencyParser = (value?: string) => {
  if (!value) return "";
  return value.replace(/R\$\s?|\./g, "").replace(",", ".");
};

const formatCurrency = (value?: number | null) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getApiErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ?? error?.response?.data?.data?.message ?? fallback;

const getMonthLabel = (month?: number | null) =>
  MONTH_OPTIONS.find((option) => option.value === month)?.label ?? "Mês não definido";

const getContributionRecommendation = (objective: Objective) => {
  if (objective.type === "retirement" || !objective.target_year || !objective.target_month || !objective.total_value) {
    return null;
  }

  const currentMonthStart = dayjs().startOf("month");
  const targetMonthStart = dayjs(`${objective.target_year}-${String(objective.target_month).padStart(2, "0")}-01`).startOf("month");
  const remainingAmount = Math.max(Number(objective.total_value) - Number(objective.current_saved || 0), 0);
  const monthsLeft = Math.max(targetMonthStart.diff(currentMonthStart, "month") + 1, 1);
  const currentYear = currentMonthStart.year();
  const targetYear = targetMonthStart.year();
  const yearSpan = targetYear > currentYear ? targetYear - currentYear + 1 : 0;

  return {
    remainingAmount,
    monthsLeft,
    monthlyAmount: remainingAmount / monthsLeft,
    annualAmount: yearSpan > 0 ? remainingAmount / yearSpan : null,
    annualYears: yearSpan,
  };
};

const getRetirementTimeLeft = (objective: Objective) => {
  if (objective.type !== "retirement" || !objective.birth_date || !objective.retirement_age) {
    return null;
  }

  const today = dayjs();
  const birthDate = dayjs(objective.birth_date);
  const retirementDate = birthDate.add(objective.retirement_age, "year");

  if (retirementDate.isBefore(today)) {
    return { years: 0, months: 0 };
  }

  const fullYears = retirementDate.diff(today, "year");
  const afterYears = today.add(fullYears, "year");
  const fullMonths = retirementDate.diff(afterYears, "month");

  return {
    years: fullYears,
    months: Math.max(fullMonths, 0),
  };
};

const formatTimeLeft = (years: number, months: number) => {
  if (years === 0 && months === 0) {
    return "Prazo já alcançado";
  }

  if (years === 0) {
    return `Faltam ${months} ${months === 1 ? "mês" : "meses"}`;
  }

  if (months === 0) {
    return `Faltam ${years} ${years === 1 ? "ano" : "anos"}`;
  }

  return `Faltam ${years} ${years === 1 ? "ano" : "anos"} e ${months} ${months === 1 ? "mês" : "meses"}`;
};

const ObjectivesPage = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ObjectiveType | null>(null);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form] = Form.useForm<ObjectiveFormValues>();

  const objectiveTypeMap = useMemo(
    () => Object.fromEntries(objectiveTypes.map((type) => [type.id, type])) as Record<ObjectiveTypeId, ObjectiveType>,
    []
  );

  const yearOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => currentYear + index).map((year) => ({ value: year, label: String(year) })),
    [currentYear]
  );

  const selectedTargetYear = Form.useWatch("target_year", form);

  const monthOptions = useMemo(
    () => MONTH_OPTIONS.map((option) => ({
      ...option,
      disabled: Number(selectedTargetYear) === currentYear && option.value < currentMonth,
    })),
    [currentMonth, currentYear, selectedTargetYear]
  );

  const loadObjectives = async () => {
    setLoading(true);

    try {
      const response = await request({ method: "GET", endpoint: "objectives" });
      setObjectives(response?.data?.data?.objectives ?? []);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Não foi possível carregar os objetivos."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dayjs.locale("pt-br");
    loadObjectives();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingObjective(null);
    setSelectedType(null);
    form.resetFields();
  };

  const handleOpenCreateModal = (type: ObjectiveType) => {
    setEditingObjective(null);
    setSelectedType(type);
    form.resetFields();
    form.setFieldsValue({
      name: type.title,
      current_saved: 0,
      target_year: currentYear,
      target_month: currentMonth,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (objective: Objective) => {
    const type = objectiveTypeMap[objective.type];
    setEditingObjective(objective);
    setSelectedType(type);
    form.resetFields();
    form.setFieldsValue({
      name: objective.name,
      total_value: objective.total_value ?? undefined,
      monthly_income: objective.monthly_income ?? undefined,
      current_saved: objective.current_saved ?? 0,
      birth_date: objective.birth_date ? dayjs(objective.birth_date) : undefined,
      retirement_age: objective.retirement_age ?? undefined,
      target_year: objective.target_year ?? undefined,
      target_month: objective.target_month ?? undefined,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedType) {
      message.error("Selecione um tipo de objetivo.");
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (!selectedType.isRetirement && Number(values.target_year) === currentYear && Number(values.target_month) < currentMonth) {
        message.error("Não escolha um mês anterior ao atual para objetivos no ano corrente.");
        return;
      }

      const payload = {
        type: selectedType.id,
        name: values.name,
        current_saved: Number(values.current_saved || 0),
        total_value: selectedType.isRetirement ? undefined : Number(values.total_value || 0),
        target_year: selectedType.isRetirement ? undefined : Number(values.target_year),
        target_month: selectedType.isRetirement ? undefined : Number(values.target_month),
        monthly_income: selectedType.isRetirement ? Number(values.monthly_income || 0) : undefined,
        birth_date: selectedType.isRetirement && values.birth_date ? values.birth_date.format("YYYY-MM-DD") : undefined,
        retirement_age: selectedType.isRetirement ? Number(values.retirement_age) : undefined,
      };

      await request({
        method: editingObjective ? "PUT" : "POST",
        endpoint: editingObjective ? `objectives/${editingObjective.id}` : "objectives",
        data: payload,
      });

      message.success(editingObjective ? "Objetivo atualizado com sucesso!" : "Objetivo definido com sucesso!");
      closeModal();
      await loadObjectives();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }

      message.error(getApiErrorMessage(error, "Não foi possível salvar o objetivo."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteObjective = async (objectiveId: number) => {
    setDeletingId(objectiveId);

    try {
      await request({ method: "DELETE", endpoint: `objectives/${objectiveId}` });
      message.success("Objetivo removido com sucesso!");
      await loadObjectives();
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Não foi possível remover o objetivo."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.pageShell}>
      <CustomMenu />
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Objetivos</h2>
            <p className={styles.pageSubtitle}>Crie, acompanhe e edite os objetivos que você quer tirar do papel.</p>
          </div>
          <div className={styles.counterWrapper}>
            <span className={styles.counterTag}>{objectives.length} planos em andamento</span>
          </div>
        </div>

        {loading ? (
            <section className={styles.sectionBlock}>
              <div className={styles.loadingArea}>
                <Spin size="large" />
              </div>
            </section>
          ) : objectives.length > 0 ? (
            <section className={styles.sectionBlock}>
              <Row gutter={[24, 24]}>
                {objectives.map((objective) => {
                  const type = objectiveTypeMap[objective.type];
                  const progress = Math.max(0, Math.min(Number(objective.progress_percentage ?? 0), 100));
                  const recommendation = getContributionRecommendation(objective);
                const retirementTimeLeft = getRetirementTimeLeft(objective);

                return (
                  <Col xs={24} lg={12} xl={8} key={objective.id}>
                    <Card className={styles.savedObjectiveCard} bordered={false}>
                      <div className={styles.savedObjectiveHeader}>
                        <div className={styles.savedObjectiveIdentity}>
                          <div className={styles.savedObjectiveIcon}>{type?.icon}</div>
                          <div>
                            <h4 className={styles.savedObjectiveTitle}>{objective.name}</h4>
                            <span className={styles.savedObjectiveType}>{type?.title ?? objective.type}</span>
                          </div>
                        </div>
                        <div className={styles.savedObjectiveActions}>
                          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEditModal(objective)} />
                          <Popconfirm
                            title="Remover objetivo"
                            description="Essa ação não pode ser desfeita."
                            okText="Remover"
                            cancelText="Cancelar"
                            onConfirm={() => handleDeleteObjective(objective.id)}
                          >
                            <Button type="text" danger icon={<DeleteOutlined />} loading={deletingId === objective.id} />
                          </Popconfirm>
                        </div>
                      </div>

                      <div className={styles.savedObjectiveMetrics}>
                        {objective.type === "retirement" ? (
                          <>
                            <div className={styles.metricRow}>
                              <span>Renda mensal desejada</span>
                              <strong>{formatCurrency(objective.monthly_income)}</strong>
                            </div>
                            <div className={styles.metricRow}>
                              <span>Valor já guardado</span>
                              <strong>{formatCurrency(objective.current_saved)}</strong>
                            </div>
                            <div className={styles.metricRow}>
                              <span>Meta de aposentadoria</span>
                              <strong>{objective.retirement_age ? `${objective.retirement_age} anos` : "Não definida"}</strong>
                            </div>
                            <div className={styles.metricRow}>
                              <span>Idade atual</span>
                              <strong>{objective.recommendations?.current_age ? `${objective.recommendations.current_age} anos` : (objective.birth_date ? `${dayjs().diff(dayjs(objective.birth_date), 'year')} anos` : "Não informada")}</strong>
                            </div>
                            <div className={styles.metricRow}>
                              <span>Prazo estimado</span>
                              <strong>
                                {objective.recommendations?.years_until_retirement !== undefined
                                  ? `Faltam ${objective.recommendations.years_until_retirement} anos`
                                  : (retirementTimeLeft === null
                                    ? "Não disponível"
                                    : formatTimeLeft(retirementTimeLeft.years, retirementTimeLeft.months))}
                              </strong>
                            </div>

                            {objective.recommendations && (
                              <div className={styles.recommendationBox} style={{ marginTop: 16 }}>
                                <strong>Recomendações para sua aposentadoria</strong>
                                <div className={styles.metricRow} style={{ padding: "4px 0" }}>
                                  <span>Patrimônio necessário</span>
                                  <strong>{formatCurrency(objective.recommendations.estimated_required_corpus)}</strong>
                                </div>
                                <div className={styles.metricRow} style={{ padding: "4px 0" }}>
                                  <span>Falta acumular</span>
                                  <strong>{formatCurrency(objective.recommendations.gap_to_target)}</strong>
                                </div>
                                <div className={styles.metricRow} style={{ padding: "4px 0", borderBottom: "none" }}>
                                  <span>Aporte mensal sugerido</span>
                                  <strong style={{ color: "#6C5DD3" }}>{formatCurrency(objective.recommendations.recommended_monthly_contribution)}</strong>
                                </div>
                                <span style={{ fontSize: "11px", color: "#666", marginTop: "8px", display: "block" }}>
                                  * Cálculo baseado na regra dos 4% ao ano.
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className={styles.metricRow}>
                              <span>Guardado até agora</span>
                              <strong>{formatCurrency(objective.current_saved)}</strong>
                            </div>
                            <div className={styles.metricRow}>
                              <span>Valor total do objetivo</span>
                              <strong>{formatCurrency(objective.total_value)}</strong>
                            </div>
                            <div className={styles.metricRow}>
                              <span>Prazo final</span>
                              <strong>
                                {objective.target_month && objective.target_year
                                  ? `${getMonthLabel(objective.target_month)} de ${objective.target_year}`
                                  : "Não definido"}
                              </strong>
                            </div>
                            <Progress
                              percent={progress}
                              showInfo={false}
                              strokeColor="#6C5DD3"
                              trailColor="#ECEAFB"
                              strokeWidth={8}
                            />
                            <div className={styles.progressFooter}>
                              <span>{formatCurrency(objective.current_saved)} acumulados</span>
                              <strong>{progress.toFixed(1)}% concluído</strong>
                            </div>
                            {recommendation ? (
                              <div className={styles.recommendationBox}>
                                <strong>Para completar seu objetivo</strong>
                                <span>Faltam {formatCurrency(recommendation.remainingAmount)} para chegar ao valor final.</span>
                                <span>
                                  {recommendation.monthsLeft === 1
                                    ? `Junte ${formatCurrency(recommendation.monthlyAmount)} até o final deste mês.`
                                    : `Junte ${formatCurrency(recommendation.monthlyAmount)} por mês até o prazo final.`}
                                </span>
                                {recommendation.annualAmount !== null ? (
                                  <span>
                                    Ou, se preferir uma visão anual, reserve cerca de {formatCurrency(recommendation.annualAmount)} por ano até o prazo final.
                                  </span>
                                ) : null}
                                <span>O cálculo considera meses fechados e só muda na virada do mês.</span>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
              <Col xs={24} lg={12} xl={8}>
                <Card 
                  hoverable 
                  onClick={() => setIsTypesModalOpen(true)} 
                  style={{ 
                    height: "100%", 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    border: "2px dashed #e6e2ff", 
                    cursor: "pointer", 
                    background: "transparent",
                    minHeight: "250px",
                    borderRadius: "20px"
                  }}
                >
                  <div style={{ textAlign: "center", color: "#6c5dd3", fontSize: "16px", fontWeight: "600" }}>
                    <div style={{ fontSize: "40px", marginBottom: "8px", fontWeight: "300" }}>+</div>
                    Novo objetivo
                  </div>
                </Card>
              </Col>
              </Row>
           </section>
        ) : null}

        {!loading && objectives.length === 0 && (
          <section className={styles.sectionBlock}>

            <Row gutter={[24, 24]}>
              {objectiveTypes.map((type) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={type.id}>
                  <Card hoverable className={styles.objectiveCard} onClick={() => handleOpenCreateModal(type)}>
                    <div className={styles.cardContent}>
                      <div className={styles.iconWrapper}>{type.icon}</div>
                      <span className={styles.cardTitle}>{type.title}</span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>
        )}        <Modal
          title={editingObjective ? "Editar objetivo" : "Defina seu objetivo"}
          open={isModalOpen}
          onOk={handleSave}
          onCancel={closeModal}
          okText={editingObjective ? "Salvar alterações" : "Salvar objetivo"}
          cancelText="Cancelar"
          centered
          width={460}
          confirmLoading={submitting}
          okButtonProps={{
            style: { background: "#6C5DD3", width: "100%", height: 45, borderRadius: 8, marginTop: 20 },
            className: styles.modalOkBtn,
          }}
          cancelButtonProps={{ style: { display: "none" } }}
        >
          <div className={styles.modalIntro}>
            <span className={styles.modalTypeBadge}>{selectedType?.title ?? "Objetivo"}</span>
            <p className={styles.modalDescription}>
              {selectedType?.isRetirement
                ? "Preencha os dados da aposentadoria para acompanhar esse plano com mais clareza."
                : "Informe quanto esse objetivo exige e até quando você quer concluir esse plano."}
            </p>
          </div>

          <Form form={form} layout="vertical" className={styles.modalForm}>
            <Form.Item name="name" label="Nome do objetivo" rules={[{ required: true, message: "Informe o nome do objetivo" }]}>
              <Input placeholder="Exemplo: Comprar um carro" className={styles.input} />
            </Form.Item>

            {selectedType?.isRetirement ? (
              <>
                <Form.Item name="monthly_income" label="Com que renda mensal quero viver?" rules={[{ required: true, message: "Informe a renda mensal desejada" }]}>
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="Exemplo: 20.000,00"
                    className={styles.input}
                    formatter={currencyFormatter}
                    parser={currencyParser}
                  />
                </Form.Item>
                <Form.Item name="current_saved" label="Valor que você já guardou">
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="Exemplo: 10.000,00"
                    className={styles.input}
                    formatter={currencyFormatter}
                    parser={currencyParser}
                  />
                </Form.Item>
                <Form.Item name="birth_date" label="Data de nascimento" rules={[{ required: true, message: "Informe a data de nascimento" }]}>
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Exemplo: 20/09/1992" className={styles.input} />
                </Form.Item>
                <Form.Item name="retirement_age" label="Idade que deseja se aposentar" rules={[{ required: true, message: "Informe a idade desejada" }]}>
                  <InputNumber style={{ width: "100%" }} placeholder="Exemplo: 60" className={styles.input} />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="total_value" label="Valor total do objetivo" rules={[{ required: true, message: "Informe o valor total do objetivo" }]}>
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="Exemplo: 20.000,00"
                    className={styles.input}
                    formatter={currencyFormatter}
                    parser={currencyParser}
                  />
                </Form.Item>
                <Form.Item name="current_saved" label="Valor que você já guardou">
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="Exemplo: 10.000,00"
                    className={styles.input}
                    formatter={currencyFormatter}
                    parser={currencyParser}
                  />
                </Form.Item>
                <div className={styles.fieldRow}>
                  <Form.Item
                    name="target_month"
                    label="Mês final do objetivo"
                    rules={[{ required: true, message: "Informe o mês final do objetivo" }]}
                  >
                    <Select options={monthOptions} placeholder="Selecione o mês" />
                  </Form.Item>
                  <Form.Item
                    name="target_year"
                    label="Ano final do objetivo"
                    rules={[{ required: true, message: "Informe o ano final do objetivo" }]}
                  >
                    <Select options={yearOptions} placeholder="Selecione o ano" />
                  </Form.Item>
                </div>
              </>
            )}
          </Form>
        </Modal>

        <Modal
          title="Escolha o tipo de objetivo"
          open={isTypesModalOpen}
          onCancel={() => setIsTypesModalOpen(false)}
          footer={null}
          width={600}
          centered
        >
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            {objectiveTypes.map((type) => (
              <Col xs={24} sm={12} md={8} key={type.id}>
                <Card 
                  hoverable 
                  className={styles.objectiveCard} 
                  onClick={() => {
                    setIsTypesModalOpen(false);
                    handleOpenCreateModal(type);
                  }}
                  bodyStyle={{ padding: "16px 0" }}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.iconWrapper} style={{ width: 48, height: 48, fontSize: 20 }}>{type.icon}</div>
                    <span className={styles.cardTitle} style={{ fontSize: 13 }}>{type.title}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal>
      </div>
    </div>
  );
};

export default ObjectivesPage;
