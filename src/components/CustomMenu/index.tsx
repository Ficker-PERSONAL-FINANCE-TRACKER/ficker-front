import React, { useState } from "react";
import type { MenuProps } from "antd";
import { Button, Menu, Modal, Space, message } from "antd";
import Image from "next/image";
import "./styles.scss";
import { usePathname, useRouter } from "next/navigation";
import { Cookies } from "react-cookie";
import { BarsOutlined, SendOutlined } from "@ant-design/icons";
import useMediaQuery from "use-media-antd-query";
import { request } from "@/service/api";

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("Inicio", "1", <Image src="/despesas.svg" alt="Inicio" width={25} height={25} />),
  getItem("Entradas", "2", <Image src="/bolsa-de-dinheiro.svg" alt="Entradas" width={25} height={25} />),
  getItem("Saidas", "3", <Image src="/wallet.svg" alt="Saidas" width={25} height={25} />),
  getItem("Meus cartoes", "4", <Image src="/cartoes-de-credito.svg" alt="Cartoes" width={25} height={25} />),
  getItem("Analises", "5", <Image src="/analise.svg" alt="Analises" width={25} height={25} />),
  getItem("Link do Telegram", "6", <SendOutlined style={{ fontSize: 22 }} />),
  getItem("Sair", "7", <Image src="/exit1.svg" alt="Sair" width={25} height={25} />),
];

const paths: Record<string, string> = {
  "1": "/",
  "2": "/EnterTransaction",
  "3": "/Outputs",
  "4": "/cards",
  "5": "/analysis",
};

const formatTelegramExpiry = (expiresAt?: string) => {
  if (!expiresAt) {
    return "nao informada";
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

const CustomMenu: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const cookie = new Cookies();
  const menu = cookie.get("menu");
  const colSize = useMediaQuery();
  const [showMenu, setShowMenu] = useState<boolean>(colSize === "xs" ? false : true);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramCodeLoading, setTelegramCodeLoading] = useState(false);
  const [telegramUnlinkLoading, setTelegramUnlinkLoading] = useState(false);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [telegramCodeExpiresAt, setTelegramCodeExpiresAt] = useState<string | null>(null);
  const [telegramLinkStatus, setTelegramLinkStatus] = useState<TelegramLinkStatus | null>(null);

  const selectedKey =
    Object.entries(paths).find(([, path]) => path === pathname)?.[0] ?? (menu ? menu.toString() : "1");

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
        "Nao foi possivel consultar o status do Telegram.";

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
        message.error("Nao foi possivel obter o codigo do Telegram.");
        return;
      }

      setTelegramCode(code);
      setTelegramCodeExpiresAt(expiresAt ?? null);

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
          message.success("Codigo copiado para a area de transferencia.");
        } catch {
          message.info("Codigo gerado. Copie manualmente se necessario.");
        }
      }
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ??
        error?.response?.data?.data?.message ??
        "Nao foi possivel gerar o codigo do Telegram.";

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
        message.success("Vinculo com o Telegram removido.");
      } else {
        message.info("Nenhum vinculo ativo foi encontrado.");
      }

      setTelegramCode(null);
      setTelegramCodeExpiresAt(null);
      await loadTelegramLinkStatus();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ??
        error?.response?.data?.data?.message ??
        "Nao foi possivel desvincular a conta do Telegram.";

      message.error(apiMessage);
    } finally {
      setTelegramUnlinkLoading(false);
    }
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div>
      <BarsOutlined onClick={toggleMenu} className="burger-icon" />
      {showMenu && (
        <Menu
          style={{ width: 250, height: "90vh" }}
          selectedKeys={[selectedKey]}
          mode="inline"
          items={items}
          onClick={({ key }) => {
            if (key === "6") {
              handleOpenTelegramModal();
              return;
            }

            cookie.set("menu", key);

            if (key === "7") {
              cookie.remove("menu");
              localStorage.clear();
              window.location.href = "/login";
            } else if (paths[key as string] && paths[key as string] !== pathname) {
              router.push(paths[key as string]);
            }
          }}
        />
      )}
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
                {telegramLinkStatus?.linked
                  ? "Sua conta esta vinculada ao Telegram."
                  : "Sua conta ainda nao esta vinculada ao Telegram."}
              </p>

              {telegramLinkStatus?.account && (
                <div className="telegram-link-status">
                  <p>
                    <strong>Status:</strong> {telegramLinkStatus.account.status}
                  </p>
                  <p>
                    <strong>Usuario:</strong>{" "}
                    {telegramLinkStatus.account.telegram_username
                      ? `@${telegramLinkStatus.account.telegram_username}`
                      : telegramLinkStatus.account.telegram_user_id}
                  </p>
                </div>
              )}

              <Space className="telegram-link-actions" wrap>
                <Button type="primary" loading={telegramCodeLoading} onClick={handleTelegramLinkCode}>
                  {telegramLinkStatus?.linked ? "Gerar novo codigo" : "Vincular"}
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
                <>
                  <p>Use este codigo no bot do Telegram @FickerTelegramBot para vincular sua conta:</p>
                  <div className="telegram-link-code">{telegramCode}</div>
                  <p>Validade: {formatTelegramExpiry(telegramCodeExpiresAt ?? undefined)}</p>
                </>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CustomMenu;
