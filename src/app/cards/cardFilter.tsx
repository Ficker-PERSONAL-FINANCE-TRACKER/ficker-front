"use client";

import { useState } from "react";
import { Button, Form, Modal, Select, ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import { request } from "@/service/api";
import { FilterOutlined } from "@ant-design/icons";
import styles from "../EnterTransaction/entertransaction.module.scss";

interface CardFilterProps {
  filters: {
    flag_id?: number;
  };
  onChange: (filters: { flag_id?: number }) => void;
}

export const CardFilter = ({ filters, onChange }: CardFilterProps) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flags, setFlags] = useState<{ id: number; flag_description: string }[]>([]);

  const fetchFlags = async () => {
    try {
      const response = await request({ method: "GET", endpoint: "flags" });
      setFlags(response?.data?.data?.flags ?? []);
    } catch (error) {
      console.error("Error fetching flags", error);
      setFlags([]);
    }
  };

  const openModal = () => {
    fetchFlags();
    form.setFieldsValue({ flag_id: filters.flag_id });
    setIsModalOpen(true);
  };

  const handleApply = async () => {
    const values = await form.validateFields();
    onChange(values);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={openModal}
        className={styles.filterButton}
        icon={<FilterOutlined />}
        style={{
          width: "fit-content",
          height: 40,
          borderRadius: 8,
          background: "#6C5DD3",
          color: "#fff",
          border: "none",
        }}
      >
        Filtrar
      </Button>

      <Modal
        title="Filtrar cartões"
        open={isModalOpen}
        onOk={handleApply}
        onCancel={() => setIsModalOpen(false)}
        okText="Aplicar"
        cancelText="Cancelar"
        centered
      >
        <ConfigProvider locale={ptBR}>
          <Form form={form} layout="vertical">
            <Form.Item name="flag_id" label="Bandeira">
              <Select
                placeholder="Todas as bandeiras"
                allowClear
                style={{ height: 45 }}
                options={flags.map((f) => ({ value: f.id, label: f.flag_description }))}
              />
            </Form.Item>
          </Form>
        </ConfigProvider>
      </Modal>
    </>
  );
};
