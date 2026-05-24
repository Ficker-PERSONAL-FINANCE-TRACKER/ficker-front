import { Col, Tooltip } from "antd";
import styles from "./transactiontab.module.scss";
import dayjs from "dayjs";
import Image from "next/image";
import { EditTransactionModal } from "@/components/ModalEditTransaction";
import { useState } from "react";
import { ITransaction } from "@/interfaces";
import { TransactionInstallmentsModal } from "@/components/TransactionInstallmentsModal";
import {
  DollarOutlined,
  ThunderboltOutlined,
  CreditCardOutlined,
  FieldTimeOutlined,
  RocketOutlined,
  WalletOutlined,
  StarOutlined,
  RestOutlined,
  HomeOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  CoffeeOutlined,
  ReadOutlined,
  WifiOutlined,
  ShoppingOutlined,
  TagsOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

export type TransactionSortBy =
  | "transaction_description"
  | "date"
  | "category_description"
  | "transaction_value"
  | "payment_method_description";

export type TransactionSortDirection = "asc" | "desc";

export interface TransactionSortConfig {
  sortBy: TransactionSortBy;
  direction: TransactionSortDirection;
}

interface TransactionTabProps {
  data: ITransaction[];
  typeId: number;
  editModal: boolean;
  setEditModal: (value: boolean) => void;
  sortConfig?: TransactionSortConfig;
  onSortChange?: (config: TransactionSortConfig) => void;
  sortableColumns?: TransactionSortBy[];
}

export const TransactionTab = ({ data, typeId, editModal, setEditModal, sortConfig, onSortChange, sortableColumns = [] }: TransactionTabProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction>({} as ITransaction);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
  const [selectedInstallmentsTransaction, setSelectedInstallmentsTransaction] = useState<ITransaction | null>(null);

  const openEditModal = (transcation: ITransaction) => {
    setEditModal(true);
    setSelectedTransaction(transcation);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1);
  };

  const openInstallmentsModal = (transaction: ITransaction) => {
    setSelectedInstallmentsTransaction(transaction);
    setIsInstallmentsModalOpen(true);
  };

  const formatCurrency = (value: any) => {
    return parseFloat(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getTransactionPresentation = (transaction: ITransaction) => {
    if (transaction.type_id === 1) {
      return {
        label: "Entrada",
        valueColor: "#16a34a",
        signal: " ",
      };
    }

    if (transaction.is_invoice_payment) {
      return {
        label: "Pagamento de fatura",
        valueColor: "#dc2626",
        signal: "-",
      };
    }

    if (transaction.is_credit_card_purchase) {
      return {
        label: "Compra no cartão",
        valueColor: "#eab308",
        signal: "-",
        badgeBg: "#FFF7E6",
        badgeColor: "#D48806",
      };
    }

    return {
      label: "Saída",
      valueColor: "#dc2626",
      signal: "-",
    };
  };

  const getCategoryInfo = (transaction: ITransaction) => {
    const id = Number(transaction.category_id);
    const description = (transaction.category_description || "").toLowerCase();
    const normalizedDescription = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (transaction.is_invoice_payment) {
      return { icon: <TagsOutlined />, color: "#FF4D4F", bg: "#FFF1F0" };
    }

    if (transaction.is_credit_card_purchase) {
      return { icon: <ShoppingOutlined />, color: "#D48806", bg: "#FFF7E6" };
    }

    // Map by ID (Highest priority)
    if (id === 1) return { icon: <DollarOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (id === 2) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (id === 3) return { icon: <WalletOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (id === 4) return { icon: <StarOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (id === 5) return { icon: <CarOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (id === 6) return { icon: <MedicineBoxOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (id === 7) return { icon: <CoffeeOutlined />, color: "#FF754C", bg: "#FFEBE6" };
    if (id === 8) return { icon: <ThunderboltOutlined />, color: "#FFD700", bg: "#FFFBE6" };
    if (id === 9) return { icon: <WifiOutlined />, color: "#8E82EF", bg: "#F5F3FF" };
    if (id === 10) return { icon: <ShoppingOutlined />, color: "#FF4D4F", bg: "#FFF1F0" };
    if (id === 11) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };

    // Fallback by description (for legacy or untracked IDs)
    if (description.includes("salário")) return { icon: <DollarOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (description.includes("freelance")) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (description.includes("invest")) return { icon: <WalletOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (description.includes("renda extra")) return { icon: <StarOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (normalizedDescription.includes("moradia")) return { icon: <HomeOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (normalizedDescription.includes("alimentacao")) return { icon: <RestOutlined />, color: "#FF754C", bg: "#FFEBE6" };
    if (normalizedDescription.includes("educacao")) return { icon: <ReadOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (description.includes("transporte")) return { icon: <CarOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (description.includes("saúde")) return { icon: <MedicineBoxOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (description.includes("lazer")) return { icon: <CoffeeOutlined />, color: "#FF754C", bg: "#FFEBE6" };
    if (description.includes("conta")) return { icon: <ThunderboltOutlined />, color: "#FFD700", bg: "#FFFBE6" };
    if (description.includes("internet")) return { icon: <WifiOutlined />, color: "#8E82EF", bg: "#F5F3FF" };
    if (description.includes("compra")) return { icon: <ShoppingOutlined />, color: "#D48806", bg: "#FFF7E6" };
    if (description.includes("projetos")) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };

    // Default icon for custom categories
    return { icon: <TagsOutlined />, color: "#808191", bg: "#F8FAFC" };
  };

  const getPaymentMethodInfo = (id: number) => {
    switch (id) {
      case 1:
        return { label: "Dinheiro", icon: <DollarOutlined />, color: "#00875A", bg: "#E6F7EF" };
      case 2:
        return { label: "Pix", icon: <ThunderboltOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
      case 3:
        return { label: "Débito", icon: <CreditCardOutlined />, color: "#FFA940", bg: "#FFF7E6" };
      default:
        return { label: "Crédito", icon: <FieldTimeOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    }
  };

  const isCardDetailTable = typeId === 3;
  const canSort = Boolean(sortConfig && onSortChange);

  const handleSort = (sortBy: TransactionSortBy) => {
    if (!sortConfig || !onSortChange || !sortableColumns.includes(sortBy)) return;

    onSortChange({
      sortBy,
      direction: sortConfig.sortBy === sortBy && sortConfig.direction === "asc" ? "desc" : "asc",
    });
  };

  const renderSortIndicator = (sortBy: TransactionSortBy) => {
    const isActive = sortConfig?.sortBy === sortBy;

    return (
      <span
        style={{
          marginLeft: 6,
          color: isActive ? "#11142D" : "#C7CAD1",
          fontWeight: isActive ? 800 : 500,
        }}
      >
        {isActive && sortConfig?.direction === "desc" ? "↓" : "↑"}
      </span>
    );
  };

  const renderHeader = (label: string, sortBy?: TransactionSortBy) => {
    const isSortable = Boolean(sortBy && canSort && sortableColumns.includes(sortBy));
    const isActive = Boolean(sortBy && sortConfig?.sortBy === sortBy);

    return (
      <th
        onClick={() => sortBy && handleSort(sortBy)}
        style={
          isSortable
            ? {
                cursor: "pointer",
                userSelect: "none",
                color: isActive ? "#11142D" : undefined,
                fontWeight: isActive ? 800 : undefined,
                whiteSpace: "nowrap",
              }
            : undefined
        }
      >
        {label}
        {sortBy && isSortable && renderSortIndicator(sortBy)}
      </th>
    );
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <Col xs={24} lg={24} style={{ width: "100%" }}>
      <EditTransactionModal
        isModalOpen={editModal}
        setIsModalOpen={setEditModal}
        transaction={selectedTransaction}
      />

      <TransactionInstallmentsModal
        isOpen={isInstallmentsModalOpen}
        onClose={() => {
          setIsInstallmentsModalOpen(false);
          setSelectedInstallmentsTransaction(null);
        }}
        transactionId={selectedInstallmentsTransaction?.id ?? null}
        transactionDescription={selectedInstallmentsTransaction?.transaction_description}
      />

      <div style={{ width: "100%", overflowX: isCardDetailTable ? "auto" : "visible", paddingBottom: isCardDetailTable ? 8 : 0 }}>
        <table className={styles.table} style={isCardDetailTable ? { minWidth: 860 } : undefined}>

          <thead className={styles.thead}>
            <tr>
              <th>Editar</th>
              {renderHeader("Descrição", "transaction_description")}
              {renderHeader("Data", "date")}
              {renderHeader("Categoria", "category_description")}
              {renderHeader("Valor", "transaction_value")}
              {typeId === 2 && renderHeader("Pagamento", "payment_method_description")}
              {typeId === 3 && <th>Parcelas</th>}
            </tr>
          </thead>
          <tbody>
            {data?.map((transaction) => {
              const presentation = getTransactionPresentation(transaction);
              const categoryInfo = getCategoryInfo(transaction);
              const paymentMethodInfo = getPaymentMethodInfo(transaction.payment_method_id);

              return (
                <tr key={transaction.id}>
                    <td className={styles.tdEdit}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => openEditModal(transaction)}
                      >
                        <Image src="/edit.png" alt="Editar" width={24} height={24} />
                      </button>
                    </td>

                    <td className={styles.tdDescription} style={isCardDetailTable ? { lineHeight: 1.35 } : undefined}>
                      <div>{transaction.transaction_description}</div>
                      {typeId === 2 && (
                        <span
                          className={styles.transactionKind}
                          style={
                            (presentation as any).badgeBg
                              ? {
                                  backgroundColor: (presentation as any).badgeBg,
                                  color: (presentation as any).badgeColor,
                                  padding: "2px 10px",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  display: "none", // Oculto no mobile conforme pedido
                                  marginTop: "4px",
                                }
                              : {
                                  fontSize: "12px",
                                  color: "#808191",
                                  display: "none", // Oculto no mobile conforme pedido
                                  marginTop: "2px",
                                }
                          }
                        >
                          {presentation.label}
                        </span>
                      )}
                    </td>
                    <td className={styles.tdDate} style={isCardDetailTable ? { whiteSpace: "nowrap" } : undefined}>
                      {dayjs(transaction.date).format("DD/MM/YYYY")}
                    </td>
                    <td className={styles.tdCategory}>
                      <div
                        style={{
                          backgroundColor: categoryInfo.bg,
                          color: categoryInfo.color,
                          padding: "6px 12px",
                          borderRadius: "12px",
                          textAlign: "center",
                          fontSize: "13px",
                          fontWeight: 500,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          minWidth: isCardDetailTable ? "0" : "100px",
                          justifyContent: "center",
                          width: "auto",
                          boxSizing: "border-box",
                        }}
                      >
                        {categoryInfo.icon}
                        <span>{transaction.category_description || "-"}</span>
                      </div>
                    </td>

                    <td className={styles.tdValue} style={{ color: presentation.valueColor, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                        <span>
                          {presentation.signal}
                          {formatCurrency(transaction.transaction_value)}
                        </span>
                        {transaction.is_credit_card_purchase && (
                          <Tooltip title="Compra no cartão: este valor será cobrado na fatura e não deduz do saldo atual imediatamente.">
                            <InfoCircleOutlined style={{ fontSize: "14px", cursor: "help" }} />
                          </Tooltip>
                        )}
                      </div>
                    </td>

                    {typeId === 2 && (
                      <td style={{ gridArea: "payment" }}>
                        <div
                          style={{
                            backgroundColor: paymentMethodInfo.bg,
                            color: paymentMethodInfo.color,
                            padding: "6px 12px",
                            borderRadius: "20px",
                            textAlign: "center",
                            fontSize: "12px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            minWidth: "90px",
                            justifyContent: "center",
                          }}
                        >
                          {paymentMethodInfo.icon}
                          {paymentMethodInfo.label}
                        </div>
                      </td>
                    )}

                    {typeId === 3 && (
                      <td style={{ gridArea: "installments" }}>
                        {transaction.installments > 1 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span>{transaction.installments}x</span>
                            <button
                              style={{
                                background: "#DBDEFF",
                                color: "#6C5DD3",
                                border: "none",
                                borderRadius: "16px",
                                padding: "4px 12px",
                                cursor: "pointer",
                              }}
                              onClick={() => openInstallmentsModal(transaction)}
                            >
                              Ver
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#808191" }}>Sem parcelas</span>
                        )}
                      </td>
                    )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Col>
  );
};
