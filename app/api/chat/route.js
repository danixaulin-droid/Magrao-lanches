import { runAgent } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const text = String(body?.text || "").trim();
    const from = String(body?.from || "web").trim();
    const channel = String(body?.channel || "web").trim();

    if (!text) return Response.json({ error: "Texto vazio." }, { status: 400 });

    const { reply } = await runAgent({ channel, from_phone: from, text });
    return Response.json({ reply });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e?.message || "Erro interno" }, { status: 500 });
  }
}
