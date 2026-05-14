import { useState, useEffect } from "react";
import { message, Form } from "antd";
import { getApiErrorMessage, request } from "@/service/api";

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
  const [flags, setFlags] = useState<any[]>([]);
  const [objectivesData, setObjectivesData] = useState<any[]>([]);
  const [shouldSubmitCard, setShouldSubmitCard] = useState(false);
  const [submittedSignatures, setSubmittedSignatures] = useState<Record<string, string>>({});
  const [salaryDraft, setSalaryDraft] = useState<Record<string, any> | null>(null);
  const [goalDraft, setGoalDraft] = useState<Record<string, any> | null>(null);
  const [cardDraft, setCardDraft] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setShouldSubmitCard(false);
      setSubmittedSignatures({});
      setSalaryDraft(null);
      setGoalDraft(null);
      setCardDraft(null);
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
      const { data } = await request({ method: "GET", endpoint: "flags" });
      setFlags(data?.data?.flags || data?.flags || []);
    } catch {
      console.log("No flags data yet");
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

  const buildSalaryPayload = (values: Record<string, any>) => {
    const formattedDate = values.date ? values.date.format("YYYY-MM-DD") : new Date().toISOString().split("T")[0];
    const categoryPayload = resolveCategoryPayload(values);

    return {
      payload: {
        transaction_description: values.description,
        ...categoryPayload,
        date: formattedDate,
        type_id: 1,
        transaction_value: String(values.transaction_value),
        is_recurring: values.is_recurring || false,
      },
      referenceDate: formattedDate,
    };
  };

  const buildGoalPayload = (values: Record<string, any>, referenceDate: string) => ({
    planned_spending: values.planned_spending,
    reference_date: referenceDate,
  });

  const buildCardPayload = (values: Record<string, any>) => ({
    card_description: values.card_description,
    flag_id: Number(values.flag_id),
    expiration: Number(values.expiration),
    closure: Number(values.closure),
  });

  const handleSaveSalary = async () => {
    setLoading(true);
    try {
      const values = await formSalary.validateFields();
      setSalaryDraft(buildSalaryPayload(values));
      setCurrentStep(1);
    } catch (error: any) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    setLoading(true);
    try {
      const values = await formGoal.validateFields();
      const salaryData = salaryDraft ?? buildSalaryPayload(await formSalary.validateFields());
      setGoalDraft(buildGoalPayload(values, salaryData.referenceDate));
      setCurrentStep(2);
    } catch (error: any) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async () => {
    setLoading(true);
    try {
      const values = await formCard.validateFields();
      setCardDraft(buildCardPayload(values));
      setShouldSubmitCard(true);
      setCurrentStep(3);
    } catch (error: any) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveObjective = async () => {
    setLoading(true);
    try {
      const values = await formObjective.validateFields();
      await submitOnboarding(values);
    } catch (error: any) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipObjective = async () => {
    setLoading(true);
    try {
      await submitOnboarding(null);
    } catch (error: any) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const submitIfNeeded = async (key: string, endpoint: string, data: Record<string, any>) => {
    const signature = JSON.stringify(data);

    if (submittedSignatures[key] === signature) {
      return;
    }

    await request({
      method: "POST",
      endpoint,
      data,
    });
    setSubmittedSignatures((current) => ({
      ...current,
      [key]: signature,
    }));
  };

  const submitOnboarding = async (objectiveValues: Record<string, any> | null) => {
    const salaryData = salaryDraft ?? buildSalaryPayload(await formSalary.validateFields());
    const goalData = goalDraft ?? buildGoalPayload(await formGoal.validateFields(), salaryData.referenceDate);

    await submitIfNeeded("salary", "transaction/store", salaryData.payload);
    await submitIfNeeded("goal", "spending/store", goalData);

    if (shouldSubmitCard) {
      const cardData = cardDraft ?? buildCardPayload(await formCard.validateFields());
      await submitIfNeeded("card", "card", cardData);
    }

    if (objectiveValues?.name && objectiveValues?.total_value) {
      await submitIfNeeded("objective", "objectives", {
        type: "item",
        name: objectiveValues.name,
        current_saved: Number(objectiveValues.current_saved || 0),
        total_value: Number(objectiveValues.total_value || 0),
        target_year: Number(objectiveValues.target_year),
        target_month: Number(objectiveValues.target_month),
      });
    }

    await request({
      method: "POST",
      endpoint: "onboarding/complete",
    });
    message.success("Configuração inicial concluída!");
    onComplete();
  };

  const handleSkipCard = () => {
    setShouldSubmitCard(false);
    setCardDraft(null);
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
    flags,
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
