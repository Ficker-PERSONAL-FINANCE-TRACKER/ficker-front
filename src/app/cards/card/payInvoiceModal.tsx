"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Radio,
  Row,
  Spin,
  Table,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { request } from "@/service/api";
import { currencyFormatter, currencyParser } from "@/utils/currencyFormatter";

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

export const PayInvoiceModal = ({
  isModalOpen,
  setIsModalOpen,
  cardId,
  cardDescription,
  onSuccess,
}: PayInvoiceModalProps) => {
  const [form] = Form.useForm();
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [paying, setPaying] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedPayDay, setSelectedPayDay] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCancel = () => {
    setIsModalOpen(false);
    setInvoices([]);
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
        setErrorMessage("Não foi possível carregar as faturas do cartão.");
      }
    } finally {
      setLoadingInvoices(false);
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
          amount_paid: Number(values.amount_paid),
          date: values.date.format("YYYY-MM-DD"),
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

      if (error?.response?.data?.errors?.amount_paid?.length) {
        setErrorMessage(error.response.data.errors.amount_paid[0]);
      } else if (error?.response?.data?.data?.message) {
        setErrorMessage(error.response.data.data.message);
      } else if (error?.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Não foi possível pagar a fatura.");
      }
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      getInvoices();
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
      form.setFieldValue("date", dayjs());
      return;
    }

    form.setFieldValue("amount_paid", undefined);
    form.setFieldValue("date", undefined);
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

    return <Tag color="cyan">Disponível para pagamento</Tag>;
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
      {loadingInvoices ? (
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
              <strong>Cartão:</strong> {cardDescription}
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
              message="Não há faturas fechadas e em aberto disponíveis para pagamento."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form form={form} layout="vertical">
            <Form.Item
              label="Data do pagamento"
              name="date"
              rules={[{ required: true, message: "Informe a data do pagamento." }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                disabled={!selectedInvoice || !canPayInvoice(selectedInvoice)}
                disabledDate={(current) => {
                  if (!current || !selectedInvoice) return false;

                  const currentDay = current.startOf("day");
                  const closureDate = dayjs(selectedInvoice.closure_date).startOf("day");
                  const today = dayjs().startOf("day");

                  return currentDay.isBefore(closureDate) || currentDay.isAfter(today);
                }}
              />
            </Form.Item>

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
                      return Promise.reject(new Error("O valor não pode ser maior que o saldo em aberto da fatura."));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber<number>
                style={{ width: "100%" }}
                min={0.01}
                max={selectedInvoice ? Number(selectedInvoice.open_total) : undefined}
                precision={2}
                disabled={!selectedInvoice || !canPayInvoice(selectedInvoice)}
                decimalSeparator=","
                formatter={currencyFormatter}
                parser={currencyParser}
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
