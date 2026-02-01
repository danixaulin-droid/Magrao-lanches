"use client";

import { useMemo, useState } from "react";

export default function Webchat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Oi! Sou o agente da lanchonete. Quer pedir o quê hoje? 🍔🥤" },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => text.trim().length > 0 && !loading, [text, loading]);

  async function send() {
    if (!canSend) return;
    const userText = text.trim();
    setText("");
    setMessages((m) => [...m, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "web", from: "webchat", text: userText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha no chat.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Ops! Deu erro no servidor. Veja logs na Vercel." }]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: 12, height: 380, overflow: "auto", background: "#fafafa" }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 10
          }}>
            <div style={{
              maxWidth: "80%",
              padding: "10px 12px",
              borderRadius: 14,
              background: m.role === "user" ? "#111" : "#fff",
              color: m.role === "user" ? "#fff" : "#111",
              border: m.role === "user" ? "1px solid #111" : "1px solid #e8e8e8",
              whiteSpace: "pre-wrap",
              lineHeight: 1.4
            }}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 10, display: "flex", gap: 8, borderTop: "1px solid #eee" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Digite seu pedido…"
          style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #ddd", outline: "none" }}
        />
        <button
          onClick={send}
          disabled={!canSend}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: canSend ? "#111" : "#999",
            color: "#fff",
            cursor: canSend ? "pointer" : "not-allowed"
          }}
        >
          {loading ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
