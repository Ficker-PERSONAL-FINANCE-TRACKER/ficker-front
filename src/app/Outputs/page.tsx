"use client";
import styles from "../EnterTransaction/entertransaction.module.scss";
import { useEffect, useState } from "react";
import { OutputModal } from "./modal";
import { request } from "@/service/api";
import { TransactionTab } from "@/components/TransactionTab";
import SearchField from "@/components/SearchField";
import { ITransaction } from "@/interfaces";
import CustomMenu from "@/components/CustomMenu";

const Outputs = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const getTransactions = async () => {
    try {
      const response = await request({
        method: "GET",
        endpoint: "transaction/type/2",
      });
      setTransactions(response.data.data.transactions);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getTransactions();
  }, [isModalOpen, isEditModalOpen]);

  return (
     <div style={{ display: "flex", flexDirection: "row" }}>
      <CustomMenu />
        <OutputModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
        <div style={{ width: "90vw", flex: "1 1 0%", overflowX: "hidden" }}>
          <div className={styles.titleArea}>
            <div>
              <h2>Saídas</h2>
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
              typeId={2}
              editModal={isEditModalOpen}
              setEditModal={setIsEditModalOpen}
            />
          </div>
        </div>
    </div>
  );
};

export default Outputs;
