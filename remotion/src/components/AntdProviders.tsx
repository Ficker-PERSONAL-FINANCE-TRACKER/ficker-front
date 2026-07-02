import React from "react";
import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import { StyleProvider } from "@ant-design/cssinjs";
import { colors } from "../theme";
import { FONT } from "../fonts";

/**
 * Providers da UI real do Ficker (antd + cssinjs) para o render do Remotion.
 * Injeta os estilos do antd no documento e aplica o tema (roxo + Manrope).
 */
export const AntdProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StyleProvider hashPriority="high">
    <ConfigProvider
      locale={ptBR}
      theme={{ token: { colorPrimary: colors.purple, fontFamily: FONT, fontSize: 16 } }}
    >
      {children}
    </ConfigProvider>
  </StyleProvider>
);
