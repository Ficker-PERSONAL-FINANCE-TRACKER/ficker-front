# Ficker - Personal Finance Tracker (Frontend)

O **Ficker** é um sistema de controle financeiro pessoal. Este repositório contém o código-fonte do **Frontend** da aplicação, construído utilizando as melhores práticas modernas de desenvolvimento web.

## 🚀 Tecnologias e Stack

A aplicação foi desenvolvida utilizando as seguintes tecnologias:

*   **[Next.js](https://nextjs.org/) (v13)** - Framework React para renderização e rotas (App Router / Pages).
*   **[React](https://reactjs.org/) (v18)** - Biblioteca JavaScript para construção de interfaces de usuário.
*   **[TypeScript](https://www.typescriptlang.org/)** - Superset do JavaScript que adiciona tipagem estática.
*   **[Ant Design](https://ant.design/) (v5)** - Biblioteca de componentes de UI robusta e customizável.
*   **[Framer Motion](https://www.framer.com/motion/)** - Biblioteca de animações para React.
*   **[Recharts](https://recharts.org/)** - Biblioteca para construção de gráficos declarativos.
*   **[Sass](https://sass-lang.com/)** - Pré-processador CSS para estilizações avançadas.
*   **[Jest](https://jestjs.io/)** & **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Ferramentas para testes automatizados.
*   **[Axios](https://axios-http.com/)** - Cliente HTTP baseado em Promises para realizar requisições à API.

## ⚙️ Pré-requisitos

Antes de iniciar, certifique-se de ter as seguintes ferramentas instaladas em sua máquina:

*   [Node.js](https://nodejs.org/en/) (Versão recomendada: 18.x ou superior)
*   Gerenciador de pacotes: [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
*   [Git](https://git-scm.com/)

## 🛠️ Como Executar o Projeto Localmente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Ficker-PERSONAL-FINANCE-TRACKER/ficker-front.git
    cd ficker-front
    ```

2.  **Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto com base no arquivo `.env-example`.
    ```bash
    cp .env-example .env
    ```
    Preencha as variáveis de acordo com a sua configuração (ex: URL da API backend).

3.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    # ou
    yarn dev
    ```

5.  Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

## 📂 Estrutura do Projeto

A estrutura de diretórios foi organizada para manter o código escalável e de fácil manutenção:

```text
ficker-front/
├── __tests__/           # Testes unitários e de integração
├── public/              # Arquivos estáticos (imagens, ícones, etc)
├── src/
│   ├── app/             # Rotas e páginas da aplicação (Next.js 13+ App Router)
│   ├── components/      # Componentes React reutilizáveis
│   ├── context/         # Contextos da aplicação (React Context API)
│   ├── interfaces/      # Definições de tipos e interfaces do TypeScript
│   └── service/         # Configurações de requisições HTTP (Axios) e serviços da API
├── Dockerfile           # Configuração para criação da imagem Docker
├── jest.config.js       # Configurações do Jest
├── next.config.js       # Configurações do Next.js
├── package.json         # Dependências e scripts do projeto
└── tsconfig.json        # Configurações do TypeScript
```

## 📜 Scripts Disponíveis

No diretório do projeto, você pode rodar os seguintes comandos:

*   `npm run dev`: Executa a aplicação em modo de desenvolvimento.
*   `npm run build`: Cria a versão de produção otimizada da aplicação.
*   `npm run start`: Inicia o servidor Node.js de produção (necessita rodar o build antes).
*   `npm run lint`: Executa o linter (ESLint) para encontrar possíveis erros e formatar o código.
*   `npm run test`: Roda a suíte de testes automatizados utilizando Jest.

## 🐳 Docker

Este projeto já vem configurado com um `Dockerfile` para facilitar a criação de contêineres e o deploy da aplicação.

Para construir a imagem:
```bash
docker build -t ficker-front .
```

Para rodar o contêiner:
```bash
docker run -p 3000:3000 ficker-front
```

## 🧪 Testes

A aplicação utiliza Jest e React Testing Library para garantir a qualidade do código. Para executar os testes locais:

```bash
npm run test
```
Os testes e relatórios de cobertura ficam configurados na pasta `__tests__/`.

---

**Desenvolvido para gerenciar suas finanças de forma simples e eficiente.**
