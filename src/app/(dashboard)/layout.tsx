"use client";
import CustomMenu from "@/components/CustomMenu";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <CustomMenu />
      <div style={{ flex: 1, padding: "30px 40px", overflowX: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
