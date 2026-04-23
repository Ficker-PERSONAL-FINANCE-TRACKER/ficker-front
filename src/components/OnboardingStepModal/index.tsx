"use client";

import React from "react";
import { Steps, Button, Space, Typography } from "antd";
import { UserOutlined, DollarOutlined, CreditCardOutlined, RocketOutlined } from "@ant-design/icons";
import { useOnboardingActions } from "./useOnboardingActions";
import { SalaryStep } from "./steps/SalaryStep";
import { GoalStep } from "./steps/GoalStep";
import { CardStep } from "./steps/CardStep";
import { ObjectiveStep } from "./steps/ObjectiveStep";
import styles from "./styles.module.scss";

const { Title, Text } = Typography;

interface OnboardingStepModalProps {
  open: boolean;
  onComplete: () => void;
}

const stepsConfig = [
  { title: "Salario", icon: <UserOutlined /> },
  { title: "Meta", icon: <DollarOutlined /> },
  { title: "Cartao", icon: <CreditCardOutlined /> },
  { title: "Objetivos", icon: <RocketOutlined /> },
];

const OnboardingStepModal: React.FC<OnboardingStepModalProps> = ({ open, onComplete }) => {
  const actions = useOnboardingActions(open, onComplete);

  if (!open) return null;

  const renderStepContent = () => {
    switch (actions.currentStep) {
      case 0:
        return (
          <SalaryStep 
            form={actions.formSalary} 
            categories={actions.categories} 
            showDescriptionCategory={actions.showDescriptionCategory}
            setShowDescriptionCategory={actions.setShowDescriptionCategory}
          />
        );
      case 1:
        return <GoalStep form={actions.formGoal} />;
      case 2:
        return <CardStep form={actions.formCard} cardsData={actions.cardsData} />;
      case 3:
        return <ObjectiveStep form={actions.formObjective} objectivesData={actions.objectivesData} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <div className={styles.logoWrapper}>
          <img src="/logo.png" alt="Logo" />
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.formCard}>
          <div className={styles.titleArea}>
            <Title level={3}>Configure sua conta</Title>
            <Text type="secondary">Precisamos de algumas informacoes para personalizar sua experiencia.</Text>
          </div>

          <Steps
            current={actions.currentStep}
            items={stepsConfig}
            style={{ marginBottom: 8 }}
          />

          {renderStepContent()}

          <div className={styles.footerActions}>
            <div>
              {actions.currentStep > 0 && (
                <Button onClick={actions.handleBack} className={styles.secondaryButton}>
                  Voltar
                </Button>
              )}
            </div>
            <Space>
              {actions.currentStep === 2 && (
                <Button onClick={actions.handleSkipCard} className={styles.secondaryButton}>
                  Pular
                </Button>
              )}
              {actions.currentStep === 3 && (
                <Button onClick={actions.handleSkipObjective} className={styles.secondaryButton}>
                  Pular
                </Button>
              )}
              {actions.currentStep < 3 ? (
                <Button
                  type="primary"
                  loading={actions.loading}
                  onClick={
                    actions.currentStep === 0
                      ? actions.handleSaveSalary
                      : actions.currentStep === 1
                        ? actions.handleSaveGoal
                        : actions.handleSaveCard
                  }
                  className={styles.primaryButton}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  type="primary"
                  loading={actions.loading}
                  onClick={actions.handleSaveObjective}
                  className={styles.primaryButton}
                >
                  Finalizar
                </Button>
              )}
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStepModal;
