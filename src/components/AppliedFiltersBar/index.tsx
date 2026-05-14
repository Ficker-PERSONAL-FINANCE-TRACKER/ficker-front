"use client";

import React from "react";
import { CloseOutlined } from "@ant-design/icons";
import styles from "./appliedfiltersbar.module.scss";

interface AppliedFiltersBarProps {
  filters: string[];
  onClear?: () => void;
  style?: React.CSSProperties;
}

export const AppliedFiltersBar: React.FC<AppliedFiltersBarProps> = ({ filters, onClear, style }) => {
  if (!filters || filters.length === 0) return null;

  return (
    <div className={styles.barContainer} style={style}>
      <div className={styles.verticalLine} />
      <span className={styles.label}>Filtros Aplicados:</span>
      <div className={styles.filtersList}>
        {filters.map((filter, index) => (
          <span key={index} className={styles.filterItem}>
            {filter}
            {index < filters.length - 1 && <span className={styles.separator}>•</span>}
          </span>
        ))}
      </div>
      {onClear && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={onClear}
          aria-label="Limpar filtros"
          title="Limpar filtros"
        >
          <CloseOutlined />
        </button>
      )}
    </div>
  );
};
