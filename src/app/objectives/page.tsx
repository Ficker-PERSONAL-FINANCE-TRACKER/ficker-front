"use client";

import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  message,
  Empty,
  Spin,
  Button,
  Progress,
  Tag,
  Popconfirm,
} from "antd";
import CustomMenu from "@/components/CustomMenu";
import { request } from "@/service/api";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import styles from "./objectives.module.scss";
import {
  MONTH_OPTIONS,
  Objective,
  ObjectiveModalManager,
  objectiveTypes,
  useObjectiveModalManager,
} from "@/components/ObjectiveModalManager";

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
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const objectiveModalManager = useObjectiveModalManager({ onSaved: loadObjectives });
  const { objectiveTypeMap } = objectiveModalManager;

  useEffect(() => {
    dayjs.locale("pt-br");
    loadObjectives();
  }, []);

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
                          <Button type="text" icon={<EditOutlined />} onClick={() => objectiveModalManager.handleOpenEditModal(objective)} />
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
                  onClick={objectiveModalManager.openTypesModal} 
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
                  <Card hoverable className={styles.objectiveCard} onClick={() => objectiveModalManager.handleOpenCreateModal(type)}>
                    <div className={styles.cardContent}>
                      <div className={styles.iconWrapper}>{type.icon}</div>
                      <span className={styles.cardTitle}>{type.title}</span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>
        )}
        <ObjectiveModalManager manager={objectiveModalManager} />
      </div>
    </div>
  );
};

export default ObjectivesPage;
