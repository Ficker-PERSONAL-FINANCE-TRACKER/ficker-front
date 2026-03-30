"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "./entertransaction.module.scss";
import CustomMenu from "@/components/CustomMenu";
import { useEffect, useState } from "react";
import { EnterTransactionModal } from "./modal";
import { request } from "@/service/api";
import { TransactionTab } from "@/components/TransactionTab";
import SearchField from "@/components/SearchField";
import { ITransaction } from "@/interfaces";

const EnterTransaction = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const getTransactions = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "transaction/type/1",
      });
      setTransactions(response.data.data.transactions);
    } catch (error) {
      console.log(error);
    }
  };
  const showModal = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    getTransactions();
  }, [isModalOpen, isEditModalOpen]);

  return (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <CustomMenu />
        <EnterTransactionModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
        <div style={{ width: "90vw", flex: "1 1 0%", overflowX: "hidden" }}>
          <div className={styles.titleArea}>
            <div>
              <h2>Entradas</h2>
            </div>
            <div className={styles.buttonsArea}>
              <SearchField />
              <button className={styles.button} onClick={showModal}>
                Nova Transação
              </button>
            </div>
          </div>
          <div style={{ padding: "0 30px" }}>
            <TransactionTab
              data={transactions}
              typeId={1}
              editModal={isEditModalOpen}
              setEditModal={setIsEditModalOpen}
            />
          </div>
        </div>
      </div>
  );
};

export default EnterTransaction;