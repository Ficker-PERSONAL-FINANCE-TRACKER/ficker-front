import React from "react";
import { TagOutlined, ApiOutlined } from "@ant-design/icons";
import { colors, radius } from "../theme";
import { FONT } from "../fonts";

type IconDef = { img?: string; node?: React.ReactNode; filter?: string };

const MENU: { key: string; label: string; icon: IconDef }[] = [
  { key: "inicio", label: "Início", icon: { img: "/icons/icon-home.svg" } },
  { key: "entradas", label: "Entradas", icon: { img: "/icons/icon-income.svg" } },
  { key: "saidas", label: "Saídas", icon: { img: "/icons/icon-expense.svg" } },
  { key: "cartoes", label: "Meus cartões", icon: { img: "/icons/icon-card.svg" } },
  { key: "teto", label: "Teto de gastos", icon: { node: <TagOutlined style={{ fontSize: 22, color: colors.purple }} /> } },
  { key: "objetivos", label: "Objetivos", icon: { img: "/icons/icon-home.svg", filter: "hue-rotate(45deg)" } },
  { key: "analises", label: "Análises", icon: { img: "/icons/icon-analysis.svg" } },
  { key: "integracoes", label: "Integrações", icon: { node: <ApiOutlined style={{ fontSize: 22, color: colors.muted }} /> } },
];

/** Casca do app Ficker: sidebar (com ícones/logo reais) + header. Espelha o /resume. */
export const AppShell: React.FC<{
  active?: string;
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ active = "inicio", title = "Olá, John!", right, children }) => {
  return (
    <div style={{ display: "flex", height: "100%", background: colors.bg, fontFamily: FONT }}>
      {/* Sidebar */}
      <div
        style={{
          width: 250,
          background: colors.white,
          borderRight: `1px solid ${colors.line}`,
          padding: "26px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 12px 22px" }}>
          <img src="/logo.png" alt="Ficker" style={{ height: 26, objectFit: "contain" }} />
        </div>
        {MENU.map((m) => {
          const on = m.key === active;
          return (
            <div
              key={m.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 14px",
                borderRadius: radius.sm,
                background: on ? colors.purpleSoft : "transparent",
                color: on ? colors.purple : colors.ink,
                fontWeight: on ? 700 : 500,
                fontSize: 16,
              }}
            >
              <span style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {m.icon.img ? (
                  <img src={m.icon.img} alt="" width={22} height={22} style={{ filter: m.icon.filter }} />
                ) : (
                  m.icon.node
                )}
              </span>
              {m.label}
            </div>
          );
        })}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            height: 84,
            padding: "0 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${colors.line}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 800, color: colors.ink }}>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>{right}</div>
        </div>
        <div style={{ flex: 1, padding: 40, overflow: "hidden", position: "relative" }}>{children}</div>
      </div>
    </div>
  );
};
