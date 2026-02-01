import { mustEnv, optEnv } from "@/lib/env";

export function whatsappConfig() {
  const token = mustEnv("WHATSAPP_TOKEN");
  const phoneNumberId = mustEnv("WHATSAPP_PHONE_NUMBER_ID");
  const version = optEnv("WHATSAPP_API_VERSION", "v20.0");
  return { token, phoneNumberId, version };
}

export async function sendWhatsAppText({ to, text }) {
  const { token, phoneNumberId, version } = whatsappConfig();
  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw new Error(`WhatsApp send failed: ${res.status} ${raw}`);
  }
  return res.json();
}
