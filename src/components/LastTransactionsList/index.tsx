import { Image, Empty, Button, Modal } from "antd";
import "./styles.scss";
import { useEffect, useState } from "react";
import { ITransaction } from "@/interfaces";
import { request } from "@/service/api";
import Link from "next/link";

const LastTransactionsList = () => {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTransactions = async () => {
    try {
      const { data } = await request({
        method: "GET",
        endpoint: "transaction/all",
      });
      setTransactions(data.data.transactions);
    } catch (error) {
      console.log(error);
    }
  };

  const formatCurrency = (value: any) => {
    const formattedValue = parseFloat(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return formattedValue;
  };

  useEffect(() => {
    getTransactions();
  }, []);

  const displayedTransactions = transactions && transactions.length > 0 ? transactions.slice(0, 5) : [];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h4 style={{ margin: 0 }}>Últimas Transações</h4>
        {transactions.length > 5 && (
            <Button type="link" onClick={() => setIsModalOpen(true)} style={{ color: '#6C5DD3', fontWeight: 600, padding: 0 }}>
              Ver mais
            </Button>
        )}
      </div>

      <div className="transactions-area">
        {displayedTransactions.length > 0 ? (
          displayedTransactions.map((transaction) => (
            <div className="transaction-area" key={transaction.id}>
              <div className="transaction-area__infos">
                <Image
                  src={transaction.type_id === 1 ? "/icons/icon-income.svg" : "/icons/icon-expense.svg"}
                  alt="icon-search"
                  width={25}
                  height={25}
                />
                <div className="transaction-area__description">
                  <p>{transaction.transaction_description}</p>
                  <span>{transaction.type_id === 1 ? "Entrada" : "Saída"}</span>
                </div>
              </div>
              <div
                className="transaction-area__value"
                style={{ color: transaction.type_id === 1 ? "green" : "red" }}
              >
                {transaction.type_id === 1 ? " " : "-"}
                {formatCurrency(transaction.transaction_value)}
              </div>
            </div>
          ))
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nenhuma transação encontrada."
            style={{ margin: "20px 0" }}
          >
            <Link href="/EnterTransaction">
              <Button type="primary">Registrar Transação</Button>
            </Link>
          </Empty>
        )}
      </div>

      <Modal
        title="Histórico de Transações"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px 0' }}
      >
        <div className="modal-transactions-list">
          {transactions.map((transaction) => (
            <div className="transaction-area" key={transaction.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '12px 10px', marginBottom: 0 }}>
              <div className="transaction-area__infos">
                <Image
                  src={transaction.type_id === 1 ? "/icons/icon-income.svg" : "/icons/icon-expense.svg"}
                  alt="icon"
                  width={30}
                  height={30}
                />
                <div className="transaction-area__description">
                  <p style={{ fontWeight: 600 }}>{transaction.transaction_description}</p>
                  <span>{transaction.type_id === 1 ? "Entrada" : "Saída"}</span>
                </div>
              </div>
              <div
                className="transaction-area__value"
                style={{ color: transaction.type_id === 1 ? "#00875A" : "#DE350B", fontWeight: 700 }}
              >
                {transaction.type_id === 1 ? "+ " : "- "}
                {formatCurrency(transaction.transaction_value)}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default LastTransactionsList;
