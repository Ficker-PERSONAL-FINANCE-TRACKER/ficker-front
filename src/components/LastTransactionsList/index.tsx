import { Image, Empty, Button, Modal } from "antd";
import "./styles.scss";
import { useEffect, useState } from "react";
import { ITransaction } from "@/interfaces";
import { request } from "@/service/api";
import Link from "next/link";
import dayjs from "dayjs";

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
        title="Histórico Completo de Transações"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}
        centered
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: '#808191', fontWeight: 600 }}>Descrição</th>
                <th style={{ padding: '12px 8px', color: '#808191', fontWeight: 600 }}>Tipo</th>
                <th style={{ padding: '12px 8px', color: '#808191', fontWeight: 600 }}>Categoria</th>
                <th style={{ padding: '12px 8px', color: '#808191', fontWeight: 600 }}>Data</th>
                <th style={{ padding: '12px 8px', color: '#808191', fontWeight: 600, textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '16px 8px', fontWeight: 500 }}>{transaction.transaction_description}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px',
                      background: transaction.type_id === 1 ? '#E6F7EF' : '#FFEBE6',
                      color: transaction.type_id === 1 ? '#00875A' : '#DE350B'
                    }}>
                      {transaction.type_id === 1 ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px', color: '#808191' }}>{transaction.category_description || "-"}</td>
                  <td style={{ padding: '16px 8px', color: '#808191' }}>
                    {dayjs(transaction.date).format("DD/MM/YYYY")}
                  </td>
                  <td style={{ 
                    padding: '16px 8px', 
                    textAlign: 'right',
                    fontWeight: 700,
                    color: transaction.type_id === 1 ? "#00875A" : "#DE350B"
                  }}>
                    {transaction.type_id === 1 ? "+ " : "- "}
                    {formatCurrency(transaction.transaction_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default LastTransactionsList;
