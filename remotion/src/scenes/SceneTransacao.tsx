import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Form, Input, InputNumber, Select, DatePicker, Checkbox, Button } from "antd";
import { DollarOutlined, CheckCircleFilled } from "@ant-design/icons";
import dayjs from "dayjs";
import { currencyFormatter, currencyParser } from "@/utils/currencyFormatter";
import { AppShell } from "../components/AppShell";
import { AntdProviders } from "../components/AntdProviders";
import { Cursor } from "../components/Cursor";
import { colors, radius, shadow } from "../theme";
import { FONT } from "../fonts";

/** Cena — Adicionar transação (modal com formulário antd real). */
export const SceneTransacao: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();

  const modalIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 26 });
  const modalScale = interpolate(modalIn, [0, 1], [0.92, 1]);

  // cursor até o botão "Adicionar"
  const cx = interpolate(frame, [30, 70], [width * 0.8, width * 0.5 + 150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cy = interpolate(frame, [30, 70], [900, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = interpolate(frame, [72, 80, 90], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const success = frame >= 90;
  const successIn = spring({ frame: frame - 90, fps, config: { damping: 14 }, durationInFrames: 20 });
  // some o modal quando o sucesso aparece, para não sobrepor o formulário
  const modalOut = interpolate(frame, [86, 96], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <AntdProviders>
        <AppShell active="entradas" title="Entradas">
          <div style={{ opacity: 0.5 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "18px 0", borderBottom: `1px solid ${colors.line}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.successBg }} />
                <div style={{ flex: 1, height: 14, borderRadius: 7, background: "#eee" }} />
                <div style={{ width: 120, height: 14, borderRadius: 7, background: colors.successBg }} />
              </div>
            ))}
          </div>
        </AppShell>

        {/* backdrop */}
        <AbsoluteFill style={{ background: "rgba(17,20,45,0.35)", opacity: modalIn }} />

        {/* modal */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              width: 560,
              background: colors.white,
              borderRadius: radius.lg,
              boxShadow: shadow.float,
              padding: "28px 32px",
              transform: `scale(${modalScale})`,
              opacity: modalIn * modalOut,
              fontFamily: FONT,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, color: colors.ink, marginBottom: 20 }}>Nova entrada</div>
            <Form layout="vertical" initialValues={{ desc: "Salário", cat: "salario", date: dayjs("2026-07-05"), value: 6000, rec: true }}>
              <Form.Item label="Descrição" style={{ marginBottom: 16 }}>
                <Input value="Salário" size="large" />
              </Form.Item>
              <div style={{ display: "flex", gap: 12 }}>
                <Form.Item label="Data" style={{ flex: 1 }}>
                  <DatePicker value={dayjs("2026-07-05")} format="DD/MM/YYYY" size="large" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="Categoria" style={{ flex: 1 }}>
                  <Select
                    value="salario"
                    size="large"
                    options={[{ value: "salario", label: (<span><DollarOutlined style={{ color: colors.success }} /> Salário</span>) as any }]}
                  />
                </Form.Item>
              </div>
              <Form.Item label="Valor" style={{ marginBottom: 14 }}>
                <InputNumber<number>
                  value={6000}
                  size="large"
                  style={{ width: "100%" }}
                  precision={2}
                  formatter={currencyFormatter as any}
                  parser={currencyParser as any}
                />
              </Form.Item>
              <Checkbox checked>Entrada recorrente (mensal)</Checkbox>
              <Button type="primary" block size="large" style={{ marginTop: 22, height: 52, borderRadius: 12, fontWeight: 700, fontSize: 18, background: colors.purple, borderColor: colors.purple, transform: `scale(${1 - press * 0.04})` }}>
                Adicionar entrada
              </Button>
            </Form>
          </div>
        </AbsoluteFill>

        {/* sucesso */}
        {success && (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, transform: `scale(${successIn})`, opacity: successIn }}>
              <CheckCircleFilled style={{ fontSize: 120, color: colors.success }} />
              <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 800, color: colors.ink }}>Entrada adicionada!</div>
              <div style={{ fontFamily: FONT, fontSize: 22, color: colors.success, fontWeight: 700 }}>+ R$ 6.000,00</div>
            </div>
          </AbsoluteFill>
        )}

        <Cursor x={cx} y={cy} press={press} />
      </AntdProviders>
    </AbsoluteFill>
  );
};
