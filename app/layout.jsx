export const metadata = {
  title: "Agente IA - Lanchonete",
  description: "MVP: WhatsApp + OpenAI + Supabase + Vercel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
