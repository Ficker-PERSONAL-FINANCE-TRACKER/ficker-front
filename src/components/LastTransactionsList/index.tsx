import { Image, Empty, Button, Modal, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import "./styles.scss";
import { useMemo, useState } from "react";
import { ITransaction } from "@/interfaces";
import dayjs from "dayjs";

interface LastTransactionsListProps {
  transactions: ITransaction[];
  loading?: boolean;
}

type SortKey = "transaction_description" | "type_id" | "category_description" | "date" | "transaction_value";
type SortDirection = "asc" | "desc";

const LastTransactionsList = ({ transactions, loading = false }: LastTransactionsListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "date",
    direction: "desc",
  });

  const formatCurrency = (value: any) => {
    const formattedValue = parseFloat(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return formattedValue;
  };

  const getTransactionPresentation = (transaction: ITransaction) => {
    const isCreditCardPurchase = transaction.is_credit_card_purchase || (transaction.payment_method_id === 4 && !transaction.is_invoice_payment);

    if (transaction.type_id === 1) {
      return {
        icon: "/icons/icon-income.svg",
        label: "Entrada",
        valueColor: "green",
        signal: " ",
        badgeBg: "#E6F7EF",
        badgeColor: "#00875A",
      };
    }

    if (transaction.is_invoice_payment) {
      return {
        icon: "/icons/icon-expense.svg",
        label: "Pagamento de fatura",
        valueColor: "#DE350B",
        signal: "-",
        badgeBg: "#FFEBE6",
        badgeColor: "#DE350B",
      };
    }

    if (isCreditCardPurchase) {
      return {
        icon: "/icons/icon-expense.svg",
        label: "Compra no cartão",
        valueColor: "#D48806",
        signal: "-",
        badgeBg: "#FFF7E6",
        badgeColor: "#D48806",
        isCreditCardPurchase: true,
      };
    }

    return {
      icon: "/icons/icon-expense.svg",
      label: "Saída",
      valueColor: "red",
      signal: "-",
      badgeBg: "#FFEBE6",
      badgeColor: "#DE350B",
      isCreditCardPurchase: false,
    };
  };

  const displayedTransactions = transactions && transactions.length > 0 ? transactions.slice(0, 5) : [];
  const isEmptyState = !loading && displayedTransactions.length === 0;
  const sortedTransactions = useMemo(() => {
    const normalize = (value: unknown) => String(value ?? "").toLowerCase();

    return [...transactions].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      if (sortConfig.key === "date") {
        aValue = dayjs(a.date).valueOf();
        bValue = dayjs(b.date).valueOf();
      } else if (sortConfig.key === "transaction_value") {
        aValue = Number(a.transaction_value || 0);
        bValue = Number(b.transaction_value || 0);
      } else if (sortConfig.key === "type_id") {
        aValue = a.type_id === 1 ? "entrada" : "saida";
        bValue = b.type_id === 1 ? "entrada" : "saida";
      } else {
        aValue = normalize(a[sortConfig.key]);
        bValue = normalize(b[sortConfig.key]);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [transactions, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const renderSortIndicator = (key: SortKey) => {
    const isActive = sortConfig.key === key;

    return (
      <span
        style={{
          marginLeft: 6,
          color: isActive ? "#11142D" : "#C7CAD1",
          fontWeight: isActive ? 800 : 500,
        }}
      >
        {isActive && sortConfig.direction === "desc" ? "↓" : "↑"}
      </span>
    );
  };

  const sortableHeaderStyle = (key: SortKey, align: "left" | "right" = "left") => ({
    padding: "12px 8px",
    color: sortConfig.key === key ? "#11142D" : "#808191",
    fontWeight: sortConfig.key === key ? 800 : 600,
    textAlign: align,
    cursor: "pointer",
    userSelect: "none" as const,
    whiteSpace: "nowrap" as const,
  });
  const truncatedCellStyle = {
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    lineHeight: "18px",
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h4 style={{ margin: 0 }}>Últimas transações</h4>
        {transactions && transactions.length > 0 && (
          <Button 
            type="link" 
            onClick={() => setIsModalOpen(true)} 
            style={{ 
              color: '#6C5DD3', 
              fontWeight: 600, 
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            Ver mais
          </Button>
        )}
      </div>

      <div className="transactions-area">
        {loading ? (
          <div style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#808191" }}>
            Carregando transações...
          </div>
        ) : displayedTransactions.length > 0 ? (
          displayedTransactions.map((transaction) => {
            const presentation = getTransactionPresentation(transaction);

            return (
              <div className="transaction-area" key={transaction.id}>
                <div className="transaction-area__infos">
                  <Image
                    src={presentation.icon}
                    alt="icon-search"
                    width={25}
                    height={25}
                  />
                  <div className="transaction-area__description">
                    <p title={transaction.transaction_description}>{transaction.transaction_description}</p>
                    <span>{presentation.label}</span>
                  </div>
                </div>
                <div
                  className="transaction-area__value"
                  style={{ color: presentation.valueColor, display: "flex", alignItems: "center", gap: "4px" }}
                >
                  {presentation.signal}
                  {formatCurrency(transaction.transaction_value)}
                  {presentation.isCreditCardPurchase && (
                    <Tooltip title="Compra no cartão: este valor será cobrado na fatura e não deduz do saldo atual imediatamente.">
                      <InfoCircleOutlined style={{ fontSize: "14px", cursor: "help" }} />
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nenhuma transação encontrada."
            style={{ margin: "51px 0 20px" }}
          />
        )}
      </div>

      <Modal
        title="Histórico completo de transações"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}
        centered
      >
        <div>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "21%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
                <th style={sortableHeaderStyle("transaction_description")} onClick={() => handleSort("transaction_description")}>Descrição{renderSortIndicator("transaction_description")}</th>
                <th style={sortableHeaderStyle("type_id")} onClick={() => handleSort("type_id")}>Tipo{renderSortIndicator("type_id")}</th>
                <th style={sortableHeaderStyle("category_description")} onClick={() => handleSort("category_description")}>Categoria{renderSortIndicator("category_description")}</th>
                <th style={sortableHeaderStyle("date")} onClick={() => handleSort("date")}>Data{renderSortIndicator("date")}</th>
                <th style={sortableHeaderStyle("transaction_value", "right")} onClick={() => handleSort("transaction_value")}>Valor{renderSortIndicator("transaction_value")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction) => {
                const presentation = getTransactionPresentation(transaction);
                const modalTypeLabel = transaction.type_id === 1 ? "Entrada" : "Saída";

                return (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td
                      title={transaction.transaction_description}
                      style={{ padding: '16px 8px', fontWeight: 500, fontSize: 13, ...truncatedCellStyle }}
                    >
                      {transaction.transaction_description}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: 13 }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px',
                        background: presentation.badgeBg,
                        color: presentation.badgeColor
                      }}>
                        {modalTypeLabel}
                      </span>
                    </td>
                    <td
                      title={transaction.category_description || "-"}
                      style={{ padding: '16px 8px', color: '#808191', fontSize: 13, ...truncatedCellStyle }}
                    >
                      {transaction.category_description || "-"}
                    </td>
                    <td style={{ padding: '16px 8px', color: '#808191', fontSize: 13 }}>
                      {dayjs(transaction.date).format("DD/MM/YYYY")}
                    </td>
                    <td style={{ 
                      padding: '16px 8px', 
                      textAlign: 'right',
                      fontWeight: 700,
                      fontSize: 13,
                      color: presentation.valueColor
                    }}>
                      <div
                        title={`${presentation.signal === ' ' ? '+ ' : '- '}${formatCurrency(transaction.transaction_value)}`}
                        style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", minWidth: 0 }}
                      >
                        <span style={{ textAlign: "right", ...truncatedCellStyle }}>
                          {presentation.signal === ' ' ? '+ ' : '- '}
                          {formatCurrency(transaction.transaction_value)}
                        </span>
                        {presentation.isCreditCardPurchase && (
                          <Tooltip title="Compra no cartão: este valor será cobrado na fatura e não deduz do saldo atual imediatamente.">
                            <InfoCircleOutlined style={{ fontSize: "14px", cursor: "help", fontWeight: 400 }} />
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default LastTransactionsList;
