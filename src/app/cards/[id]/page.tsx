"use client";

import { useEffect, useState } from "react";
import { Row, Spin, message } from "antd";
import { request } from "@/service/api";
import CardPage from "../card";
import { CardDetailFilter, type CardDetailFilters } from "../card/detailFilter";
import CustomMenu from "@/components/CustomMenu";
import styles from "../cards.module.scss";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import dayjs from "dayjs";

interface Card {
  best_day: number;
  created_at: Date;
  card_description: string;
  expiration: number;
  flag_id: number;
  id: number;
  updated_at: Date;
  user_id: number;
  invoice: number;
  invoice_pay_day?: string | null;
  archived_at?: string | null;
}

export default function CardDetailsPage({ params }: { params: { id: string } }) {
  const now = new Date();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const router = useRouter();

  const [filters, setFilters] = useState<CardDetailFilters>({
    mode: "month",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    dateFrom: null,
    dateTo: null,
  });

  const appliedFiltersLabels = useMemo(() => {
    const labels: string[] = [];

    if (filters.mode === "custom" && filters.dateFrom && filters.dateTo) {
      labels.push(`Período: ${dayjs(filters.dateFrom).format("DD/MM/YYYY")} - ${dayjs(filters.dateTo).format("DD/MM/YYYY")}`);
    } else if (isFilterApplied && filters.month && filters.year) {
      const monthName = dayjs().month(filters.month - 1).format("MMMM");
      labels.push(`Mês: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`);
      labels.push(`Ano: ${filters.year}`);
    }

    if (filters.category_id && filters.category_name) {
      labels.push(`Categoria: ${filters.category_name}`);
    }

    return labels;
  }, [filters, isFilterApplied]);

  const handleFilterChange = (nextFilters: CardDetailFilters) => {
    setFilters(nextFilters);
    setIsFilterApplied(true);
  };

  const handleClearFilters = () => {
    setFilters({
      mode: "month",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      dateFrom: null,
      dateTo: null,
    });
    setIsFilterApplied(false);
  };

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const response = await request({
          method: "GET",
          endpoint: "cards",
        });
        const activeCards = response?.data?.data?.cards || [];
        
        let found = activeCards.find((c: Card) => c.id === Number(params.id));
        
        if (!found) {
          const archivedResponse = await request({
            method: "GET",
            endpoint: "cards",
            params: { status: "archived" },
          });
          const archivedCards = archivedResponse?.data?.data?.cards || [];
          found = archivedCards.find((c: Card) => c.id === Number(params.id));
        }

        if (found) {
          setCard(found);
        } else {
          message.error("Cartão não encontrado.");
          router.push("/cards");
        }
      } catch (error) {
        message.error("Erro ao carregar cartão.");
        router.push("/cards");
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [params.id, router]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <CustomMenu />
      <div className={styles.pageShell}>
        <div className={styles.titleArea}>
          <div className={styles.gridTitle}>
            <h2>
              {card ? (
                <>
                  <span
                    style={{ cursor: "pointer", color: "#808191", transition: "0.2s" }}
                    onClick={() => router.push("/cards")}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#6C5DD3")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#808191")}
                  >
                    Meus cartões
                  </span>
                  {` > ${card.card_description}`}
                </>
              ) : (
                <span
                  style={{ cursor: "pointer", color: "#808191", transition: "0.2s" }}
                  onClick={() => router.push("/cards")}
                >
                  Meus cartões
                </span>
              )}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CardDetailFilter filters={filters} onChange={handleFilterChange} />
            </div>
          </div>
        </div>
        {loading ? (
          <Row justify="center">
            <Spin size="large" />
          </Row>
        ) : (
          <Row justify={"start"} className={styles.gridArea}>
            {card && (
              <CardPage
                card={card}
                filters={filters}
                isFilterApplied={isFilterApplied}
                appliedFiltersLabels={appliedFiltersLabels}
                onClearFilters={handleClearFilters}
              />
            )}
          </Row>
        )}
      </div>
    </div>
  );
}
