"use client";

import { useEffect, useState } from "react";
import { Alert, Modal, Spin, Table, Tag } from "antd";
import dayjs from "dayjs";
import { request } from "@/service/api";

interface Installment {
  id: number;
  installment_number?: number;
  installment_value: number;
  pay_day: string;
  paid_at: string | null;
  payment_transaction_id: number | null;
}

interface TransactionInstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number | null;
  transactionDescription?: string;
}

export const TransactionInstallmentsModal = ({
  isOpen,
  onClose,
  transactionId,
  transactionDescription,
}: TransactionInstallmentsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const loadInstallments = async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await request({
        method: "GET",
        endpoint: `transaction/${transactionId}/installments`,
      });

      setInstallments(Array.isArray(response?.data) ? response.data : []);
    } catch (error: any) {
      if (error?.response?.data?.data?.message) {
        setErrorMessage(error.response.data.data.message);
      } else if (error?.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Não foi possível carregar as parcelas da transação.");
      }
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && transactionId) {
      loadInstallments();
    }
  }, [isOpen, transactionId]);

  return (
    <Modal
      title={`Parcelas${transactionDescription ? ` - ${transactionDescription}` : ""}`}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {errorMessage && (
        <Alert
          type="error"
          message="Ocorreu um erro"
          description={errorMessage}
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setErrorMessage("")}
        />
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          rowKey="id"
          pagination={false}
          dataSource={installments}
          locale={{ emptyText: "Nenhuma parcela encontrada." }}
          columns={[
            {
              title: "Parcela",
              render: (_, __, index) => `${index + 1}/${installments.length}`,
            },
            {
              title: "Vencimento",
              dataIndex: "pay_day",
              render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
            },
            {
              title: "Valor",
              dataIndex: "installment_value",
              render: (value: number) => formatCurrency(value),
            },
            {
              title: "Status",
              render: (_, record: Installment) =>
                record.paid_at ? <Tag color="green">Paga</Tag> : <Tag color="orange">Em aberto</Tag>,
            },
            {
              title: "Pago em",
              render: (_, record: Installment) =>
                record.paid_at ? dayjs(record.paid_at).format("DD/MM/YYYY HH:mm") : "-",
            },
          ]}
        />
      )}
    </Modal>
  );
};
