"use client";
import React, { useEffect, useState } from "react";
import type { MenuProps } from "antd";
import { Button, Menu, Modal, Space, message } from "antd";
import Image from "next/image";
import "./styles.scss";
import { usePathname, useRouter } from "next/navigation";
import { Cookies } from "react-cookie";
import { 
  BarsOutlined,
  SendOutlined,
} from "@ant-design/icons";
import useMediaQuery from "use-media-antd-query";
import SidebarAlert from "../SidebarAlert";
import Link from "next/link";
import { request } from "@/service/api";

type MenuItem = Required<MenuProps>["items"][number];

interface CustomMenuProps {
  balance?: {
    real_spending: number;
    planned_spending: number;
  };
  user?: {
    name: string;
  };
  showAlert?: boolean;
}

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
  getItem(
    "Início",
    "1",
    <Image src="/icons/icon-home.svg" alt="Início" width={22} height={22} />
  ),
  getItem(
    "Entradas",
    "2",
    <Image src="/icons/icon-income.svg" alt="Entradas" width={22} height={22} />
  ),
  getItem(
    "Saídas",
    "3",
    <Image src="/icons/icon-expense.svg" alt="Saídas" width={22} height={22} />
  ),
  getItem(
    "Meus cartões",
    "4",
    <Image src="/icons/icon-card.svg" alt="Meus cartões" width={22} height={22} />
  ),
  getItem(
    "Análises",
    "5",
    <Image src="/icons/icon-analysis.svg" alt="Análises" width={22} height={22} />
  ),
  getItem("Link do Telegram", "6", <SendOutlined style={{ fontSize: 22 }} />),
  getItem(
    "Sair",
    "7",
    <Image
      src="/icons/icon-logout.svg"
      alt="Sair"
      width={22}
      height={22}
    />
  ),
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

const CustomMenu: React.FC<CustomMenuProps> = ({ balance, user, showAlert = true }) => {
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
  const [userData, setUserData] = useState<{ name: string } | null>(user || null);
  const [balanceData, setBalanceData] = useState<any>(balance || null);
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch User
      if (!user?.name) {
        try {
          const response = await request({
            method: "GET",
            endpoint: "user",
          });
          if (response.data) {
            setUserData(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      } else {
        setUserData(user);
      }

      // Fetch Balance
      if (!balance) {
        try {
          const { data } = await request({
            method: "GET",
            endpoint: "balance",
          });
          if (data.finances) {
            setBalanceData(data.finances);
          }
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }
      } else {
        setBalanceData(balance);
      }
    };
    fetchData();
  }, [user, balance]);

  return (
    <div className="sidebar-container">
      <div className="burger-area">
        <BarsOutlined onClick={toggleMenu} className="burger-icon" />
      </div>
      {showMenu && (
        <div className={`menu-sidebar ${showMenu ? "show" : ""}`}>
          <div>
            <div className="logo-sidebar">
              <Link href="/">
                <Image src="/logo.png" alt="Logo" width={130} height={27} />
              </Link>
            </div>
            <Menu
              style={{ width: 250, border: 'none' }}
              selectedKeys={[selectedKey]}
              mode="inline"
              items={items}
              onClick={async ({ key }) => {
                if (key === "6") {
                  handleOpenTelegramModal();
                  return;
                }
                cookie.set("menu", key);
                if (key === "7") {
                  try {
                    await request({ method: "POST", endpoint: "logout" });
                  } catch (error) {
                    console.error("Logout falhou:", error);
                  }
                  cookie.remove("menu");
                  localStorage.clear();
                  router.replace("/login");;
                } else {
                  const targetPath = paths[key];
                  if (targetPath) {
                    router.push(targetPath);
                  }
                }
              }}
            />
          </div>

          <div className="sidebar-footer">
            {balanceData && (
              <SidebarAlert balance={balanceData} visible={showAlert} />
            )}
            
            <div className="user-profile">
              <div className="avatar-circle">
                {userData?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {userData?.name ? userData.name.split(" ").slice(0, 2).join(" ") : "User"}
                </span>
              </div>
            </div>
          </div>
        </div>
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
                  ? "Sua conta está vinculada ao Telegram."
                  : "Sua conta ainda não está vinculada ao Telegram."}
              </p>

              {telegramLinkStatus?.account && (
                <div className="telegram-link-status">
                  <p>
                    <strong>Status</strong> {telegramLinkStatus.account.status}
                  </p>
                  <p>
                    <strong>Usuário</strong>{" "}
                    {telegramLinkStatus.account.telegram_username
                      ? `@${telegramLinkStatus.account.telegram_username}`
                      : telegramLinkStatus.account.telegram_user_id}
                  </p>
                </div>
              )}

              <Space className="telegram-link-actions" wrap>
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
                <>
                  <p>Use este código no bot do Telegram @FickerTelegramBot para vincular sua conta:</p>
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
