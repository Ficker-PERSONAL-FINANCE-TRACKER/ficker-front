"use client";
import { CardInformation } from "@/components/CardInformation";
import { TransactionTab } from "@/components/TransactionTab";
import { request } from "@/service/api";
import { Col, Row } from "antd";
import { useEffect, useState } from "react";
import styles from "../../EnterTransaction/entertransaction.module.scss";
import { CardTransactionModal } from "./mcardtransaction";
import { PayInvoiceModal } from "./payInvoiceModal";
import { ITransaction } from "@/interfaces";

interface Card {
  best_day: number;
  created_at: Date;
  card_description: string;
  expiration: number;
  flag_id: number;
  id: number;
  updated_at: Date;
  user_id: number;
  invoice_pay_day?: string | null;
}

interface CardProps {
  card: Card;
}

function CardPage({ card }: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState<boolean>(false);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [cardTranscations, setCardTransactions] = useState<ITransaction[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [invoicePayDay, setInvoicePayDay] = useState<string | null>(card.invoice_pay_day ?? null);

  const getCardTotalValue = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: `cards/${card.id}/invoice`,
      });
      setTotalValue(response?.data?.data?.invoice || 0);
      setInvoicePayDay(response?.data?.data?.pay_day || null);
    } catch (error) {}
  };

  const getCardData = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: `transaction/card/${card.id}`,
      });
      if (response.data.data.transactions.length > 0) {
        setCardTransactions(response.data.data.transactions);
      } else {
        setCardTransactions([]);
      }
    } catch (error) {}
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const openOutputModal = () => {
    setIsOutputModalOpen(true);
  };

  useEffect(() => {
    getCardData();
    getCardTotalValue();
  }, [isModalOpen, isOutputModalOpen]);

  return (
    <Col xl={24}>
      <CardTransactionModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} cardId={card.id} />
      <PayInvoiceModal
        isModalOpen={isOutputModalOpen}
        setIsModalOpen={setIsOutputModalOpen}
        cardId={card.id}
        cardDescription={card.card_description}
        onSuccess={() => {
          getCardData();
          getCardTotalValue();
        }}
      />
      <Row gutter={[24, 24]} style={{ padding: "0 18px", paddingLeft: 0 }}>
        <Col xl={14} lg={14} md={24} xs={24} style={{ paddingLeft: 0 }}>
          <TransactionTab
            data={cardTranscations}
            typeId={3}
            editModal={isEditModalOpen}
            setEditModal={setIsEditModalOpen}
          />
        </Col>
        <Col xl={10} lg={10} md={24} xs={24}>
          <div style={{ padding: 0, width: "100%" }}>
            <CardInformation card={{ ...card, invoice_pay_day: invoicePayDay }} totalValue={totalValue} />
            <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
              <Col span={12}>
                <button className={styles.button} onClick={openModal} style={{ width: "100%", marginTop: 0, padding: "10px 0" }}>
                  Nova transação
                </button>
              </Col>
              <Col span={12}>
                <button className={styles.button} onClick={openOutputModal} style={{ width: "100%", marginTop: 0, padding: "10px 0" }}>
                  Pagar Fatura
                </button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Col>
  );
}

export default CardPage;
