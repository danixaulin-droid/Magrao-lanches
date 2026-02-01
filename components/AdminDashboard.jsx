"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar.");
      setMenu(data.menu || []);
      setOrders(data.orders || []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={load} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff" }}>
          Atualizar
        </button>
        {loading && <span>Carregando…</span>}
        {err && <span style={{ color: "crimson" }}>{err}</span>}
      </div>

      <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Cardápio</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Nome</th>
                <th style={th}>Preço</th>
                <th style={th}>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {menu.map((it) => (
                <tr key={it.id}>
                  <td style={td}>{it.name}</td>
                  <td style={td}>R$ {Number(it.price_cents/100).toFixed(2).replace(".", ",")}</td>
                  <td style={td}>{it.is_active ? "Sim" : "Não"}</td>
                </tr>
              ))}
              {menu.length === 0 && (
                <tr><td style={td} colSpan={3}>Sem itens. Insira em <code>menu_items</code> no Supabase.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Pedidos (últimos 20)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Criado</th>
                <th style={th}>Cliente</th>
                <th style={th}>Itens</th>
                <th style={th}>Total</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={td}>{new Date(o.created_at).toLocaleString()}</td>
                  <td style={td}>
                    <div><b>{o.customer_name || "—"}</b></div>
                    <div style={{ opacity: 0.8 }}>{o.from_phone}</div>
                  </td>
                  <td style={td}>
                    {(o.items || []).map((x, i) => (
                      <div key={i}>{x.qty}x {x.name}</div>
                    ))}
                  </td>
                  <td style={td}>R$ {Number(o.total_cents/100).toFixed(2).replace(".", ",")}</td>
                  <td style={td}><code>{o.status}</code></td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td style={td} colSpan={5}>Sem pedidos ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #eee", padding: "10px 8px", fontSize: 13 };
const td = { borderBottom: "1px solid #f0f0f0", padding: "10px 8px", fontSize: 13, verticalAlign: "top" };
