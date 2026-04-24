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
  ApiOutlined,
  TagOutlined,
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
    "Meta de gastos",
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
  const pathname = usePathname();
  const cookie = new Cookies();
  const menu = cookie.get("menu");
  const colSize = useMediaQuery();
  const [showMenu, setShowMenu] = useState<boolean>(colSize === "xs" ? false : true);

  const selectedKey =
    Object.entries(paths).find(([, path]) => path === pathname)?.[0] ?? (menu ? menu.toString() : "1");

  const [userData, setUserData] = useState<{ name: string } | null>(() => {
    if (user) return user;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_data");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
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

  return (
    <div className="sidebar-container">
      {/* <div className="burger-area">
        <BarsOutlined onClick={toggleMenu} className="burger-icon" />
      </div> */}
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
                cookie.set("menu", key);
                if (key === "10") {
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
              <SidebarAlert balance={balanceData} visible={showAlert && pathname === "/"} />
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
    </div>
  );
};

export default CustomMenu;
