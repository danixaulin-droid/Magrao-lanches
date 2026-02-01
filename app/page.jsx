import Webchat from "@/components/Webchat";

export default function Home() {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Agente de IA para Lanchonete</h1>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Webchat de teste (o canal principal é o WhatsApp via webhook).
          </p>
        </div>
        <a href="/admin" style={{ textDecoration: "none" }}>Admin →</a>
      </header>

      <section style={{ marginTop: 16 }}>
        <Webchat />
      </section>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Como usar no WhatsApp</h2>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
          <li>Faça deploy na Vercel.</li>
          <li>Configure o webhook em <b>/api/whatsapp/webhook</b>.</li>
          <li>Assine o evento <b>messages</b> no app do WhatsApp Cloud API.</li>
          <li>Envie uma mensagem para o número do WhatsApp da sua Cloud API.</li>
        </ol>
      </section>
    </main>
  );
}
