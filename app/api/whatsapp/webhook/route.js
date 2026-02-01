import { mustEnv } from "@/lib/env";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { runAgent } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verificação do webhook (Meta):
 * GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 */
export async function GET(req) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === mustEnv("WHATSAPP_VERIFY_TOKEN")) {
    return new Response(challenge ?? "OK", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Recebe mensagens do WhatsApp Cloud API e responde via OpenAI.
 */
export async function POST(req) {
  try {
    const body = await req.json();

    // Estrutura do webhook (Meta)
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const messages = value?.messages;
    if (!messages || messages.length === 0) {
      // eventos de status etc.
      return Response.json({ ok: true, ignored: true });
    }

    const msg = messages[0];

    // Só lidar com texto (MVP)
    const from_phone = msg?.from; // ex: "5511999999999"
    const text = msg?.text?.body;

    if (!from_phone || !text) {
      return Response.json({ ok: true, skipped: true });
    }

    // Processar com agente
    const { reply } = await runAgent({ channel: "whatsapp", from_phone, text });

    // Responder ao cliente
    await sendWhatsAppText({ to: from_phone, text: reply });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return Response.json({ ok: false, error: e?.message || "Erro interno" }, { status: 500 });
  }
}
