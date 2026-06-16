"use client";

import React from "react";
import { Steps, Button, Space, Typography } from "antd";
import { UserOutlined, DollarOutlined, CreditCardOutlined, RocketOutlined, LogoutOutlined } from "@ant-design/icons";
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
  { title: "Salário" },
  { title: "Metas" },
  { title: "Cartões" },
  { title: "Objetivos" },
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
        return <CardStep form={actions.formCard} cardsData={actions.cardsData} flags={actions.flags} onSkip={actions.handleSkipCard} />;
      case 3:
        return <ObjectiveStep form={actions.formObjective} objectivesData={actions.objectivesData} onSkip={actions.handleSkipObjective} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.topBar}>
        <div className={styles.logoWrapper}>
          <img src="/logo.png" alt="Logo" />
        </div>
        <Button 
          type="text" 
          icon={<LogoutOutlined />} 
          onClick={actions.handleLogout} 
          className={styles.logoutButton}
        >
          Sair
        </Button>
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.formCard}>
          <div className={styles.titleArea}>
            <div className={styles.welcomeEmoji}>🎉</div>
            <Title level={2} className={styles.mainTitle}>Olá! Chegou o momento de configurar sua conta</Title>
            <Text type="secondary">Precisamos de algumas informações para personalizar sua experiência e deixar o Ficker do seu jeito.</Text>
          </div>

          <div className={styles.customSteps}>
            {stepsConfig.map((step, index) => (
              <React.Fragment key={step.title}>
                <div className={`${styles.stepItem} ${index <= actions.currentStep ? styles.active : ''}`}>
                  <div className={styles.stepDot} />
                  <span className={styles.stepLabel}>{step.title}</span>
                </div>
                {index < stepsConfig.length - 1 && (
                  <div className={`${styles.stepLine} ${index < actions.currentStep ? styles.active : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className={styles.stepContentWrapper}>
            {renderStepContent()}
          </div>

          <div className={styles.footerActions}>
            <div>
              {actions.currentStep > 0 && (
                <Button onClick={actions.handleBack} className={styles.secondaryButton}>
                  Voltar
                </Button>
              )}
            </div>
            <Space>
              {actions.currentStep === 0 && (
                <Button onClick={actions.handleSkipSalary} type="text" className={styles.secondaryButton}>
                  Pular
                </Button>
              )}
              {actions.currentStep === 1 && (
                <Button onClick={actions.handleSkipGoal} type="text" className={styles.secondaryButton}>
                  Pular
                </Button>
              )}
              {actions.currentStep === 2 && (
                <Button onClick={actions.handleSkipCard} type="text" className={styles.secondaryButton}>
                  Pular
                </Button>
              )}
              {actions.currentStep === 3 && (
                <Button onClick={actions.handleSkipObjective} type="text" className={styles.secondaryButton}>
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
                  type="default"
                  loading={actions.loading}
                  onClick={actions.handleSaveObjective}
                  className={`${styles.primaryButton} accessibility-submit-btn`}
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
