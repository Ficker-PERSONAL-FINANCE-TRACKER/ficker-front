"use client";
import MainContext from "@/context";
import { useContext, useEffect, useState } from "react";
import { HomeScreen } from "./pages/Home/Home";
import { Spin } from "antd";
import Resume from "./resume/page";
import OnboardingStepModal from "@/components/OnboardingStepModal";
import { request } from "@/service/api";

export default function Home() {
  const { auth, setAuth } = useContext(MainContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      setAuth(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (auth) {
      checkOnboardingStatus();
    }
  }, [auth]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "onboarding/status",
      });
      if (response?.data?.data?.onboarding_completed === false) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Erro ao verificar status do onboarding:", error);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );

  if (auth) {
    return (
      <>
        <Resume />
        <OnboardingStepModal open={showOnboarding} onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return <HomeScreen />;
}