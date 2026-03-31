"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { request } from "@/service/api";

interface PayInvoiceModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  cardId: number;
  cardDescription: string;
  onSuccess?: () => void;
}

interface InvoiceItem {
  pay_day: string;
  closure_date: string;
  total: number;
  paid_total: number;
  open_total: number;
  is_paid: boolean;
  installments_count: number;
  paid_at: string | null;
  status?: string;
  payment_count?: number;
}

interface PaymentMethod {
  id: number;
  description: string;
}

interface CategoryOption {
  id: number;
  category_description: string;
}

export const PayInvoiceModal = ({
  isModalOpen,
  setIsModalOpen,
  cardId,
  cardDescription,
  onSuccess,
}: PayInvoiceModalProps) => {
  const [form] = Form.useForm();
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [paying, setPaying] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedPayDay, setSelectedPayDay] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCancel = () => {
    setIsModalOpen(false);
    setInvoices([]);
    setPaymentMethods([]);
    setCategories([]);
    setSelectedPayDay(null);
    setErrorMessage("");
    form.resetFields();
  };

  const formatCurrency = (value: number) => {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const isInvoiceClosed = (invoice: InvoiceItem) => {
    return !dayjs().startOf("day").isBefore(dayjs(invoice.closure_date).startOf("day"));
  };

  const canPayInvoice = (invoice: InvoiceItem) => {
    return !invoice.is_paid && Number(invoice.open_total) > 0 && isInvoiceClosed(invoice);
  };

  const getInvoices = async () => {
    try {
      setLoadingInvoices(true);
      setErrorMessage("");

      const response = await request({
        method: "GET",
        endpoint: `cards/${cardId}/invoices`,
      });

      setInvoices(response?.data?.data?.invoices ?? []);
    } catch (error: any) {
      if (error?.response?.data?.data?.message) {
        setErrorMessage(error.response.data.data.message);
      } else if (error?.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Nao foi possivel carregar as faturas do cartao.");
      }
    } finally {
      setLoadingInvoices(false);
    }
  };

  const getPaymentMethods = async () => {
    try {
      setLoadingMethods(true);

      const response = await request({
        method: "GET",
        endpoint: "payment/methods",
      });

      const methods = response?.data?.data?.payment_methods ?? [];
      const filteredMethods = methods.filter((method: PaymentMethod) => method.id !== 4);

      setPaymentMethods(filteredMethods);
    } catch (error: any) {
      setErrorMessage("Nao foi possivel carregar os metodos de pagamento.");
    } finally {
      setLoadingMethods(false);
    }
  };

  const getCategories = async () => {
    try {
      setLoadingCategories(true);

      const response = await request({
        method: "GET",
        endpoint: "categories/type/2",
      });

      const payload = response?.data;
      if (Array.isArray(payload)) {
        setCategories(payload);
      } else if (Array.isArray(payload?.data?.categories)) {
        setCategories(payload.data.categories);
      } else if (Array.isArray(payload?.categories)) {
        setCategories(payload.categories);
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      setErrorMessage("Nao foi possivel carregar as categorias.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const handlePayInvoice = async () => {
    try {
      setPaying(true);
      setErrorMessage("");

      const values = await form.validateFields();

      if (!selectedPayDay) {
        setErrorMessage("Selecione uma fatura para pagamento.");
        return;
      }

      await request({
        method: "POST",
        endpoint: `cards/${cardId}/invoices/${selectedPayDay}/pay`,
        data: {
          payment_method_id: values.payment_method_id,
          category_id: values.category_id === "default" ? null : values.category_id,
          amount_paid: Number(values.amount_paid),
        },
      });

      message.success("Pagamento registrado com sucesso!");
      handleCancel();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }

      if (error?.response?.data?.errors?.payment_method_id?.length) {
        setErrorMessage(error.response.data.errors.payment_method_id[0]);
      } else if (error?.response?.data?.errors?.category_id?.length) {
        setErrorMessage(error.response.data.errors.category_id[0]);
      } else if (error?.response?.data?.errors?.amount_paid?.length) {
        setErrorMessage(error.response.data.errors.amount_paid[0]);
      } else if (error?.response?.data?.data?.message) {
        setErrorMessage(error.response.data.data.message);
      } else if (error?.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Nao foi possivel pagar a fatura.");
      }
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      getInvoices();
      getPaymentMethods();
      getCategories();
      form.setFieldsValue({
        category_id: "default",
      });
    }
  }, [isModalOpen, form]);

  useEffect(() => {
    if (!invoices.length) {
      setSelectedPayDay(null);
      form.setFieldValue("amount_paid", undefined);
      return;
    }

    const firstPayableInvoice = invoices.find((invoice) => canPayInvoice(invoice));
    setSelectedPayDay(firstPayableInvoice ? firstPayableInvoice.pay_day : null);
  }, [invoices, form]);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.pay_day === selectedPayDay) ?? null,
    [invoices, selectedPayDay]
  );

  useEffect(() => {
    if (selectedInvoice && canPayInvoice(selectedInvoice)) {
      form.setFieldValue("amount_paid", Number(selectedInvoice.open_total));
      return;
    }

    form.setFieldValue("amount_paid", undefined);
  }, [selectedInvoice, form]);

  const hasAnyPayableInvoice = invoices.some((invoice) => canPayInvoice(invoice));

  const renderStatus = (invoice: InvoiceItem) => {
    if (invoice.is_paid || Number(invoice.open_total) <= 0) {
      return <Tag color="green">Paga</Tag>;
    }

    if (!isInvoiceClosed(invoice)) {
      return <Tag color="gold">Aguardando fechamento</Tag>;
    }

    if (Number(invoice.paid_total) > 0) {
      return <Tag color="blue">Parcialmente paga</Tag>;
    }

    return <Tag color="cyan">Disponivel para pagamento</Tag>;
  };

  return (
    <Modal
      title={`Pagar fatura - ${cardDescription}`}
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
      width={980}
      style={{ maxWidth: "calc(100vw - 32px)" }}
    >
      {loadingInvoices || loadingMethods || loadingCategories ? (
        <Row justify="center" style={{ padding: "20px 0" }}>
          <Spin size="large" />
        </Row>
      ) : (
        <>
          {errorMessage && (
            <Alert
              type="error"
              message="Ocorreu um erro"
              description={errorMessage}
              showIcon
              closable
              style={{ marginBottom: 16 }}
              onClose={() => setErrorMessage("")}
            />
          )}

          <Col style={{ marginBottom: 16 }}>
            <p style={{ marginBottom: 0 }}>
              <strong>Cartao:</strong> {cardDescription}
            </p>
          </Col>

          <div style={{ overflowX: "auto", width: "100%", marginBottom: 20 }}>
            <Table
              rowKey="pay_day"
              pagination={false}
              dataSource={invoices}
              locale={{ emptyText: "Nenhuma fatura encontrada." }}
              scroll={{ x: 980 }}
              columns={[
                {
                  title: "",
                  width: 60,
                  render: (_, record: InvoiceItem) => (
                    <Radio
                      checked={selectedPayDay === record.pay_day}
                      disabled={!canPayInvoice(record)}
                      onChange={() => setSelectedPayDay(record.pay_day)}
                    />
                  ),
                },
                {
                  title: "Vencimento",
                  dataIndex: "pay_day",
                  render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
                },
                {
                  title: "Fechamento",
                  dataIndex: "closure_date",
                  render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
                },
                {
                  title: "Total",
                  dataIndex: "total",
                  render: (value: number) => formatCurrency(value),
                },
                {
                  title: "Pago",
                  dataIndex: "paid_total",
                  render: (value: number) => formatCurrency(value),
                },
                {
                  title: "Em aberto",
                  dataIndex: "open_total",
                  render: (value: number) => formatCurrency(value),
                },
                {
                  title: "Parcelas",
                  dataIndex: "installments_count",
                },
                {
                  title: "Status",
                  render: (_, record: InvoiceItem) => renderStatus(record),
                },
                {
                  title: "Pago em",
                  render: (_, record: InvoiceItem) =>
                    record.paid_at ? dayjs(record.paid_at).format("DD/MM/YYYY HH:mm") : "-",
                },
              ]}
            />
          </div>

          {!hasAnyPayableInvoice && !errorMessage && (
            <Alert
              type="info"
              message="Nao ha faturas fechadas e em aberto disponiveis para pagamento."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Metodo de pagamento"
                  name="payment_method_id"
                  rules={[{ required: true, message: "Selecione o metodo de pagamento." }]}
                >
                  <Select
                    placeholder="Selecione"
                    disabled={!hasAnyPayableInvoice}
                    options={paymentMethods.map((method) => ({
                      value: method.id,
                      label: method.description,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Categoria"
                  name="category_id"
                  rules={[{ required: true, message: "Selecione a categoria." }]}
                >
                  <Select
                    placeholder="Selecione"
                    disabled={!hasAnyPayableInvoice}
                    options={[
                      { value: "default", label: "Pagamento de fatura" },
                      ...categories.map((category) => ({
                        value: category.id,
                        label: category.category_description,
                      })),
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Valor a pagar"
              name="amount_paid"
              rules={[
                { required: true, message: "Informe o valor do pagamento." },
                {
                  validator: (_, value) => {
                    if (!selectedInvoice || value === undefined || value === null || value === "") {
                      return Promise.resolve();
                    }

                    const amount = Number(value);
                    const openTotal = Number(selectedInvoice.open_total || 0);

                    if (Number.isNaN(amount) || amount <= 0) {
                      return Promise.reject(new Error("Informe um valor maior que zero."));
                    }

                    if (amount > openTotal) {
                      return Promise.reject(new Error("O valor nao pode ser maior que o saldo em aberto da fatura."));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0.01}
                max={selectedInvoice ? Number(selectedInvoice.open_total) : undefined}
                precision={2}
                disabled={!selectedInvoice || !canPayInvoice(selectedInvoice)}
                formatter={(value) => {
                  if (value === undefined || value === null) {
                    return "";
                  }

                  const numericValue = Number(String(value).replace(/\./g, "").replace(/,/g, "."));
                  if (Number.isNaN(numericValue)) {
                    return "";
                  }

                  return numericValue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  });
                }}
                parser={(value) => {
                  if (!value) {
                    return 0;
                  }

                  const normalized = value
                    .replace(/R\$\s?/g, "")
                    .replace(/\./g, "")
                    .replace(/,/g, ".");

                  return Number(normalized);
                }}
                placeholder="Informe o valor"
              />
            </Form.Item>
          </Form>

          {selectedInvoice && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Fatura selecionada: ${dayjs(selectedInvoice.pay_day).format("DD/MM/YYYY")}`}
              description={[
                `Total da fatura: ${formatCurrency(selectedInvoice.total)}`,
                `Pago ate agora: ${formatCurrency(selectedInvoice.paid_total)}`,
                `Valor em aberto: ${formatCurrency(selectedInvoice.open_total)}`,
              ].join(" | ")}
            />
          )}

          <Row justify="end" gutter={12}>
            <Col>
              <Button onClick={handleCancel}>Cancelar</Button>
            </Col>
            <Col>
              <Button
                type="primary"
                onClick={handlePayInvoice}
                loading={paying}
                disabled={!selectedInvoice || !canPayInvoice(selectedInvoice)}
              >
                Confirmar pagamento
              </Button>
            </Col>
          </Row>
        </>
      )}
    </Modal>
  );
};


