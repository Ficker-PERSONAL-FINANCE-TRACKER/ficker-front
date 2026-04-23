"use client";
import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Modal, Space, message, Typography, Badge, Tag, Spin } from "antd";
import { 
  SendOutlined, 
  WhatsAppOutlined, 
  CheckCircleFilled,
  InfoCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
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
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappLinkStatus, setWhatsappLinkStatus] = useState<{ linked: boolean; account?: any } | null>(null);

  const loadTelegramLinkStatus = async () => {
    const response = await request({
      method: "GET",
      endpoint: "telegram/link-status",
    });

    setTelegramLinkStatus(response?.data?.data ?? { linked: false, account: null });
  };

  const loadWhatsAppLinkStatus = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "whatsapp/link-status",
      });
      setWhatsappLinkStatus(response?.data?.data ?? { linked: false });
    } catch (error) {
      setWhatsappLinkStatus({ linked: false });
    }
  };

  const handleOpenWhatsAppModal = () => {
    setWhatsappModalOpen(true);
  };

  const handleWhatsAppUnlink = async () => {
    setWhatsappLoading(true);
    try {
      await request({
        method: "DELETE",
        endpoint: "whatsapp/link",
      });
      message.success("Vínculo removido.");
      loadWhatsAppLinkStatus();
    } catch (error: any) {
      message.error("Erro ao remover vínculo.");
    } finally {
      setWhatsappLoading(false);
    }
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

  const telegramStatusTranslations: Record<string, string> = {
    active: "ativa",
    linked: "vinculada",
    verified: "verificada",
    pending: "pendente",
    unverified: "não verificada",
    session_expired: "sessão expirada",
    revoked: "desvinculada",
    inactive: "inativa",
    blocked: "bloqueada",
  };

  const telegramStatusLabel = telegramLinkStatus?.account?.status
    ? telegramStatusTranslations[telegramLinkStatus.account.status] ?? telegramLinkStatus.account.status
    : null;

  const telegramStatusMessage = telegramLinkStatus?.linked
    ? "Sua conta está vinculada ao Telegram."
    : telegramLinkStatus?.account?.status === "session_expired"
      ? "Sua sessão no Telegram expirou por inatividade. Gere um novo código para vincular novamente."
      : telegramLinkStatus?.account?.status === "revoked"
        ? "Sua conta foi desvinculada do Telegram."
        : "Sua conta ainda não está vinculada ao Telegram.";

  useEffect(() => {
    loadTelegramLinkStatus();
    loadWhatsAppLinkStatus();
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
              style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
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
                {whatsappLinkStatus?.linked && (
                   <Badge count="Conectado" style={{ backgroundColor: '#52c41a' }} />
                )}
              </div>
              
              <Text type="secondary" style={{ display: 'block', marginBottom: 24, minHeight: 60 }}>
                Receba notificações e controle suas finanças através do WhatsApp com facilidade.
              </Text>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {whatsappLinkStatus?.linked && (
                    <Tag icon={<CheckCircleFilled />} color="success" style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                      Conectado
                    </Tag>
                  )}
                </div>
                <Button 
                  onClick={handleOpenWhatsAppModal}
                  style={{ borderRadius: 8 }}
                >
                  Ver detalhes
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        open={whatsappModalOpen}
        title="Vincular conta no WhatsApp"
        onCancel={() => setWhatsappModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setWhatsappModalOpen(false)}>
            Fechar
          </Button>,
        ]}
        width={500}
      >
        <div style={{ padding: '10px 0' }}>
          {whatsappLinkStatus?.linked ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircleFilled style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>WhatsApp vinculado!</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Sua conta está conectada e pronta para uso.
              </Text>
              <Button danger onClick={handleWhatsAppUnlink} loading={whatsappLoading}>
                Desvincular conta
              </Button>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={4}>Vincule seu WhatsApp</Title>
                <Text type="secondary" style={{ display: 'block' }}>
                  Acesse nossa página de integração para começar.
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  style={{ background: '#25D366', borderColor: '#25D366', borderRadius: 8, height: 48, padding: '0 32px', fontSize: 16 }}
                  onClick={() => window.open('https://api.whatsapp.com/send?phone=5582994440333&text=vincular', '_blank')}
                >
                  Ir para o WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={telegramModalOpen}
        title="Vincular conta no Telegram"
        onCancel={() => setTelegramModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setTelegramModalOpen(false)}>
            Fechar
          </Button>,
        ]}
        width={500}
      >
        <div style={{ padding: '10px 0' }}>
          {telegramLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip="Consultando status..." />
            </div>
          ) : telegramLinkStatus?.linked ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircleFilled style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>Telegram vinculado!</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Sua conta está conectada ao bot do Telegram.
              </Text>
              <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 24, textAlign: 'left' }}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Usuário: </Text>
                  <Text strong>{telegramLinkStatus.account?.telegram_username || "Não informado"}</Text>
                </div>
                <div>
                  <Text type="secondary">Conectado em: </Text>
                  <Text strong>{telegramLinkStatus.account?.verified_at ? dayjs(telegramLinkStatus.account.verified_at).format("DD/MM/YYYY [às] HH:mm") : "Não informado"}</Text>
                </div>
              </div>
              <Button danger onClick={handleTelegramUnlink} loading={telegramUnlinkLoading}>
                Desvincular conta
              </Button>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={4}>Vincule seu Telegram</Title>
                <Text type="secondary" style={{ display: 'block' }}>
                  Para vincular sua conta, envie o código abaixo para nosso bot no Telegram.
                </Text>
              </div>

              {telegramCode ? (
                <div style={{ textAlign: 'center', padding: '24px 0', background: '#f5f5f5', borderRadius: 12, marginBottom: 24 }}>
                  <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 8, color: '#6C5DD3', marginBottom: 8 }}>
                    {telegramCode}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Válido até {dayjs(telegramCodeExpiresAt).format("DD/MM/YYYY [às] HH:mm")}
                  </Text>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', background: '#f5f5f5', borderRadius: 12, marginBottom: 24 }}>
                  <Button 
                    onClick={handleTelegramLinkCode} 
                    loading={telegramCodeLoading}
                    type="primary"
                    style={{ background: '#6C5DD3', borderColor: '#6C5DD3', borderRadius: 8 }}
                  >
                    Gerar código de vínculo
                  </Button>
                </div>
              )}

              <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <InfoCircleOutlined style={{ color: '#1890ff', marginTop: 4 }} />
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Como vincular:</Text>
                    <ol style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Abra o Telegram e procure por <Text strong>@ficker_bot</Text></li>
                      <li>Inicie uma conversa enviando <Text strong>/vincular</Text></li>
                      <li>Envie o código gerado acima para o bot</li>
                      <li>Pronto! Sua conta será vinculada instantaneamente</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Integrations;
