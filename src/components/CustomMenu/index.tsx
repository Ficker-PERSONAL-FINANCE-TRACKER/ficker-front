"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import type { MenuProps } from "antd";
import { Drawer, Menu, Dropdown, Modal, message } from "antd";
import Image from "next/image";
import "./styles.scss";
import { usePathname, useRouter } from "next/navigation";
import { Cookies } from "react-cookie";
import { 
  ApiOutlined,
  TagOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import useMediaQuery from "use-media-antd-query";
import SidebarAlert from "../SidebarAlert";
import Link from "next/link";
import { request } from "@/service/api";
import { MobileHeader } from "../MobileHeader";
import MainContext from "@/context";

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
    "Teto de gastos",
    "7",
    <TagOutlined style={{ fontSize: 22 }} />
  ),
  getItem(
    "Objetivos",
    "8",
    <Image src="/icons/icon-home.svg" alt="Objetivos" width={22} height={22} style={{ filter: 'hue-rotate(45deg)' }} />
  ),
   getItem(
    "Análises",
    "5",
    <Image src="/icons/icon-analysis.svg" alt="Análises" width={22} height={22} />
  ),
  getItem("Integrações", "9", <ApiOutlined style={{ fontSize: 22 }} />),
  getItem(
    "Sair",
    "10",
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
  "7": "/categories",
  "8": "/objectives",
  "9": "/integrations",
};

const CustomMenu: React.FC<CustomMenuProps> = ({ balance, user, showAlert = true }) => {
  const router = useRouter();
  const { setAuth } = useContext(MainContext);
  const pathname = usePathname();
  const cookie = new Cookies();
  const menu = cookie.get("menu");
  const colSize = useMediaQuery();
  const [showMenu, setShowMenu] = useState<boolean>(colSize === "xs" ? false : true);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);

  const isMobile = colSize === "xs" || colSize === "sm";

  const selectedKey =
    Object.entries(paths).find(([, path]) => path === pathname)?.[0] ?? (menu ? menu.toString() : "1");

  const [userData, setUserData] = useState<{ name: string } | null>(user ?? null);
  const [balanceData, setBalanceData] = useState<any>(balance || null);
  const toggleMenu = () => {
    if (isMobile) {
      setMobileDrawerVisible(!mobileDrawerVisible);
    } else {
      setShowMenu(!showMenu);
    }
  };

  const handleExportData = () => {
    Modal.confirm({
      title: 'Exportar Dados',
      icon: <ExclamationCircleOutlined />,
      content: 'Deseja exportar todos os seus dados (transações, cartões, objetivos, etc.)?',
      okText: 'Exportar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const response = await request({ method: "GET", endpoint: "user/export" });
          const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `ficker_export_${new Date().toISOString().split('T')[0]}.json`);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(url);
          message.success("Dados exportados com sucesso!");
        } catch (error) {
          console.error("Erro ao exportar dados:", error);
          message.error("Erro ao exportar dados.");
        }
      }
    });
  };

  const showDeleteConfirm = () => {
    Modal.confirm({
      title: 'Excluir Conta',
      icon: <ExclamationCircleOutlined />,
      content: 'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados serão perdidos.',
      okText: 'Sim, excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await request({ method: "DELETE", endpoint: "user" });
          localStorage.removeItem("token");
          localStorage.removeItem("user_data");
          cookie.remove("menu");
          window.location.replace("/login");
        } catch (error) {
          console.error("Erro ao excluir conta:", error);
          message.error("Erro ao excluir conta.");
        }
      }
    });
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'export',
      label: 'Exportar Dados',
      onClick: () => handleExportData()
    },
    {
      key: 'delete',
      label: 'Excluir conta',
      danger: true,
      onClick: () => showDeleteConfirm()
    }
  ];

  useEffect(() => {
    if (!isMobile) {
      setMobileDrawerVisible(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobile) {
      document.body.classList.add("has-mobile-header");
      setShowMenu(false);
    } else {
      document.body.classList.remove("has-mobile-header");
      setShowMenu(true);
    }

    return () => {
      document.body.classList.remove("has-mobile-header");
    };
  }, [isMobile]);

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
            const data = response.data.data || response.data;
            setUserData(data);
            localStorage.setItem("user_data", JSON.stringify(data));
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      } else {
        setUserData(user);
        localStorage.setItem("user_data", JSON.stringify(user));
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

  const menuContent = useMemo(() => {
    return (
      <div className="menu-sidebar show">
        <div>
          <div className="logo-sidebar">
            <Link href="/" onClick={() => setMobileDrawerVisible(false)}>
              <Image src="/logo.png" alt="Logo" width={130} height={27} />
            </Link>
          </div>
          <Menu
            style={{ width: "100%", border: "none" }}
            selectedKeys={[selectedKey]}
            mode="inline"
            items={items}
            onClick={async ({ key }) => {
              cookie.set("menu", key);
              if (key === "10") {
                try {
                  await request({ method: "POST", endpoint: "logout" });
                } catch (error) {
                  console.error("Logout falhou:", error);
                }
                cookie.remove("menu");
                localStorage.removeItem("token");
                localStorage.removeItem("user_data");
                setMobileDrawerVisible(false);
                window.location.replace("/login");
              } else {
                const targetPath = paths[key];
                if (targetPath) {
                  setMobileDrawerVisible(false);
                  router.push(targetPath);
                }
              }
            }}
          />
        </div>

        <div className="sidebar-footer">
          {balanceData && (
            <SidebarAlert balance={balanceData} visible={showAlert && pathname === "/"} />
          )}
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
              <div className="avatar-circle" style={{ flexShrink: 0 }}>{userData?.name?.[0]?.toUpperCase() || "U"}</div>
              <div className="user-info" style={{ overflow: 'hidden' }}>
                <span className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                  {userData?.name ? userData.name.split(" ").slice(0, 2).join(" ") : "User"}
                </span>
              </div>
            </div>
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="topRight">
              <MoreOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#666', flexShrink: 0 }} />
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }, [balanceData, cookie, pathname, router, selectedKey, showAlert, userData]);

  return (
    <div className="sidebar-container" style={isMobile ? { width: 0, flex: "0 0 0" } : undefined}>
      {isMobile && (
        <>
          <MobileHeader onMenuClick={toggleMenu} />
          <Drawer
            placement="left"
            open={mobileDrawerVisible}
            onClose={() => setMobileDrawerVisible(false)}
            closable={false}
            width={280}
            bodyStyle={{ padding: 0 }}
          >
            {menuContent}
          </Drawer>
        </>
      )}

      {!isMobile && showMenu && (
        <div className="menu-sidebar show">
          <div>
            <div className="logo-sidebar">
              <Link href="/">
                <Image src="/logo.png" alt="Logo" width={130} height={27} />
              </Link>
            </div>
            <Menu
              style={{ width: "100%", border: "none" }}
              selectedKeys={[selectedKey]}
              mode="inline"
              items={items}
              onClick={async ({ key }) => {
                cookie.set("menu", key);
                if (key === "10") {
                  try {
                    await request({ method: "POST", endpoint: "logout" });
                  } catch (error) {
                    console.error("Logout falhou:", error);
                  }
                  cookie.remove("menu");
                  localStorage.removeItem("token");
                  localStorage.removeItem("user_data");
                  window.location.replace("/login");
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
              <SidebarAlert balance={balanceData} visible={showAlert && pathname === "/"} />
            )}
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div className="avatar-circle" style={{ flexShrink: 0 }}>{userData?.name?.[0]?.toUpperCase() || "U"}</div>
                <div className="user-info" style={{ overflow: 'hidden' }}>
                  <span className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {userData?.name ? userData.name.split(" ").slice(0, 2).join(" ") : "User"}
                  </span>
                </div>
              </div>
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="topRight">
                <MoreOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#666', flexShrink: 0 }} />
              </Dropdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomMenu;
