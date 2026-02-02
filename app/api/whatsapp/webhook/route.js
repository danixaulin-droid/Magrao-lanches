import { NextResponse } from "next/server";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { runAgent } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verificação do webhook (Meta):
 * GET ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 */
export async function GET(req) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  // Se a env estiver faltando, responda 403 (não deixe estourar 500)
  if (!expected) return new Response("Missing WHATSAPP_VERIFY_TOKEN", { status: 403 });

  if (mode === "subscribe" && token === expected && challenge) {
    // A Meta espera receber o challenge "cru" como texto
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * Recebe mensagens do WhatsApp Cloud API e responde via OpenAI.
 */
export async function POST(req) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const messages = value?.messages;
    if (!messages || messages.length === 0) {
      // eventos de status, entrega, etc.
      return NextResponse.json({ ok: true, ignored: true });
    }

    const msg = messages[0];

    const from_phone = msg?.from; // ex: "5511999999999"
    const text = msg?.text?.body;

    if (!from_phone || !text) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { reply } = await runAgent({ channel: "whatsapp", from_phone, text });

    await sendWhatsAppText({ to: from_phone, text: reply });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
