"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./recoveryaccount.module.scss";
import Link from "next/link";
import { request } from "@/service/api";
import { Alert } from "antd";

const RecoveryAccount = () => {
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleSubmit = async () => {
    setErrors({});
    setGlobalError("");
    setSuccessMessage("");

    try {
      const response = await request({
        method: "POST",
        endpoint: "forgot-password",
        data: {
          email,
        },
      });

      if (response && response.status === 200) {
        setSuccessMessage("Se o e-mail estiver cadastrado, o link de recuperação foi enviado.");
      }
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error?.response?.data?.message) {
        setGlobalError(error.response.data.message);
      } else {
        setGlobalError("Não foi possível solicitar a recuperação de senha.");
      }
    }
  };

  const allErrors = Object.values(errors).flat();
  const displayErrors = globalError ? [globalError] : allErrors;

  return (
    <div>
      <div style={{ background: "#fff", padding: 10, alignItems: "center" }}>
        <Link href={"/"} style={{ background: "#fff", padding: 10, alignItems: "center" }}>
          <Image src="/logo.png" alt="Logo" width={130} height={27} />
        </Link>
      </div>

      {successMessage && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20, width: "100%" }}>
          <div style={{ width: "100%", maxWidth: 450, padding: "0 20px" }}>
            <Alert
              message="Solicitação enviada"
              description={successMessage}
              type="success"
              showIcon
              closable
              onClose={() => setSuccessMessage("")}
            />
          </div>
        </div>
      )}

      {displayErrors.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20, width: "100%" }}>
          <div style={{ width: "100%", maxWidth: 450, padding: "0 20px" }}>
            <Alert
              message="Ocorreu um erro"
              description={
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: displayErrors.length > 1 ? 20 : 0,
                    listStyle: displayErrors.length > 1 ? "disc" : "none",
                  }}
                >
                  {displayErrors.map((err, idx) => (
                    <li key={idx} style={{ color: "#cf1322" }}>
                      {err}
                    </li>
                  ))}
                </ul>
              }
              type="error"
              showIcon
              closable
              onClose={() => {
                setErrors({});
                setGlobalError("");
              }}
            />
          </div>
        </div>
      )}

      <div className={styles.container}>
        <form
          className={styles.content}
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: 50, fontSize: 22 }}>
            Esqueceu sua senha?
          </h2>

          <label className={styles.label} style={{ marginBottom: 5 }} htmlFor="email">
            E-mail
          </label>

          <input
            className={styles.input}
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((prev) => ({ ...prev, email: [] }));
              setGlobalError("");
              setSuccessMessage("");
            }}
          />

          {errors.email && errors.email.length > 0 && (
            <div style={{ color: "#ee4848", fontSize: "12px", marginTop: "8px", marginBottom: "15px" }}>
              {errors.email.map((err, idx) => (
                <span key={idx} style={{ display: "block" }}>
                  {err}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button className={styles.button} type="submit">
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecoveryAccount;
