import Link from "next/link";
import Image from "next/image";

export default function TermosDeUso() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9", paddingBottom: 40 }}>
      <div style={{ background: "#fff", padding: 10, display: "flex", alignItems: "center", borderBottom: "1px solid #eaeaea" }}>
        <Link href={"/"} style={{ display: "inline-block" }}>
          <Image src="/logo.png" alt="Logo" width={130} height={27} />
        </Link>
      </div>
      <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto", lineHeight: "1.6", backgroundColor: "#fff", marginTop: 40, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h1 style={{ marginBottom: 20 }}>Termos de Uso</h1>
        <p style={{ marginBottom: 15 }}>Bem-vindo ao nosso aplicativo. Ao utilizar nossos serviços, você concorda com os seguintes termos:</p>
        
        <h2 style={{ marginTop: 25, marginBottom: 10 }}>1. Aceitação dos Termos</h2>
        <p style={{ marginBottom: 15 }}>Ao acessar e usar este sistema, você aceita e concorda em estar vinculado pelos termos e disposições deste acordo. Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.</p>
        
        <h2 style={{ marginTop: 25, marginBottom: 10 }}>2. Uso do Serviço</h2>
        <p style={{ marginBottom: 15 }}>Você concorda em usar o serviço apenas para fins legais e de acordo com as leis aplicáveis. Você não deve usar o serviço para qualquer atividade ilegal, não autorizada ou para transmitir qualquer material prejudicial.</p>
        
        <h2 style={{ marginTop: 25, marginBottom: 10 }}>3. Responsabilidade do Usuário</h2>
        <p style={{ marginBottom: 15 }}>Você é responsável por manter a confidencialidade da sua conta e senha. Qualquer atividade realizada sob a sua conta é de sua inteira responsabilidade.</p>

        <h2 style={{ marginTop: 25, marginBottom: 10 }}>4. Modificações</h2>
        <p style={{ marginBottom: 15 }}>Reservamo-nos o direito de modificar ou substituir estes termos a qualquer momento, a nosso exclusivo critério. Quaisquer alterações entrarão em vigor imediatamente após a publicação no aplicativo.</p>
        
        <p style={{ marginTop: 40 }}>
          <Link href="/createaccount" style={{ color: "#1890ff", textDecoration: "underline", fontWeight: "bold" }}>
            Voltar para o cadastro
          </Link>
        </p>
      </div>
    </div>
  );
}
