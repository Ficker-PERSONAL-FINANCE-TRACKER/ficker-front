"use client";
import { Col, Row, Spin, Typography } from "antd";
import Image from "next/image";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { NewCardModal } from "./modal";
import { useEffect, useState } from "react";
import { request } from "@/service/api";
import dayjs from "dayjs";
import CardPage from "./card";
import SearchField from "@/components/SearchField";
import CustomMenu from "@/components/CustomMenu";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/AnimatedNumber";

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
}

const Cards = () => {
  const { Title, Text } = Typography;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card>({} as Card);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const getCards = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "cards",
        loaderStateSetter: setLoading,
      });

      const rawCards = response?.data?.data?.cards ?? [];

      const cardsWithInvoices = await Promise.all(
        rawCards.map(async (card: Card) => {
          try {
            const invoiceResponse = await request({
              method: "GET",
              endpoint: `cards/${card.id}/invoice`,
            });

            return {
              ...card,
              invoice: invoiceResponse?.data?.data?.invoice || 0,
              invoice_pay_day: invoiceResponse?.data?.data?.pay_day || null,
            };
          } catch (error) {
            return {
              ...card,
              invoice: card.invoice || 0,
              invoice_pay_day: null,
            };
          }
        })
      );

      setCards(cardsWithInvoices);
    } catch (error) {
      console.log(error);
    }
  };

  const formatCurrency = (value: any): string => {
    const numValue = parseFloat(value || 0);
    return numValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getFlagColor = (flagId: number) => {
    const colors: { [key: number]: string } = {
      3: "linear-gradient(135deg, #1e1e1e 0%, #3a3a3a 100%)",
      4: "linear-gradient(135deg, #1a1f71 0%, #0056b3 100%)",
      5: "linear-gradient(135deg, #d32f2f 0%, #ff5252 100%)",
      6: "linear-gradient(135deg, #2d3e50 0%, #4c5c6e 100%)",
      7: "linear-gradient(135deg, #00875a 0%, #22a06b 100%)",
      8: "linear-gradient(135deg, #007bc1 0%, #00b0ff 100%)",
      9: "linear-gradient(135deg, #004a97 0%, #0074e4 100%)",
    };
    return colors[flagId] || "linear-gradient(135deg, #6C5DD3 0%, #8E82EF 100%)";
  };

  const getFlagImage = (flagId: number) => {
    const images: { [key: number]: string } = {
      3: "/mastercard.png",
      4: "/visa.png",
      5: "/hipercard.png",
      6: "/elo.png",
      7: "/alelo.png",
      8: "/amex.png",
      9: "/diners.png",
    };
    return images[flagId] || "/mastercard.png";
  };

  const showDate = (date: number) => {
    if (date < dayjs().date()) {
      return dayjs().month() + 2;
    }
    return dayjs().month() + 1;
  };

  const getDisplayedDueDate = (card: Card) => {
    if (card.invoice_pay_day) {
      const payDay = dayjs(card.invoice_pay_day);
      if (payDay.isValid()) {
        return payDay.format("DD/MM");
      }
    }

    return `${String(card.expiration).padStart(2, "0")}/${String(showDate(card.expiration)).padStart(2, "0")}`;
  };

  useEffect(() => {
    getCards();
  }, [isModalOpen]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <CustomMenu />
      <NewCardModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <div style={{ width: "90vw", flex: "1 1 0%", overflowX: "hidden" }}>
        <div className={styles.titleArea}>
          <div>
            <h2>{`Meus cartões ${Object.keys(selectedCard).length > 0 ? "> " + selectedCard.card_description : ""}`}</h2>
          </div>
          <div className={styles.buttonsArea}>
            <SearchField />
            <button className={styles.button} onClick={openModal}>
              Novo Cartão
            </button>
          </div>
        </div>
        {loading ? (
          <Row justify={"center"}>
            <Spin size="large" />
          </Row>
        ) : (
          <Row justify={"start"} style={{ padding: "20px 30px" }}>
            {Object.keys(selectedCard).length > 0 ? (
              <CardPage card={selectedCard} />
            ) : (
              <>
                {cards.map((card) => (
                  <Col
                    key={card.id}
                    style={{ padding: "12px", flex: "0 0 25%", maxWidth: "25%" }}
                    onClick={() => setSelectedCard(card)}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, translateY: -5 }}
                      style={{
                        height: "130px",
                        background: getFlagColor(card.flag_id),
                        borderRadius: 12,
                        padding: "20px",
                        color: "#fff",
                        boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.1)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ position: "absolute", top: "-20%", right: "-20%", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", zIndex: 0 }} />
                      <div style={{ position: "absolute", bottom: "-25%", left: "-25%", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.03)", zIndex: 0 }} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                        <div style={{ width: "75%" }}>
                          <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.card_description}</div>
                          <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.7)", marginBottom: 0 }}>Fatura</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
                            <AnimatedNumber value={card.invoice} duration={1500} format={formatCurrency} />
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Image src={getFlagImage(card.flag_id)} alt="Flag" width={34} height={20} style={{ objectFit: "contain" }} />
                          {card.flag_id === 3 && (
                            <div style={{ fontSize: 7, color: "#fff", marginTop: 1, opacity: 0.9, fontWeight: 500, textTransform: "lowercase" }}>mastercard</div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
                        <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}>
                          **** **** ****
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.7)", textAlign: "right" }}>Vencimento</div>
                          <div style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{getDisplayedDueDate(card)}</div>
                        </div>
                      </div>
                    </motion.div>
                  </Col>
                ))}
              </>
            )}
          </Row>
        )}
      </div>
    </div>
  );
};

export default Cards;
