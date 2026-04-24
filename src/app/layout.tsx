// "use client";
import "./globals.css";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { ConfigProvider } from "antd";
import StyledComponentsRegistry from "./lib/AntdRegistry";
import theme from "./theme/themeConfig";
import { MainProvider } from "@/context";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ficker - Controle suas finanças",
  description: "Ficker é a plataforma ideal para gerenciar suas finanças, metas de gastos e objetivos de vida.",
  openGraph: {
    title: "Ficker - Controle suas finanças",
    description: "Ficker é a plataforma ideal para gerenciar suas finanças, metas de gastos e objetivos de vida.",
    url: "https://ficker.com.br", // Ajuste conforme a URL real se necessário
    siteName: "Ficker",
    images: [
      {
        url: "/ficker-system.png",
        width: 1200,
        height: 630,
        alt: "Ficker System Preview",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ficker - Controle suas finanças",
    description: "Ficker é a plataforma ideal para gerenciar suas finanças, metas de gastos e objetivos de vida.",
    images: ["/ficker-system.png"],
  },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="pt-BR">
    <body className={manrope.className}>
      <MainProvider>
        <ConfigProvider theme={theme}>
          <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
        </ConfigProvider>
      </MainProvider>
    </body>
  </html>
);

export default RootLayout;