import "./styles.scss";
import { useEffect, useState } from "react";
import { request } from "@/service/api";
import { ModalNewCategory } from "../ModalNewCategory";
import { Empty, Button } from "antd";

interface AmountByCategory {
  category_description: string;
  category_spending: number;
}

const MyCategoriesList = () => {
  const [categories, setCategories] = useState<AmountByCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getCategories = async () => {
    try {
      const { data } = await request({
        method: "GET",
        endpoint: "categories",
      });
      setCategories(data.data.categories);
    } catch (error) {
      console.log(error);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const formatCurrency = (value: any) => {
    if (value) {
      const formattedValue = parseFloat(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      return formattedValue;
    }
    return "R$ 0,00";
  };

  const colorPalette = [
    "#5B48D4",
    "#D47E72",
    "#B168D4",
    "#D4C148",
    "#53D495",
    "#3A2E87",
    "#D49A72",
    "#51D448",
    "#3A8735",
  ];

  useEffect(() => {
    getCategories();
  }, [isModalOpen]);

  const totalCategoriesSpending = categories.reduce((acc, curr) => acc + curr.category_spending, 0);

  return (
    <div className="card">
      <div className="title-area" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#11142D', margin: 0 }}>Gastos por Categoria</h4>
        <a className="title-area__button" onClick={showModal}>
          <img src="/icons/icon-more.svg" alt="new_category" />
        </a>
      </div>
      <ModalNewCategory isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <div className="categories-area">
        {categories?.length === 0 || !categories?.some((c) => c.category_spending > 0) ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nenhuma categoria adicionada."
            style={{ margin: "20px 0" }}
          >
            <Button type="primary" onClick={showModal}>Adicionar Categoria</Button>
          </Empty>
        ) : (
          categories?.map((category, index) =>
            category.category_spending === 0 ? null : (
              <div className="category-area" key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div className="category-area__infos" style={{ minWidth: '100px', flexShrink: 0 }}>
                  <span
                    style={{
                      background: colorPalette[index % colorPalette.length],
                    }}
                    className="circle"
                  ></span>
                  <div className="category-area__description" style={{ fontWeight: 500, fontSize: '14px', color: '#11142D', whiteSpace: 'nowrap' }}>{category.category_description}</div>
                </div>
                
                <div style={{ flex: 1, height: '6px', background: '#f0f0f5', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(category.category_spending / totalCategoriesSpending) * 100}%`, 
                      height: '100%', 
                      background: colorPalette[index % colorPalette.length],
                      borderRadius: '3px'
                    }} />
                </div>

                <div className="category-area__value" style={{ fontWeight: 600, fontSize: '14px', color: '#11142D', minWidth: '80px', textAlign: 'right' }}>{formatCurrency(category.category_spending)}</div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
};

export default MyCategoriesList;
