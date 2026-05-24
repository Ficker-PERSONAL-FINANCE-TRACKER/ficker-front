import "./styles.scss";
import { useMemo, useState } from "react";
import { ModalNewCategory } from "../ModalNewCategory";
import { Empty, Button, Spin, Modal } from "antd";

export interface AmountByCategory {
  category_description: string;
  category_spending: number;
}

interface MyCategoriesListProps {
  categories: AmountByCategory[];
  loading?: boolean;
  onRefresh?: () => void;
}

const MyCategoriesList = ({ categories, loading = false, onRefresh }: MyCategoriesListProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const showModal = () => {
    setIsCreateModalOpen(true);
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

  const totalCategoriesSpending = categories.reduce((acc, curr) => acc + curr.category_spending, 0);
  const sortedCategories = useMemo(
    () =>
      [...categories]
        .filter((category) => Number(category.category_spending || 0) > 0)
        .sort((a, b) => Number(b.category_spending || 0) - Number(a.category_spending || 0)),
    [categories]
  );
  const visibleCategories = useMemo(() => sortedCategories.slice(0, 5), [sortedCategories]);
  const renderCategoryRow = (category: AmountByCategory, index: number) => (
    <div className="category-area" key={`${category.category_description}-${index}`}>
      <div className="category-area__infos">
        <span
          style={{
            background: colorPalette[index % colorPalette.length],
          }}
          className="circle"
        ></span>
        <div className="category-area__description" title={category.category_description}>{category.category_description}</div>
      </div>

      <div style={{ flex: 1, height: "6px", background: "#f0f0f5", borderRadius: "3px", overflow: "hidden" }}>
        <div
          style={{
            width: `${(category.category_spending / totalCategoriesSpending) * 100}%`,
            height: "100%",
            background: colorPalette[index % colorPalette.length],
            borderRadius: "3px",
          }}
        />
      </div>

      <div className="category-area__value" title={formatCurrency(category.category_spending)}>
        {formatCurrency(category.category_spending)}
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="title-area">
        <h4>Top categorias de gastos</h4>
        <div className="title-area__actions">
          {sortedCategories.length > 0 && (
            <Button
              type="link"
              onClick={() => setIsListModalOpen(true)}
              style={{
                color: "#6C5DD3",
                fontWeight: 600,
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Ver mais
            </Button>
          )}
          <a className="title-area__button" onClick={showModal}>
            <img src="/icons/icon-more.svg" alt="new_category" />
          </a>
        </div>
      </div>
      <ModalNewCategory
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        onCategoryCreated={onRefresh}
      />
      <div className="categories-area">
        {loading ? (
          <div style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spin />
          </div>
        ) : categories?.length === 0 || !categories?.some((c) => c.category_spending > 0) ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nenhuma categoria adicionada."
            style={{ margin: "20px 0" }}
          >
            <Button type="primary" onClick={showModal}>Adicionar categoria</Button>
          </Empty>
        ) : (
          visibleCategories.map((category, index) => renderCategoryRow(category, index))
        )}
      </div>
      <Modal
        title="Top categorias de gastos"
        open={isListModalOpen && sortedCategories.length > 0}
        onCancel={() => setIsListModalOpen(false)}
        footer={null}
        width={760}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto", padding: "20px" }}
        centered
      >
        <div className="categories-modal-list">
          {sortedCategories.map((category, index) => renderCategoryRow(category, index))}
        </div>
      </Modal>
    </div>
  );
};

export default MyCategoriesList;
