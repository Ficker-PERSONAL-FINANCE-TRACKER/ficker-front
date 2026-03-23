"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Alert } from "antd";
import { request } from "@/service/api";
import styles from "../../recoveryaccount/recoveryaccount.module.scss";

type PageProps = {
  params: {
    token: string;
  };
};

const PasswordResetPage = ({ params }: PageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = params.token;
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrors({});
    setGlobalError("");
    setSuccessMessage("");

    try {
      setLoading(true);

      const response = await request({
        method: "POST",
        endpoint: "reset-password",
        data: {
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        },
      });

      if (response?.status === 200) {
        setSuccessMessage("Senha redefinida com sucesso.");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error?.response?.data?.message) {
        setGlobalError(error.response.data.message);
      } else {
        setGlobalError("Não foi possível redefinir a senha.");
      }
    } finally {
      setLoading(false);
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
              message="Sucesso"
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
          <h2 style={{ textAlign: "center", marginBottom: 30, fontSize: 22 }}>
            Redefinir senha
          </h2>

          <label className={styles.label} style={{ marginBottom: 5 }}>
            E-mail
          </label>
          <input className={styles.input} type="email" value={email} disabled />

          <label className={styles.label} style={{ marginTop: 15, marginBottom: 5 }} htmlFor="password">
            Nova senha
          </label>
          <input
            className={styles.input}
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((prev) => ({ ...prev, password: [] }));
              setGlobalError("");
            }}
          />

          <label
            className={styles.label}
            style={{ marginTop: 15, marginBottom: 5 }}
            htmlFor="password_confirmation"
          >
            Confirmar nova senha
          </label>
          <input
            className={styles.input}
            id="password_confirmation"
            type="password"
            required
            value={passwordConfirmation}
            onChange={(event) => {
              setPasswordConfirmation(event.target.value);
              setErrors((prev) => ({ ...prev, password_confirmation: [] }));
              setGlobalError("");
            }}
          />

          <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetPage;