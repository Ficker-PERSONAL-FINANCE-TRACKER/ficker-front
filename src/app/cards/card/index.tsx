"use client";
import { CardInformation } from "@/components/CardInformation";
import { TransactionTab } from "@/components/TransactionTab";
import { request } from "@/service/api";
import { Alert, Col, Pagination, Row } from "antd";
import { useEffect, useState } from "react";
import styles from "../../EnterTransaction/entertransaction.module.scss";
import { CardTransactionModal } from "./mcardtransaction";
import { PayInvoiceModal } from "./payInvoiceModal";
import { ITransaction } from "@/interfaces";
import { CardDetailFilter, type CardDetailFilters } from "./detailFilter";
import { AppliedFiltersBar } from "@/components/AppliedFiltersBar";

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
  archived_at?: string | null;
}

interface CardProps {
  card: Card;
  filters: CardDetailFilters;
  isFilterApplied: boolean;
  searchTerm: string;
  appliedFiltersLabels: string[];
  onClearFilters: () => void;
}

function CardPage({ card, filters, isFilterApplied, searchTerm, appliedFiltersLabels, onClearFilters }: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState<boolean>(false);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [cardTranscations, setCardTransactions] = useState<ITransaction[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [invoicePayDay, setInvoicePayDay] = useState<string | null>(card.invoice_pay_day ?? null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const isArchived = Boolean(card.archived_at);

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
      const params = new URLSearchParams();
      if (filters.category_id) params.set("category_id", String(filters.category_id));
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("page", String(pagination.current));
      params.set("per_page", String(pagination.pageSize));

      if (isFilterApplied) {
        if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
          params.set("date_from", filters.dateFrom);
          params.set("date_to", filters.dateTo);
        } else if (filters.month && filters.year) {
          params.set("month", String(filters.month));
          params.set("year", String(filters.year));
        }
      }
      
      const queryString = params.toString();
      const endpoint = `transaction/card/${card.id}${queryString ? `?${queryString}` : ""}`;

      const response = await request({
        method: "GET",
        endpoint,
      });
      if (response.data.data.transactions.length > 0) {
        setCardTransactions(response.data.data.transactions);
      } else {
        setCardTransactions([]);
      }
      setPagination((current) => ({
        ...current,
        total: Number(response?.data?.meta?.total ?? response?.data?.total ?? 0),
      }));
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
  }, [isModalOpen, isOutputModalOpen, filters, isFilterApplied, searchTerm, pagination.current, pagination.pageSize]);

  useEffect(() => {
    setPagination((current) => ({ ...current, current: 1 }));
  }, [filters, isFilterApplied, searchTerm]);

  return (
    <Col xl={24}>
      <CardTransactionModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        cardId={card.id}
        onSuccess={() => {
          getCardData();
          getCardTotalValue();
        }}
      />
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
        <Col xl={18} lg={16} md={24} xs={24} style={{ paddingLeft: 0 }} className={styles.tableResume}>
          {appliedFiltersLabels.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <AppliedFiltersBar filters={appliedFiltersLabels} onClear={onClearFilters} />
            </div>
          )}
          <TransactionTab
            data={cardTranscations}
            typeId={3}
            editModal={isEditModalOpen}
            setEditModal={setIsEditModalOpen}
          />
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger={false}
            onChange={(page) => setPagination((current) => ({ ...current, current: page }))}
            style={{ marginTop: 24, textAlign: "right" }}
          />
        </Col>
        <Col xl={6} lg={8} md={24} xs={24} className={styles.cardInfo}>
          <div style={{ padding: 0, width: "100%", marginTop: "12px" }}>
            <CardInformation
              card={{ ...card, invoice_pay_day: invoicePayDay }}
              totalValue={totalValue}
              archived={isArchived}
            />
            {isArchived && (
              <Alert
                type="info"
                showIcon
                style={{ marginTop: 16, borderRadius: 12 }}
                message="Cartão arquivado"
                description="Este cartão está fora da lista principal para novas compras. Aqui você ainda pode consultar o histórico e liquidar eventuais faturas em aberto."
              />
            )}
            <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
              {!isArchived && (
                <Col span={12}>
                  <button className={styles.button} onClick={openModal} style={{ width: "100%", marginTop: 0, padding: "8px 0", fontSize: "12px", height: "36px" }}>
                    Nova transação
                  </button>
                </Col>
              )}
              <Col span={isArchived ? 24 : 12}>
                <button className={styles.button} onClick={openOutputModal} style={{ width: "100%", marginTop: 0, padding: "8px 0", fontSize: "12px", height: "36px" }}>
                  Pagar fatura
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


