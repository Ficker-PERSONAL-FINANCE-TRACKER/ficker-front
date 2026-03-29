"use client";
import { Col, Row, Spin, Typography } from "antd";
import Image from "next/image";
import Link from "next/link";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { NewCardModal } from "./modal";
import { useEffect, useState } from "react";
import { request } from "@/service/api";
import dayjs from "dayjs";
import CardPage from "./card";
import SearchField from "@/components/SearchField";
import CustomMenu from "@/components/CustomMenu";



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
      setCards(response.data.data.cards);
    } catch (error) {
      console.log(error);
    }
  };

  const showDate = (date: number) => {
    if (date < dayjs().date()) {
      return dayjs().month() + 2;
    }
    return dayjs().month() + 1;
  };

  useEffect(() => {
    getCards();
  }, [isModalOpen]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
        <CustomMenu />
        <NewCardModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
        <div style={{ width: "90vw" }}>
          <div className={styles.titleArea}>
            <div>
              <h3>{`Meus cartões ${Object.keys(selectedCard).length > 0 ? "> " + selectedCard.card_description : ""
                }`}</h3>
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
            <Row justify={"start"}>
              {Object.keys(selectedCard).length > 0 ? (
                <CardPage card={selectedCard} />
              ) : (
                <>
                  {cards.map((card) => (
                    <Col
                      key={card.id}
                      style={{
                        padding: 20,
                        background: "#fff",
                        borderRadius: 8,
                        margin: 20,
                        boxShadow: "0px 1px 2px 2px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                      }}
                      lg={6}
                      xs={20}
                      onClick={() => setSelectedCard(card)}
                    >
                      <div>
                        <Row align={"middle"} style={{ marginBottom: 15 }}>
                          {card.flag_id === 1 ? (
                            <Image src={"/mastercard.png"} alt="Logo" width={39} height={30} />
                          ) : (
                            <Image src={"/visa.png"} alt="Logo" width={39} height={12} />
                          )}
                          <Text type="secondary" style={{ marginLeft: 10 }}>
                            {card.card_description}
                          </Text>
                        </Row>
                        <Col>
                          <Text type="secondary">Próxima fatura:</Text>
                          <Title level={4}>R$ {card.invoice}</Title>
                        </Col>
                        <Row justify={"end"}>
                          <Col>
                            <Col>
                              <Text type="secondary">Vencimento:</Text>
                            </Col>
                            <Row justify={"end"}>
                              <Col>
                                <Text type="secondary">
                                  {String(card.expiration).padStart(2, '0')}/
                                  {String(showDate(card.expiration)).padStart(2, '0')}
                                </Text>
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                      </div>
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
