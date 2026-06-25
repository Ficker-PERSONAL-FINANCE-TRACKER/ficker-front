"use client";
import Image from "next/image";
import styles from "./createaccount.module.scss";
import Link from "next/link";
import { useState } from "react";
import { getApiErrorMessage, request } from "@/service/api";
import { AxiosError } from "axios";
import { message as msg, Alert } from "antd";

const CreateAccountPage = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async () => {
    setErrors({});
    if (password !== confirmPassword) {
      return setErrors({ password_confirmation: ["As senhas precisam ser iguais"] });
    }
    if (!termsAccepted) {
      return setErrors({ terms: ["Você deve aceitar os termos de uso."] });
    }
    try {
      await request({
        method: "POST",
        endpoint: "register",
        data: {
          name: name,
          email: email,
          password: password,
          password_confirmation: confirmPassword,
          terms_accepted_at: new Date().toISOString(),
        },
      });
      msg.success("Cadastro realizado com sucesso! Faça login para continuar.");
      return (window.location.href = "/login");
    } catch (error) {
      if (error instanceof AxiosError) {
        const apiErrors = error.response?.data?.errors;
        setErrors(apiErrors || { general: [getApiErrorMessage(error)] });
      } else {
        msg.error("Ops! Algo deu errado ao tentar se cadastrar.");
      }
    }
  };

  const getErrorStyle = (fieldName: string) => {
    return errors[fieldName] && errors[fieldName].length > 0
      ? {
        borderColor: "#ee4848",
        boxShadow: "0 0 5px rgba(238, 72, 72, 0.5)",
        backgroundColor: "#fff0f0",
      }
      : {};
  };

  const allErrors = Object.values(errors).flat();

  return (
    <div>
      <div style={{ background: "#fff", padding: 10, alignItems: "center" }}>
        <Link href={"/"} style={{ background: "#fff", padding: 10, alignItems: "center" }}>
          <Image src="/logo.png" alt="Logo" width={130} height={27} />
        </Link>
      </div>

      {allErrors.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20, width: "100%" }}>
          <div style={{ width: "100%", maxWidth: 450, padding: "0 20px" }}>
            <Alert
              message="Verifique os campos abaixo"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {allErrors.map((err, idx) => (
                    <li key={idx} style={{ color: "#cf1322" }}>{err}</li>
                  ))}
                </ul>
              }
              type="error"
              showIcon
              closable
              onClose={() => setErrors({})}
            />
          </div>
        </div>
      )}

      <div className={styles.container}>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <h2 style={{ textAlign: "center" }}>Cadastrar</h2>

          <label htmlFor="name" style={{ marginBottom: 5 }}>
            Nome
          </label>
          <input
            type="text"
            id="name"
            required
            className={styles.input}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((prev) => ({ ...prev, name: [] }));
            }}
            style={getErrorStyle("name")}
          />
          {errors.name && errors.name.length > 0 && (
            <div style={{ color: "#ee4848", fontSize: "12px", marginTop: "-15px", marginBottom: "15px" }}>
              {errors.name.map((err, idx) => (
                <span key={idx} style={{ display: "block" }}>
                  {err}
                </span>
              ))}
            </div>
          )}

          <label htmlFor="email" style={{ marginBottom: 5 }}>
            Email
          </label>
          <input
            type="email"
            id="email"
            required
            className={styles.input}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((prev) => ({ ...prev, email: [] }));
            }}
            style={getErrorStyle("email")}
          />
          {errors.email && errors.email.length > 0 && (
            <div style={{ color: "#ee4848", fontSize: "12px", marginTop: "-15px", marginBottom: "15px" }}>
              {errors.email.map((err, idx) => (
                <span key={idx} style={{ display: "block" }}>
                  {err}
                </span>
              ))}
            </div>
          )}

          <label htmlFor="password" style={{ marginBottom: 5 }}>
            Senha
          </label>
          <input
            type="password"
            id="password"
            value={password}
            required
            className={styles.input}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((prev) => ({ ...prev, password: [] }));
            }}
            style={getErrorStyle("password")}
          />
          {errors.password && errors.password.length > 0 && (
            <div style={{ color: "#ee4848", fontSize: "12px", marginTop: "-15px", marginBottom: "15px" }}>
              {errors.password.map((err, idx) => (
                <span key={idx} style={{ display: "block" }}>
                  {err}
                </span>
              ))}
            </div>
          )}

          <label htmlFor="confirmPassword" style={{ marginBottom: 5 }}>
            Confirmar Senha
          </label>
          <input
            type="password"
            id="confirmPassword"
            required
            value={confirmPassword}
            className={styles.input}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((prev) => ({ ...prev, password_confirmation: [] }));
            }}
            style={getErrorStyle("password_confirmation")}
          />
          {errors.password_confirmation && errors.password_confirmation.length > 0 && (
            <div style={{ color: "#ee4848", fontSize: "12px", marginTop: "-15px", marginBottom: "15px" }}>
              {errors.password_confirmation.map((err, idx) => (
                <span key={idx} style={{ display: "block" }}>
                  {err}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15, marginTop: 10 }}>
            <input
              type="checkbox"
              id="terms"
              required
              checked={termsAccepted}
              onChange={(e) => {
                 setTermsAccepted(e.target.checked);
                 setErrors((prev) => ({ ...prev, terms: [] }));
              }}
              style={{ marginRight: 8, ...getErrorStyle("terms") }}
            />
            <label htmlFor="terms" style={{ fontSize: 14 }}>
              Eu concordo com os <Link href="/termos-de-uso" style={{ color: "#1890ff", textDecoration: "none" }} target="_blank">Termos de Uso</Link> e <Link href="/politica-de-privacidade" style={{ color: "#1890ff", textDecoration: "none" }} target="_blank">Política de Privacidade</Link>.
            </label>
          </div>
          {errors.terms && errors.terms.length > 0 && (
            <div style={{ color: "#ee4848", fontSize: "12px", marginTop: "-10px", marginBottom: "15px" }}>
              {errors.terms.map((err, idx) => (
                <span key={idx} style={{ display: "block" }}>
                  {err}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button type="submit" className={styles.button}>
              Cadastrar
            </button>
            <Link href={"/login"} style={{ textDecoration: "none" }}>
              <p style={{ fontSize: 14, marginTop: 20, color: "black" }}>Já possui cadastro?</p>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountPage;
