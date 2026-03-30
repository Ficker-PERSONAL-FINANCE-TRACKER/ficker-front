import { Col, Space } from "antd";
import styles from "./transactiontab.module.scss";
import dayjs from "dayjs";
import Image from "next/image";
import { EditTransactionModal } from "@/components/ModalEditTransaction";
import { useState } from "react";
import { ITransaction } from "@/interfaces";
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
  WifiOutlined,
  ShoppingOutlined,
  TagsOutlined
} from "@ant-design/icons";

interface TransactionTabProps {
  data: ITransaction[];
  typeId: number;
  editModal: boolean;
  setEditModal: (value: boolean) => void;
}
export const TransactionTab = ({ data, typeId, editModal, setEditModal }: TransactionTabProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction>({} as ITransaction);
  const [loading, setLoading] = useState<boolean>(false);

  const openEditModal = (transcation: ITransaction) => {
    setEditModal(true);
    setSelectedTransaction(transcation);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1);
  };

  const formatCurrency = (value: any) => {
    const formattedValue = parseFloat(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return formattedValue;
  };

  const getCategoryInfo = (description: string) => {
    const desc = description?.toLowerCase() || "";
    
    // Rendas
    if (desc.includes("salário")) return { icon: <DollarOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (desc.includes("freelance")) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (desc.includes("investimentos")) return { icon: <WalletOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (desc.includes("renda extra")) return { icon: <StarOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    
    // Gastos
    if (desc.includes("alimentação")) return { icon: <RestOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (desc.includes("casa")) return { icon: <HomeOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (desc.includes("transporte")) return { icon: <CarOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (desc.includes("saúde")) return { icon: <MedicineBoxOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (desc.includes("lazer")) return { icon: <CoffeeOutlined />, color: "#FF754C", bg: "#FFEBE6" };
    if (desc.includes("contas")) return { icon: <ThunderboltOutlined />, color: "#FFD700", bg: "#FFFBE6" };
    if (desc.includes("internet")) return { icon: <WifiOutlined />, color: "#8E82EF", bg: "#F5F3FF" };
    if (desc.includes("compras")) return { icon: <ShoppingOutlined />, color: "#FF4D4F", bg: "#FFF1F0" };
    
    // Padrão
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

  if (loading) return <div>Carregando...</div>;

  return (
    <div style={{ width: '100%' }}>
      <EditTransactionModal
        isModalOpen={editModal}
        setIsModalOpen={setEditModal}
        transaction={{ ...selectedTransaction, type_id: typeId }}
      />
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th>Editar</th>
            <th>Descrição</th>
            <th>Data</th>
            <th>Categoria</th>
            <th>Valor</th>
            {typeId === 2 && <th>Pagamento</th>}
          </tr>
        </thead>
        <tbody>
          <>
            {data?.map((transaction) => (
              <tr key={transaction.id}>
                <td className={styles.tdEdit}>
                  <button
                    style={{ background: "none", border: "none" }}
                    onClick={() => openEditModal(transaction)}
                  >
                    <Image src="/edit.png" alt="Editar" width={20} height={20} />
                  </button>
                </td>
                <td className={styles.tdDescription}>{transaction.transaction_description}</td>
                <td className={styles.tdDate}>{dayjs(transaction.date).format("DD/MM/YYYY")}</td>
                <td className={styles.tdCategory}>
                  <div
                    style={{
                      backgroundColor: getCategoryInfo(transaction.category_description).bg,
                      color: getCategoryInfo(transaction.category_description).color,
                      padding: "6px 12px",
                      borderRadius: "12px",
                      textAlign: "center",
                      fontSize: "13px",
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      minWidth: "100px",
                      justifyContent: "center"
                    }}
                  >
                    {getCategoryInfo(transaction.category_description).icon}
                    {transaction.category_description || "-"}
                  </div>
                </td>
                <td className={styles.tdValue} style={{ color: transaction.type_id === 1 ? "green" : "red" }}>
                  {transaction.type_id === 1 ? " " : "-"}
                  {formatCurrency(transaction.transaction_value)}
                </td>
                {typeId === 2 && (
                  <td>
                    <div
                      style={{
                        backgroundColor: getPaymentMethodInfo(transaction.payment_method_id).bg,
                        color: getPaymentMethodInfo(transaction.payment_method_id).color,
                        padding: "6px 12px",
                        borderRadius: "20px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        minWidth: "90px",
                        justifyContent: "center"
                      }}
                    >
                      {getPaymentMethodInfo(transaction.payment_method_id).icon}
                      {getPaymentMethodInfo(transaction.payment_method_id).label}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </>
        </tbody>
      </table>
    </div>
  );
};
