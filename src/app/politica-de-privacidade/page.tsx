import Link from "next/link";
import Image from "next/image";

export default function PoliticaDePrivacidade() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9", paddingBottom: 40 }}>
      <div style={{ background: "#fff", padding: 10, display: "flex", alignItems: "center", borderBottom: "1px solid #eaeaea" }}>
        <Link href={"/"} style={{ display: "inline-block" }}>
          <Image src="/logo.png" alt="Logo" width={130} height={27} />
        </Link>
      </div>
      <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto", lineHeight: "1.6", backgroundColor: "#fff", marginTop: 40, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h1 style={{ marginBottom: 20 }}>Política de Privacidade</h1>
        <p style={{ marginBottom: 15 }}>Sua privacidade é muito importante para nós. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações pessoais.</p>
        
        <h2 style={{ marginTop: 25, marginBottom: 10 }}>1. Coleta de Informações</h2>
        <p style={{ marginBottom: 15 }}>Coletamos informações que você nos fornece diretamente, como seu nome e endereço de e-mail ao criar uma conta, bem como dados gerados ao utilizar nossos serviços.</p>
        
        <h2 style={{ marginTop: 25, marginBottom: 10 }}>2. Uso das Informações</h2>
        <p style={{ marginBottom: 15 }}>As informações coletadas são utilizadas exclusivamente para fornecer, manter, personalizar e melhorar nossos serviços. Também podemos usá-las para nos comunicar com você, como enviar avisos ou atualizações importantes.</p>
        
        <h2 style={{ marginTop: 25, marginBottom: 10 }}>3. Compartilhamento de Informações</h2>
        <p style={{ marginBottom: 15 }}>Nós não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. O compartilhamento só ocorre quando estritamente necessário para a prestação do serviço ou mediante exigência legal.</p>
        
        <h2 style={{ marginTop: 25, marginBottom: 10 }}>4. Segurança dos Dados</h2>
        <p style={{ marginBottom: 15 }}>Empregamos rigorosas medidas de segurança técnicas e administrativas para proteger suas informações contra acessos não autorizados, perdas, destruição ou alterações.</p>
        
        <p style={{ marginTop: 40 }}>
          <Link href="/createaccount" style={{ color: "#1890ff", textDecoration: "underline", fontWeight: "bold" }}>
            Voltar para o cadastro
          </Link>
        </p>
      </div>
    </div>
  );
}
