import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = supabaseServer();
    const { data: menu, error: e1 } = await sb
      .from("menu_items")
      .select("id,name,price_cents,is_active,category")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (e1) throw e1;

    const { data: orders, error: e2 } = await sb
      .from("orders")
      .select("id,created_at,from_phone,customer_name,items,total_cents,status")
      .order("created_at", { ascending: false })
      .limit(20);

    if (e2) throw e2;

    return Response.json({ menu: menu || [], orders: orders || [] });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e?.message || "Erro interno" }, { status: 500 });
  }
}
