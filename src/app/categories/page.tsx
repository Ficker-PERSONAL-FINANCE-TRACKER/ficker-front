"use client";
import React, { useEffect, useState } from "react";
import { Row, Col, Progress, Button, Modal, Form, InputNumber, message, Space, Card, Empty, Spin, Checkbox } from "antd";
import CustomMenu from "@/components/CustomMenu";
import { request } from "@/service/api";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { 
  EditOutlined, 
  PlusOutlined,
  DollarOutlined,
  RocketOutlined,
  WalletOutlined,
  StarOutlined,
  RestOutlined,
  HomeOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  CoffeeOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  ShoppingOutlined,
  TagsOutlined
} from "@ant-design/icons";
import styles from "./categories.module.scss";

interface Category {
  id: number;
  category_description: string;
  category_spending: number;
  category_limit?: number;
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const getCategoryIcon = (description: string) => {
    const desc = description?.toLowerCase() || "";
    if (desc.includes("salário")) return { icon: <DollarOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (desc.includes("freelance")) return { icon: <RocketOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (desc.includes("investimentos")) return { icon: <WalletOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (desc.includes("renda extra")) return { icon: <StarOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (desc.includes("alimentação")) return { icon: <RestOutlined />, color: "#FFA940", bg: "#FFF7E6" };
    if (desc.includes("casa")) return { icon: <HomeOutlined />, color: "#00B0FF", bg: "#E6F7FF" };
    if (desc.includes("transporte")) return { icon: <CarOutlined />, color: "#6C5DD3", bg: "#F0EFFF" };
    if (desc.includes("saúde")) return { icon: <MedicineBoxOutlined />, color: "#00875A", bg: "#E6F7EF" };
    if (desc.includes("lazer")) return { icon: <CoffeeOutlined />, color: "#FF754C", bg: "#FFEBE6" };
    if (desc.includes("contas")) return { icon: <ThunderboltOutlined />, color: "#FFD700", bg: "#FFFBE6" };
    if (desc.includes("internet")) return { icon: <WifiOutlined />, color: "#8E82EF", bg: "#F5F3FF" };
    if (desc.includes("compras")) return { icon: <ShoppingOutlined />, color: "#FF4D4F", bg: "#FFF1F0" };
    return { icon: <TagsOutlined />, color: "#808191", bg: "#F8FAFC" };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await request({
        method: "GET",
        endpoint: "categories",
      });
      
      const allCategories = data.data.categories as Category[];
      const expenseCategories = allCategories.filter(cat => {
        const desc = cat.category_description.toLowerCase();
        return !desc.includes("salário") && 
               !desc.includes("freelance") && 
               !desc.includes("investimentos") && 
               !desc.includes("renda extra");
      });

      setCategories(expenseCategories);
    } catch (error) {
      message.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dayjs.locale("pt-br");
    fetchData();
  }, []);

  const handleEditLimit = (category: Category) => {
    setSelectedCategory(category);
    form.setFieldsValue({ 
      category_limit: category.category_limit || 0,
      keep_future: true 
    });
    setIsModalOpen(true);
  };

  const handleSaveLimit = async () => {
    try {
      const values = await form.validateFields();
      
      message.success(`Meta para ${selectedCategory?.category_description} atualizada para ${dayjs().format("MMMM")}!`);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error("Erro ao salvar meta");
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "#FF4D4F";
    if (percent >= 70) return "#FFA940";
    return "#52C41A";
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh", background: "#F8FAFC" }}>
      <CustomMenu />
      <div style={{ flex: 1 }}>
        <div style={{ padding: "10px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Meta de Gastos</h3>
          </div>
        </div>
        
        <div style={{ padding: "0 30px 30px 30px" }}>
          <p style={{ color: "#808191", marginBottom: 20, fontSize: 13 }}>
            Gerencie suas metas de gastos para <strong>{dayjs().format("MMMM [de] YYYY")}</strong>
          </p>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 100 }}><Spin size="large" /></div>
          ) : categories.length === 0 ? (
            <Empty description="Nenhuma categoria encontrada" />
          ) : (
            <Row gutter={[24, 24]}>
              {categories.map((category) => {
                const { icon, color, bg } = getCategoryIcon(category.category_description);
                const limit = category.category_limit || 1000;
                const spending = category.category_spending || 0;
                const percent = Math.min(Math.round((spending / limit) * 100), 100);

                return (
                  <Col xs={24} sm={12} xl={8} key={category.id}>
                    <Card 
                      className={styles.categoryCard}
                      bordered={false}
                      bodyStyle={{ padding: 24 }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <div style={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 12, 
                            background: bg, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            fontSize: 24,
                            color: color
                          }}>
                            {icon}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{category.category_description}</h3>
                            <span style={{ fontSize: 12, color: "#808191" }}>Meta: {formatCurrency(limit)}</span>
                          </div>
                        </div>
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => handleEditLimit(category)}
                          style={{ color: "#808191" }}
                        />
                      </div>

                      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#808191" }}>Gasto Real</span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(spending)}</span>
                      </div>

                      <Progress 
                        percent={percent} 
                        strokeColor={getProgressColor(percent)}
                        trailColor="#F0F0F5"
                        showInfo={false}
                        strokeWidth={8}
                      />

                      <div style={{ marginTop: 8, textAlign: "right", fontSize: 12, color: "#808191" }}>
                        {percent}% consumido
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>

        <Modal
          title={`Definir Meta para ${selectedCategory?.category_description}`}
          open={isModalOpen}
          onOk={handleSaveLimit}
          onCancel={() => setIsModalOpen(false)}
          okText="Salvar Meta"
          cancelText="Cancelar"
          centered
          okButtonProps={{ style: { background: "#6C5DD3" } }}
        >
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#808191", fontSize: 13 }}>
              Defina o valor máximo que você planeja gastar com <strong>{selectedCategory?.category_description}</strong> em {dayjs().format("MMMM")}.
            </p>
          </div>
          <Form form={form} layout="vertical">
            <Form.Item 
              name="category_limit" 
              label="Valor da Meta para este mês"
              rules={[{ required: true, message: "Por favor, insira um valor" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={value => value!.replace(/R\$\s?|(\.*)/g, "").replace(",", ".")}
                placeholder="R$ 0,00"
              />
            </Form.Item>
            
            <Form.Item name="keep_future" valuePropName="checked">
              <Checkbox>Manter esta mesma meta para os próximos meses</Checkbox>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default CategoriesPage;
