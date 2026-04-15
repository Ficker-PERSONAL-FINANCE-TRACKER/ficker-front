"use client";
import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Modal, Space, message, Typography, Badge, Tag, Input, Steps } from "antd";
import { 
  SendOutlined, 
  WhatsAppOutlined, 
  CheckCircleFilled,
  InfoCircleOutlined,
  InstagramOutlined 
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

  // WhatsApp states
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
              </div>
              
              <Text type="secondary" style={{ display: 'block', marginBottom: 24, minHeight: 60 }}>
                Receba notificações, registre transações e consulte seu saldo diretamente pelo bot do Telegram.
              </Text>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div>
                  {telegramLinkStatus?.linked && (
                    <Tag icon={<CheckCircleFilled />} color="success" style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                      Conectado
                    </Tag>
                  )}
                </div>
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
              <Title level={4}>WhatsApp Vinculado!</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Sua conta está conectada e pronta para uso.
              </Text>
              <Button danger onClick={handleWhatsAppUnlink} loading={whatsappLoading}>
                Desvincular Conta
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Text style={{ display: 'block', marginBottom: 20, fontSize: 15 }}>
                Para vincular sua conta, escaneie o QR Code abaixo ou clique no botão para abrir o chat diretamente.
              </Text>
              
              <div style={{ 
                background: '#fff', 
                padding: 12, 
                borderRadius: 12, 
                display: 'inline-block',
                border: '1px solid #f0f0f0',
                marginBottom: 20
              }}>
                <img 
                  src="/whatsapp-qr.png" 
                  alt="WhatsApp QR Code" 
                  style={{ width: 220, height: 220 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://wa.me/5511999999999?text=Vincular%20minha%20conta";
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<WhatsAppOutlined />}
                  href="https://wa.me/5511999999999?text=Vincular%20minha%20conta" 
                  target="_blank"
                  style={{ 
                    borderRadius: 8, 
                    background: '#25D366', 
                    borderColor: '#25D366',
                    padding: '8px 30px',
                    height: 'auto',
                    fontWeight: 600
                  }}
                >
                  Abrir no WhatsApp
                </Button>
                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                  Caso não queira ler o código QR, clique no botão acima.
                </Text>
              </div>

              <div style={{ textAlign: 'left', background: '#f9f9f9', padding: 16, borderRadius: 12 }}>
                <Title level={5} style={{ marginTop: 0, fontSize: 14 }}>Próximos passos no bot:</Title>
                <ul style={{ paddingLeft: 20, margin: 0, color: '#595959', fontSize: 13 }}>
                  <li style={{ marginBottom: 4 }}>Envie a mensagem inicial</li>
                  <li style={{ marginBottom: 4 }}>Informe seu e-mail cadastrado</li>
                  <li>Digite o código de verificação recebido</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Integrations;
