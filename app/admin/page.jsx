import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default function Admin() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Admin</h1>
      <p style={{ marginTop: 6, opacity: 0.8 }}>
        Painel simples para ver pedidos e cardápio. (Proteja este painel antes de usar em produção.)
      </p>
      <AdminDashboard />
    </main>
  );
}
