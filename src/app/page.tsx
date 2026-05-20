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
    } else {
      setAuth(false);
      setLoading(false);
    }
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
      const onboardingCompleted = response?.data?.data?.onboarding_completed ?? response?.data?.onboarding_completed;
      if (onboardingCompleted === false) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Erro ao verificar status do onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    sessionStorage.setItem("showFirstAccessTour", "true");
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
          background: "#f0f2f5"
        }}
      >
        <Spin size="large" />
      </div>
    );

  if (auth) {
    if (showOnboarding) {
      return (
        <div style={{ height: "100vh", width: "100vw", background: "#f0f2f5" }}>
          <OnboardingStepModal open={showOnboarding} onComplete={handleOnboardingComplete} />
        </div>
      );
    }

    return (
      <>
        <Resume />
      </>
    );
  }

  return <HomeScreen />;
}
