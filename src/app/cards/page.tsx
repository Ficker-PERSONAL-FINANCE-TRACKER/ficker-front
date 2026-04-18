"use client";

import {
  Col,
  Dropdown,
  Empty,
  MenuProps,
  Modal,
  Row,
  Spin,
  Typography,
  message,
} from "antd";
import Image from "next/image";
import { NewCardModal } from "./modal";
import { useEffect, useMemo, useState } from "react";
import { request } from "@/service/api";
import dayjs from "dayjs";
import CardPage from "./card";
import SearchField from "@/components/SearchField";
import CustomMenu from "@/components/CustomMenu";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/AnimatedNumber";
import styles from "./cards.module.scss";

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

type CardAction = "archive" | "unarchive" | "delete";

interface ActionModalState {
  open: boolean;
  action: CardAction | null;
  card: Card | null;
}

const Cards = () => {
  const { Text } = Typography;
  const [, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [archivedCards, setArchivedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card>({} as Card);
  const [showArchived, setShowArchived] = useState(false);
  const [actionModal, setActionModal] = useState<ActionModalState>({
    open: false,
    action: null,
    card: null,
  });

  const openModal = () => {
    setIsModalOpen(true);
  };

  const hydrateCards = async (rawCards: Card[]) => {
    return Promise.all(
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
  };

  const getCards = async () => {
    setLoading(true);

    try {
      const [activeResponse, archivedResponse] = await Promise.all([
        request({
          method: "GET",
          endpoint: "cards",
        }),
        request({
          method: "GET",
          endpoint: "cards",
          params: { status: "archived" },
        }),
      ]);

      const rawActiveCards = activeResponse?.data?.data?.cards ?? [];
      const rawArchivedCards = archivedResponse?.data?.data?.cards ?? [];

      const [activeCards, archivedCardsResult] = await Promise.all([
        hydrateCards(rawActiveCards),
        hydrateCards(rawArchivedCards),
      ]);

      setCards(activeCards);
      setArchivedCards(archivedCardsResult);

      if (Object.keys(selectedCard).length > 0) {
        const refreshedSelectedCard = activeCards.find((card) => card.id === selectedCard.id);
        if (refreshedSelectedCard) {
          setSelectedCard(refreshedSelectedCard);
        } else {
          setSelectedCard({} as Card);
        }
      }
    } catch (error) {
      console.log(error);
      messageApi.error("Nao foi possivel carregar os cartoes.");
    } finally {
      setLoading(false);
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

  const closeActionModal = () => {
    setActionModal({ open: false, action: null, card: null });
  };

  const openActionModal = (action: CardAction, card: Card) => {
    setActionModal({ open: true, action, card });
  };

  const actionCopy = useMemo(() => {
    if (!actionModal.action || !actionModal.card) {
      return null;
    }

    const cardName = actionModal.card.card_description;

    if (actionModal.action === "archive") {
      return {
        title: "Arquivar cartao?",
        okText: "Arquivar",
        okType: "default" as const,
        content: (
          <>
            <p>
              O cartao <strong>{cardName}</strong> saira da lista principal e ira para Arquivados.
            </p>
            <ul className={styles.modalList}>
              <li>Compras, faturas e historico continuarao preservados.</li>
              <li>Novas compras no credito ficarao bloqueadas enquanto ele estiver arquivado.</li>
            </ul>
          </>
        ),
      };
    }

    if (actionModal.action === "unarchive") {
      return {
        title: "Restaurar cartao?",
        okText: "Restaurar",
        okType: "default" as const,
        content: (
          <>
            <p>
              O cartao <strong>{cardName}</strong> voltara para a lista principal.
            </p>
            <ul className={styles.modalList}>
              <li>Ele voltara a aparecer entre os cartoes ativos.</li>
              <li>Novas compras no credito serao permitidas novamente.</li>
            </ul>
          </>
        ),
      };
    }

    return {
      title: "Excluir cartao permanentemente?",
      okText: "Excluir permanentemente",
      okType: "primary" as const,
      danger: true,
      content: (
        <>
          <p>
            O cartao <strong>{cardName}</strong> sera removido definitivamente.
          </p>
          <ul className={styles.modalList}>
            <li>Compras, parcelas e vinculos analiticos desse cartao serao removidos.</li>
            <li>Pagamentos de fatura relacionados podem ser recalculados ou excluidos.</li>
          </ul>
        </>
      ),
    };
  }, [actionModal.action, actionModal.card]);

  const handleActionConfirm = async () => {
    if (!actionModal.action || !actionModal.card) {
      return;
    }

    setActionLoading(true);

    try {
      if (actionModal.action === "archive") {
        await request({
          method: "PATCH",
          endpoint: `cards/${actionModal.card.id}/archive`,
        });
        messageApi.success("Cartao arquivado com sucesso.");
      }

      if (actionModal.action === "unarchive") {
        await request({
          method: "PATCH",
          endpoint: `cards/${actionModal.card.id}/unarchive`,
        });
        messageApi.success("Cartao restaurado com sucesso.");
      }

      if (actionModal.action === "delete") {
        await request({
          method: "DELETE",
          endpoint: `cards/${actionModal.card.id}`,
        });
        messageApi.success("Cartao excluido com sucesso.");
      }

      closeActionModal();
      await getCards();
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      messageApi.error(apiMessage || "Nao foi possivel concluir a acao.");
    } finally {
      setActionLoading(false);
    }
  };

  const buildMenuItems = (card: Card): MenuProps["items"] => {
    if (card.archived_at) {
      return [
        {
          key: "unarchive",
          label: "Restaurar cartao",
        },
        {
          key: "delete",
          label: <span className={styles.deleteAction}>Excluir permanentemente</span>,
        },
      ];
    }

    return [
      {
        key: "archive",
        label: "Arquivar cartao",
      },
      {
        key: "delete",
        label: <span className={styles.deleteAction}>Excluir permanentemente</span>,
      },
    ];
  };

  const handleMenuClick = (card: Card, key: string) => {
    if (key === "archive" || key === "unarchive" || key === "delete") {
      openActionModal(key, card);
    }
  };

  const renderCard = (card: Card, archived = false) => {
    const cardNode = (
      <div className={styles.cardWrap}>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: buildMenuItems(card),
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              handleMenuClick(card, key);
            },
          }}
          placement="bottomRight"
        >
          <button
            type="button"
            className={styles.cardActionButton}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <span className={styles.cardActionIcon}>⋯</span>
          </button>
        </Dropdown>

        <motion.div
          whileHover={{ scale: 1.02, translateY: -5 }}
          className={`${styles.cardShell} ${styles.cardInteractive} ${archived ? styles.cardArchived : ""}`}
          style={{ background: getFlagColor(card.flag_id) }}
        >
          <div className={styles.cardCircleTop} />
          <div className={styles.cardCircleBottom} />

          <div className={styles.cardTopRow}>
            <div className={styles.cardInfo}>
              <div className={styles.cardDescription}>{card.card_description}</div>
              <div className={styles.cardLabel}>Fatura</div>
              <div className={styles.cardValue}>
                <AnimatedNumber value={card.invoice} duration={1500} format={formatCurrency} />
              </div>
            </div>
            <div className={styles.flagArea}>
              <Image src={getFlagImage(card.flag_id)} alt="Flag" width={34} height={20} style={{ objectFit: "contain" }} />
              {card.flag_id === 3 && <div className={styles.flagLabel}>mastercard</div>}
            </div>
          </div>

          <div className={styles.cardBottomRow}>
            <div className={styles.cardMask}>**** **** ****</div>
            <div>
              <div className={styles.cardDueLabel}>Vencimento</div>
              <div className={styles.cardDueValue}>{getDisplayedDueDate(card)}</div>
            </div>
          </div>
        </motion.div>
      </div>
    );

    return (
      <Col
        key={card.id}
        className={styles.cardColumn}
        onClick={() => setSelectedCard(card)}
      >
        {cardNode}
      </Col>
    );
  };

  useEffect(() => {
    getCards();
  }, [isModalOpen]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <CustomMenu />
      <NewCardModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      {contextHolder}
      {messageContextHolder}
      <div className={styles.pageShell}>
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
          <>
            <Row justify={"start"} className={styles.gridArea}>
              {Object.keys(selectedCard).length > 0 ? (
                <CardPage card={selectedCard} />
              ) : cards.length > 0 ? (
                cards.map((card) => renderCard(card))
              ) : (
                <Col span={24}>
                  <Empty description="Nenhum cartao ativo encontrado." />
                </Col>
              )}
            </Row>

            {Object.keys(selectedCard).length === 0 && (
              <div className={styles.archivedSection}>
                <button
                  type="button"
                  className={styles.archivedToggle}
                  onClick={() => setShowArchived((current) => !current)}
                >
                  <span className={styles.archivedTitle}>Arquivados</span>
                  <span className={styles.archivedCount}>{archivedCards.length}</span>
                </button>
                <div className={styles.archivedHint}>
                  Cartoes fora da lista principal continuam disponiveis aqui para restauracao ou exclusao definitiva.
                </div>

                {showArchived && (
                  <Row justify={"start"} className={styles.archivedContent}>
                    {archivedCards.length > 0 ? (
                      archivedCards.map((card) => renderCard(card, true))
                    ) : (
                      <Col span={24}>
                        <Text type="secondary">Nenhum cartao arquivado no momento.</Text>
                      </Col>
                    )}
                  </Row>
                )}
              </div>
            )}
          </>
        )}

        <Modal
          open={actionModal.open}
          title={actionCopy?.title}
          okText={actionCopy?.okText}
          okType={actionCopy?.okType}
          okButtonProps={{
            danger: actionModal.action === "delete",
            loading: actionLoading,
          }}
          cancelText="Cancelar"
          onCancel={closeActionModal}
          onOk={handleActionConfirm}
          destroyOnClose
        >
          {actionCopy?.content}
        </Modal>
      </div>
    </div>
  );
};

export default Cards;
