import { useState, useEffect } from "react";
import { message, Form } from "antd";
import { request } from "@/service/api";

const normalizeCategoryName = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const extractCategoriesFromResponse = (response: any): any[] => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  if (Array.isArray(payload?.categories)) return payload.categories;
  return [];
};

export const useOnboardingActions = (open: boolean, onComplete: () => void) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDescriptionCategory, setShowDescriptionCategory] = useState(false);
  const [formSalary] = Form.useForm();
  const [formGoal] = Form.useForm();
  const [formCard] = Form.useForm();
  const [formObjective] = Form.useForm();

  const [categories, setCategories] = useState<any[]>([]);
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
      const response = await request({ method: "GET", endpoint: "categories/type/1" });
      setCategories(extractCategoriesFromResponse(response));
    } catch {
      console.log("No categories data yet");
    }

    try {
      const { data } = await request({ method: "GET", endpoint: "user" });
      if (data?.data?.recurring_income) {
        // Keeping this just in case, but form changed
      }
    } catch {
      console.log("No salary data yet");
    }

    try {
      const { data } = await request({ method: "GET", endpoint: "spending" });
      if (data?.data?.planned_spending || data?.planned_spending) {
        formGoal.setFieldsValue({ planned_spending: data?.data?.planned_spending || data?.planned_spending });
      }
    } catch {
      console.log("No goal data yet");
    }

    try {
      const { data } = await request({ method: "GET", endpoint: "cards" });
      if (data?.data?.cards || data?.cards) {
        setCardsData(data?.data?.cards || data?.cards || data?.data || data);
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

  const resolveCategoryPayload = (values: Record<string, any>) => {
    const rawCategoryId = values.category_id;

    if (typeof rawCategoryId === "string" && rawCategoryId.startsWith("suggestion:")) {
      const suggestionLabel = rawCategoryId.replace("suggestion:", "");
      const existingCategory = categories.find(
        (category) => normalizeCategoryName(category.category_description) === normalizeCategoryName(suggestionLabel)
      );

      if (existingCategory) {
        return {
          category_id: existingCategory.id,
          category_description: undefined,
        };
      }

      return {
        category_id: 0,
        category_description: suggestionLabel,
      };
    }

    return {
      category_id: rawCategoryId,
      category_description: rawCategoryId === 0 ? values.category_description : undefined,
    };
  };

  const handleSaveSalary = async () => {
    setLoading(true);
    try {
      const values = await formSalary.validateFields();
      
      const formattedDate = values.date ? values.date.format("YYYY-MM-DD") : new Date().toISOString().split("T")[0];
      const categoryPayload = resolveCategoryPayload(values);

      await request({
        method: "POST",
        endpoint: "transaction/store",
        data: {
          transaction_description: values.description,
          ...categoryPayload,
          date: formattedDate,
          type_id: 1,
          transaction_value: String(values.transaction_value),
        },
      });
      message.success("Entrada registrada com sucesso!");
      setCurrentStep(1);
    } catch (error: any) {
      if (error?.response) {
        message.error(error?.response?.data?.message || "Erro ao registrar entrada.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    setLoading(true);
    try {
      const values = await formGoal.validateFields();
      await request({
        method: "POST",
        endpoint: "spending/store",
        data: {
          planned_spending: values.planned_spending,
        },
      });
      message.success("Meta de gastos configurada com sucesso!");
      setCurrentStep(2);
    } catch (error: any) {
      if (error?.response) {
        message.error(error?.response?.data?.message || "Erro ao salvar meta.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async () => {
    setLoading(true);
    try {
      const values = await formCard.validateFields();
      if (values.card_description && values.flag_id) {
        await request({
          method: "POST",
          endpoint: "card",
          data: {
            card_description: values.card_description,
            flag_id: Number(values.flag_id),
            expiration: Number(values.expiration),
            closure: Number(values.closure),
          },
        });
        message.success("Cartão adicionado com sucesso!");
        loadInitialData();
      }
      setCurrentStep(3);
    } catch (error: any) {
      if (error?.response) {
        message.error(error?.response?.data?.message || "Erro ao salvar cartão.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveObjective = async () => {
    setLoading(true);
    try {
      const values = await formObjective.validateFields();
      if (values.name && values.total_value) {
        await request({
          method: "POST",
          endpoint: "objectives",
          data: {
            type: "item",
            name: values.name,
            current_saved: Number(values.current_saved || 0),
            total_value: Number(values.total_value || 0),
            target_year: Number(values.target_year),
            target_month: Number(values.target_month),
          },
        });
        message.success("Objetivo adicionado com sucesso!");
      }
      await completeOnboarding();
    } catch (error: any) {
      if (error?.response) {
        message.error(error?.response?.data?.message || "Erro ao salvar objetivo.");
      }
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
      message.success("Configuração inicial concluída!");
      onComplete();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Erro ao finalizar configuração.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipCard = () => {
    setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return {
    currentStep,
    loading,
    categories,
    showDescriptionCategory,
    setShowDescriptionCategory,
    formSalary,
    formGoal,
    formCard,
    formObjective,
    cardsData,
    objectivesData,
    handleSaveSalary,
    handleSaveGoal,
    handleSaveCard,
    handleSaveObjective,
    handleSkipObjective,
    handleSkipCard,
    handleBack,
  };
};
