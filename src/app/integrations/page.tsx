"use client";
import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Modal, Space, message, Typography, Badge } from "antd";
import { 
  SendOutlined, 
  WhatsAppOutlined, 
  CheckCircleFilled,
  InfoCircleOutlined 
} from "@ant-design/icons";
import CustomMenu from "@/components/CustomMenu";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { request } from "@/service/api";

const { Title, Text } = Typography;

type TelegramLinkStatus = {
  linked: boolean;
  account: {
    telegram_account_id: number;
    telegram_user_id: string;
    telegram_chat_id: string;
    telegram_username?: string | null;
    status: string;
    verified_at?: string | null;
    last_interaction_at?: string | null;
    session_expires_at?: string | null;
    revoked_at?: string | null;
  } | null;
};

const Integrations = () => {
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramCodeLoading, setTelegramCodeLoading] = useState(false);
  const [telegramUnlinkLoading, setTelegramUnlinkLoading] = useState(false);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [telegramCodeExpiresAt, setTelegramCodeExpiresAt] = useState<string | null>(null);
  const [telegramLinkStatus, setTelegramLinkStatus] = useState<TelegramLinkStatus | null>(null);

  const loadTelegramLinkStatus = async () => {
    const response = await request({
      method: "GET",
      endpoint: "telegram/link-status",
    });

    setTelegramLinkStatus(response?.data?.data ?? { linked: false, account: null });
  };

  const handleOpenTelegramModal = async () => {
    setTelegramModalOpen(true);
    setTelegramLoading(true);
    setTelegramCode(null);
    setTelegramCodeExpiresAt(null);

    try {
      await loadTelegramLinkStatus();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ??
        error?.response?.data?.data?.message ??
        "Não foi possível consultar o status do Telegram.";

      message.error(apiMessage);
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleTelegramLinkCode = async () => {
    setTelegramCodeLoading(true);

    try {
      const response = await request({
        method: "POST",
        endpoint: "telegram/link-code",
      });

      const code = response?.data?.data?.code;
      const expiresAt = response?.data?.data?.expires_at;

      if (!code) {
        message.error("Não foi possível obter o código do Telegram.");
        return;
      }

      setTelegramCode(code);
      setTelegramCodeExpiresAt(expiresAt ?? null);

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
          message.success("Código copiado para a área de transferência.");
        } catch {
          message.info("Código gerado. Copie manualmente se necessário.");
        }
      }
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ??
        error?.response?.data?.data?.message ??
        "Não foi possível gerar o código do Telegram.";

      message.error(apiMessage);
    } finally {
      setTelegramCodeLoading(false);
    }
  };

  const handleTelegramUnlink = async () => {
    setTelegramUnlinkLoading(true);

    try {
      const response = await request({
        method: "DELETE",
        endpoint: "telegram/link",
      });

      const revoked = response?.data?.data?.revoked;

      if (revoked) {
        message.success("Vínculo com o Telegram removido.");
      } else {
        message.info("Nenhum vínculo ativo foi encontrado.");
      }

      setTelegramCode(null);
      setTelegramCodeExpiresAt(null);
      await loadTelegramLinkStatus();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ??
        error?.response?.data?.data?.message ??
        "Não foi possível desvincular a conta do Telegram.";

      message.error(apiMessage);
    } finally {
      setTelegramUnlinkLoading(false);
    }
  };

  const formatTelegramExpiry = (expiresAt?: string) => {
    if (!expiresAt) {
      return "não informada";
    }

    const utcDate = new Date(expiresAt.replace(" ", "T") + "Z");

    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(utcDate);
  };

  const telegramStatusLabel = telegramLinkStatus?.account?.status === "session_expired"
    ? "sessão expirada"
    : telegramLinkStatus?.account?.status === "revoked"
      ? "desvinculada"
      : telegramLinkStatus?.account?.status ?? null;

  const telegramStatusMessage = telegramLinkStatus?.linked
    ? "Sua conta está vinculada ao Telegram."
    : telegramLinkStatus?.account?.status === "session_expired"
      ? "Sua sessão no Telegram expirou por inatividade. Gere um novo código para vincular novamente."
      : telegramLinkStatus?.account?.status === "revoked"
        ? "Sua conta foi desvinculada do Telegram."
        : "Sua conta ainda não está vinculada ao Telegram.";

  useEffect(() => {
    loadTelegramLinkStatus();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <CustomMenu />
      <div style={{ width: "90vw" }}>
        <div className={styles.titleArea}>
          <h2>Integrações</h2>
        </div>

        <Row gutter={[24, 24]} style={{ padding: "20px 30px" }}>
          <Col xs={24} md={12} lg={8}>
            <Card 
              hoverable 
              style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 12, 
                    background: '#6C5DD3', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <SendOutlined style={{ fontSize: 24, color: '#fff' }} />
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>Telegram</Title>
                  </div>
                </div>
                {telegramLinkStatus?.linked && (
                  <CheckCircleFilled style={{ color: '#52c41a', fontSize: 20 }} />
                )}
              </div>
              
              <Text type="secondary" style={{ display: 'block', marginBottom: 24, minHeight: 60 }}>
                Receba notificações, registre transações e consulte seu saldo diretamente pelo bot do Telegram.
              </Text>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  onClick={handleOpenTelegramModal}
                  style={{ borderRadius: 8 }}
                >
                  Ver detalhes
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Card 
              hoverable 
              style={{ borderRadius: 16, overflow: 'hidden', opacity: 0.8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 12, 
                    background: '#25D366', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <WhatsAppOutlined style={{ fontSize: 24, color: '#fff' }} />
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>WhatsApp</Title>
                  </div>
                </div>
                <Badge count="Em breve" style={{ backgroundColor: '#faad14' }} />
              </div>
              
              <Text type="secondary" style={{ display: 'block', marginBottom: 24, minHeight: 60 }}>
                Em breve você poderá controlar suas finanças através do WhatsApp com a mesma facilidade.
              </Text>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button disabled style={{ borderRadius: 8 }}>
                  Em breve
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        open={telegramModalOpen}
        title="Gerenciar conta no Telegram"
        onCancel={() => setTelegramModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setTelegramModalOpen(false)}>
            Fechar
          </Button>,
        ]}
      >
        <div className="telegram-link-modal">
          {telegramLoading ? (
            <p>Carregando status do Telegram...</p>
          ) : (
            <>
              <p>
                {telegramStatusMessage}
              </p>

              {telegramLinkStatus?.account && (
                <div className="telegram-link-status" style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  <p>
                    <strong>Status</strong> {telegramStatusLabel}
                  </p>
                  <p>
                    <strong>Usuário</strong>{" "}
                    {telegramLinkStatus.account.telegram_username
                      ? `@${telegramLinkStatus.account.telegram_username}`
                      : telegramLinkStatus.account.telegram_user_id}
                  </p>
                </div>
              )}

              <Space className="telegram-link-actions" wrap style={{ marginBottom: 16 }}>
                <Button type="primary" loading={telegramCodeLoading} onClick={handleTelegramLinkCode}>
                  {telegramLinkStatus?.linked ? "Gerar novo código" : "Vincular"}
                </Button>
                <Button
                  danger
                  loading={telegramUnlinkLoading}
                  onClick={handleTelegramUnlink}
                  disabled={!telegramLinkStatus?.linked}
                >
                  Desvincular
                </Button>
              </Space>

              {telegramCode && (
                <div style={{ background: '#F5F3FF', border: '1px solid #DED9F6', padding: 16, borderRadius: 8 }}>
                  <p style={{ marginBottom: 8 }}>Use este código no bot do Telegram <a href="https://t.me/FickerTelegramBot" target="_blank" rel="noreferrer" style={{ color: '#6C5DD3', fontWeight: 600 }}>@FickerTelegramBot</a> para vincular sua conta:</p>
                  <div style={{ 
                    fontSize: 24, 
                    fontWeight: 700, 
                    textAlign: 'center', 
                    padding: '12px', 
                    background: '#fff', 
                    borderRadius: 4, 
                    marginBottom: 8,
                    letterSpacing: 2,
                    color: '#6C5DD3'
                  }}>
                    {telegramCode}
                  </div>
                  <p style={{ fontSize: 12, margin: 0 }}>Validade: {formatTelegramExpiry(telegramCodeExpiresAt ?? undefined)}</p>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Integrations;
