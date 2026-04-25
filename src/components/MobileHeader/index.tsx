"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MenuOutlined } from "@ant-design/icons";
import styles from "./mobileheader.module.scss";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className={styles.mobileHeader}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={100} height={21} priority />
        </Link>
      </div>
      <button className={styles.menuButton} onClick={onMenuClick}>
        <MenuOutlined style={{ fontSize: 22, color: "#6C5DD3" }} />
      </button>
    </header>
  );
};
