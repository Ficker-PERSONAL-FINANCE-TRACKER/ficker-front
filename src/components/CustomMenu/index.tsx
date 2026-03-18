import React, { useState } from "react";
import type { MenuProps } from "antd";
import { Menu, Modal, message } from "antd";
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

const CustomMenu: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const cookie = new Cookies();
  const menu = cookie.get("menu");
  const colSize = useMediaQuery();
  const [showMenu, setShowMenu] = useState<boolean>(colSize === "xs" ? false : true);

  const selectedKey =
    Object.entries(paths).find(([, path]) => path === pathname)?.[0] ?? (menu ? menu.toString() : "1");

  const handleTelegramLinkCode = async () => {
    const hideLoading = message.loading("Gerando codigo de vinculacao do Telegram...", 0);

    try {
      const response = await request({
        method: "POST",
        endpoint: "telegram/link-code",
      });

      const code = response?.data?.data?.code;
      const expiresAt = response?.data?.data?.expires_at;
      const formattedExpiresAt = formatTelegramExpiry(expiresAt);

      if (!code) {
        message.error("Nao foi possivel obter o codigo do Telegram.");
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
          message.success("Codigo copiado para a area de transferencia.");
        } catch {
          message.info("Codigo gerado. Copie manualmente se necessario.");
        }
      }

      Modal.info({
        title: "Vincular conta no Telegram",
        content: (
          <div className="telegram-link-modal">
            <p>Use este codigo no bot do Telegram para vincular sua conta:</p>
            <div className="telegram-link-code">{code}</div>
            <p>Validade: {formattedExpiresAt}</p>
          </div>
        ),
        okText: "Fechar",
      });
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ??
        error?.response?.data?.data?.message ??
        "Nao foi possivel gerar o codigo do Telegram.";

      message.error(apiMessage);
    } finally {
      hideLoading();
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
              handleTelegramLinkCode();
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
    </div>
  );
};

export default CustomMenu;
