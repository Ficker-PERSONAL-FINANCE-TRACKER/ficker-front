"use client";
import { useContext, useState } from "react";
import styles from "./login.module.scss";
import Image from "next/image";
import { request } from "@/service/api";
import Link from "next/link";
import { Alert } from "antd";
import MainContext from "@/context";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { setAuth } = useContext(MainContext);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string>("");

  const handleSubmit = async () => {
    setErrors({});
    setGlobalError("");
    try {
      const response = await request({
        method: "POST",
        endpoint: "login",
        data: {
          email: email,
          password: password,
        },
      });
      if (response && response.status === 200) {
        setAuth(true);
        localStorage.setItem("token", response.data.data.token);
        return (window.location.href = "/");
      }
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setGlobalError("E-mail ou senha incorretos!");
      }
    }
  };

  const getErrorStyle = (fieldName: string) => {
    const hasFieldError = errors[fieldName] && errors[fieldName].length > 0;
    if (hasFieldError || globalError) {
      return {
        borderColor: "#ee4848",
        boxShadow: "0 0 5px rgba(238, 72, 72, 0.5)",
        backgroundColor: "#fff0f0",
      };
    }
    return {};
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

      {displayErrors.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20, width: "100%" }}>
          <div style={{ width: "100%", maxWidth: 450, padding: "0 20px" }}>
            <Alert
              message="Ocorreu um erro"
              description={
                <ul style={{ margin: 0, paddingLeft: displayErrors.length > 1 ? 20 : 0, listStyle: displayErrors.length > 1 ? "disc" : "none" }}>
                  {displayErrors.map((err, idx) => (
                    <li key={idx} style={{ color: "#cf1322" }}>{err}</li>
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
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <h2 style={{ textAlign: "center" }}>Entrar</h2>
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
              setGlobalError("");
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
            required
            className={styles.input}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((prev) => ({ ...prev, password: [] }));
              setGlobalError("");
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

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button type="submit" className={styles.button}>
              Entrar
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <Link href={"/recoveryaccount"} style={{ textDecoration: "none" }}>
              <p style={{ fontSize: 14, marginTop: 20, color: "black" }}>Esqueceu a senha?</p>
            </Link>
            <Link href={"/createaccount"} style={{ textDecoration: "none" }}>
              <p style={{ fontSize: 14, marginTop: -11, color: "black" }}>Cadastre-se</p>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
