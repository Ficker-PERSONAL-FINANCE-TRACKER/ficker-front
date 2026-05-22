import React, { useMemo, useState } from "react";
import {
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  CarOutlined,
  EllipsisOutlined,
  GlobalOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { request } from "@/service/api";
import styles from "@/app/objectives/objectives.module.scss";

export type ObjectiveTypeId =
  | "retirement"
  | "house"
  | "car"
  | "travel"
  | "item"
  | "investment"
  | "succession"
  | "other";

export interface ObjectiveType {
  id: ObjectiveTypeId;
  title: string;
  icon: React.ReactNode;
  isRetirement?: boolean;
}

export type Objective = {
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

export const MONTH_OPTIONS = [
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

export const objectiveTypes: ObjectiveType[] = [
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

const getApiErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ?? error?.response?.data?.data?.message ?? fallback;

interface UseObjectiveModalManagerProps {
  onSaved?: () => void | Promise<void>;
}

export const useObjectiveModalManager = ({ onSaved }: UseObjectiveModalManagerProps = {}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ObjectiveType | null>(null);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    () =>
      MONTH_OPTIONS.map((option) => ({
        ...option,
        disabled: Number(selectedTargetYear) === currentYear && option.value < currentMonth,
      })),
    [currentMonth, currentYear, selectedTargetYear]
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingObjective(null);
    setSelectedType(null);
    form.resetFields();
  };

  const openTypesModal = () => setIsTypesModalOpen(true);

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
      await onSaved?.();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(getApiErrorMessage(error, "Não foi possível salvar o objetivo."));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    isModalOpen,
    isTypesModalOpen,
    selectedType,
    editingObjective,
    submitting,
    yearOptions,
    monthOptions,
    objectiveTypeMap,
    openTypesModal,
    setIsTypesModalOpen,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSave,
    closeModal,
  };
};

type ObjectiveModalManagerState = ReturnType<typeof useObjectiveModalManager>;

export const ObjectiveModalManager = ({ manager }: { manager: ObjectiveModalManagerState }) => (
  <>
    <Modal
      title={manager.editingObjective ? "Editar objetivo" : "Defina seu objetivo"}
      open={manager.isModalOpen}
      onOk={manager.handleSave}
      onCancel={manager.closeModal}
      okText={manager.editingObjective ? "Salvar alterações" : "Salvar objetivo"}
      cancelText="Cancelar"
      centered
      width={460}
      confirmLoading={manager.submitting}
      okButtonProps={{
        style: { background: "#6C5DD3", width: "100%", height: 45, borderRadius: 8, marginTop: 20 },
        className: styles.modalOkBtn,
      }}
      cancelButtonProps={{ style: { display: "none" } }}
    >
      <div className={styles.modalIntro}>
        <span className={styles.modalTypeBadge}>{manager.selectedType?.title ?? "Objetivo"}</span>
        <p className={styles.modalDescription}>
          {manager.selectedType?.isRetirement
            ? "Preencha os dados da aposentadoria para acompanhar esse plano com mais clareza."
            : "Informe quanto esse objetivo exige e até quando você quer concluir esse plano."}
        </p>
      </div>

      <Form form={manager.form} layout="vertical" className={styles.modalForm}>
        <Form.Item name="name" label="Nome do objetivo" rules={[{ required: true, message: "Informe o nome do objetivo" }]}>
          <Input placeholder="Exemplo: Comprar um carro" className={styles.input} />
        </Form.Item>

        {manager.selectedType?.isRetirement ? (
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
                <Select options={manager.monthOptions} placeholder="Selecione o mês" />
              </Form.Item>
              <Form.Item
                name="target_year"
                label="Ano final do objetivo"
                rules={[{ required: true, message: "Informe o ano final do objetivo" }]}
              >
                <Select options={manager.yearOptions} placeholder="Selecione o ano" />
              </Form.Item>
            </div>
          </>
        )}
      </Form>
    </Modal>

    <Modal
      title="Escolha o tipo de objetivo"
      open={manager.isTypesModalOpen}
      onCancel={() => manager.setIsTypesModalOpen(false)}
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
                manager.setIsTypesModalOpen(false);
                manager.handleOpenCreateModal(type);
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
  </>
);
