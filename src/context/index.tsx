"use client";
import { ReactNode, createContext, useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

type ContextProps = {
  auth: boolean;
  setAuth: React.Dispatch<React.SetStateAction<any>>;
};

type MainContextProviderProps = {
  children: ReactNode;
};

const MainContext = createContext({} as ContextProps);

export const MainProvider = ({ children }: MainContextProviderProps) => {
  const [auth, setAuth] = useState<boolean>(false);

  useEffect(() => {
    dayjs.locale("pt-br");
  }, []);

  return <MainContext.Provider value={{ auth, setAuth }}>{children}</MainContext.Provider>;
};

export default MainContext;
