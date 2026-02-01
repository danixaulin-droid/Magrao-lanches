import OpenAI from "openai";
import { optEnv, mustEnv } from "@/lib/env";
import { supabaseServer } from "@/lib/supabaseServer";

const SYSTEM_PROMPT = ({ businessName }) => `
Você é um atendente de lanchonete no WhatsApp. Seu objetivo é:
- ajudar o cliente a escolher itens do cardápio (sem inventar preço)
- montar um pedido completo com quantidades
- coletar dados mínimos: nome, entrega/retirada, endereço se entrega, forma de pagamento
- confirmar o total e pedir confirmação final antes de criar o pedido
- ser educado(a), rápido(a) e objetivo(a) em pt-BR

REGRAS CRÍTICAS:
1) NÃO invente itens nem preços. Sempre use as ferramentas para consultar o cardápio.
2) Antes de criar o pedido, recapitule itens + total + taxa entrega + forma de pagamento e peça "CONFIRMA?".
3) Se o cliente não informar nome/endereço/pagamento, peça de forma curta e guiada.
4) Se houver ambiguidade (ex.: "um lanche"), pergunte 1 pergunta por vez.
5) Se o cliente pedir algo fora do cardápio, ofereça alternativas do cardápio.

NOME DO NEGÓCIO: ${businessName}
`.trim();

function moneyBRL(cents) {
  return `R$ ${(cents/100).toFixed(2).replace(".", ",")}`;
}

/** Tools */
async function getMenu() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("menu_items")
    .select("id,name,description,price_cents,is_active,category")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function calcDeliveryFee({ neighborhood }) {
  // modelo simples: tabela no banco. Se não tiver, retorna 0.
  const sb = supabaseServer();
  if (!neighborhood) return { fee_cents: 0, rule: "no_neighborhood" };

  const { data, error } = await sb
    .from("delivery_fees")
    .select("neighborhood,fee_cents")
    .ilike("neighborhood", neighborhood)
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return { fee_cents: 0, rule: "not_found" };
  return { fee_cents: data[0].fee_cents, rule: "matched" };
}

async function createOrder({ from_phone, customer_name, fulfillment, address, neighborhood, payment_method, items }) {
  const sb = supabaseServer();
  // 1) carregar menu e validar itens
  const menu = await getMenu();
  const byName = new Map(menu.map(m => [m.name.toLowerCase(), m]));

  let subtotal = 0;
  const normalizedItems = [];
  for (const it of (items || [])) {
    const name = String(it.name || "").trim();
    const qty = Math.max(1, Number(it.qty || 1));
    const mi = byName.get(name.toLowerCase());
    if (!mi) {
      return { ok: false, error: `Item não encontrado no cardápio: ${name}` };
    }
    subtotal += mi.price_cents * qty;
    normalizedItems.push({ id: mi.id, name: mi.name, qty, unit_price_cents: mi.price_cents });
  }

  const delivery = fulfillment === "delivery"
    ? await calcDeliveryFee({ neighborhood })
    : { fee_cents: 0, rule: "pickup" };

  const total = subtotal + (delivery.fee_cents || 0);

  const { data: order, error: e1 } = await sb
    .from("orders")
    .insert({
      from_phone,
      customer_name,
      fulfillment,
      address: address || null,
      neighborhood: neighborhood || null,
      payment_method: payment_method || null,
      items: normalizedItems,
      subtotal_cents: subtotal,
      delivery_fee_cents: delivery.fee_cents || 0,
      total_cents: total,
      status: "received",
    })
    .select("*")
    .single();

  if (e1) throw e1;

  return {
    ok: true,
    order_id: order.id,
    summary: {
      subtotal: moneyBRL(subtotal),
      delivery_fee: moneyBRL(delivery.fee_cents || 0),
      total: moneyBRL(total),
      status: order.status,
    }
  };
}

async function updateConversation({ from_phone, state, last_messages }) {
  const sb = supabaseServer();
  const payload = {
    from_phone,
    state: state || {},
    last_messages: last_messages || [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("conversations")
    .upsert(payload, { onConflict: "from_phone" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function getConversation({ from_phone }) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("conversations")
    .select("*")
    .eq("from_phone", from_phone)
    .single();

  if (error) return null;
  return data;
}

export async function runAgent({ channel, from_phone, text }) {
  const businessName = optEnv("BUSINESS_NAME", "Lanchonete");
  const model = optEnv("OPENAI_MODEL", "gpt-4.1-mini");
  const openai = new OpenAI({ apiKey: mustEnv("OPENAI_API_KEY") });

  // carregar contexto
  const convo = await getConversation({ from_phone });
  const memory = convo?.state || {};
  const history = Array.isArray(convo?.last_messages) ? convo.last_messages : [];

  // manter histórico curto
  const trimmedHistory = history.slice(-12);

  const tools = [
    {
      type: "function",
      function: {
        name: "get_menu",
        description: "Busca itens ativos do cardápio (nome, descrição, preço, categoria).",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "calc_delivery_fee",
        description: "Calcula taxa de entrega com base no bairro (se não existir, retorna 0).",
        parameters: {
          type: "object",
          properties: { neighborhood: { type: "string" } },
          required: ["neighborhood"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_order",
        description: "Cria pedido validando itens e calculando total. Use SOMENTE após o cliente confirmar.",
        parameters: {
          type: "object",
          properties: {
            from_phone: { type: "string" },
            customer_name: { type: "string" },
            fulfillment: { type: "string", enum: ["delivery", "pickup"] },
            address: { type: "string" },
            neighborhood: { type: "string" },
            payment_method: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  qty: { type: "number" },
                },
                required: ["name", "qty"],
              },
            },
          },
          required: ["from_phone", "customer_name", "fulfillment", "items"],
        },
      },
    },
  ];

  const messages = [
    { role: "system", content: SYSTEM_PROMPT({ businessName }) },
    { role: "system", content: `Contexto salvo (JSON): ${JSON.stringify(memory).slice(0, 1200)}` },
    ...trimmedHistory,
    { role: "user", content: text },
  ];

  const toolHandlers = {
    get_menu: async () => {
      const menu = await getMenu();
      // Formatar para o modelo com pouco ruído
      return menu.map((m) => ({
        name: m.name,
        description: m.description,
        category: m.category,
        price: moneyBRL(m.price_cents),
      }));
    },
    calc_delivery_fee: async (args) => {
      const r = await calcDeliveryFee(args);
      return { fee: moneyBRL(r.fee_cents), fee_cents: r.fee_cents, rule: r.rule };
    },
    create_order: async (args) => {
      // Ao criar, também limpa estado básico
      const r = await createOrder(args);
      return r;
    },
  };

  // Loop de tool-calling (máx 4)
  let replyText = "";
  let newState = { ...memory };
  let newHistory = [...trimmedHistory, { role: "user", content: text }];

  for (let i = 0; i < 4; i++) {
    const resp = await openai.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.4,
    });

    const choice = resp.choices?.[0];
    const msg = choice?.message;

    if (!msg) throw new Error("OpenAI: sem resposta.");

    // tool calls?
    const toolCalls = msg.tool_calls || [];
    if (toolCalls.length === 0) {
      replyText = msg.content || "Desculpe, não entendi. Pode repetir?";
      newHistory.push({ role: "assistant", content: replyText });
      break;
    }

    // executar tools e anexar resultados
    for (const tc of toolCalls) {
      const name = tc.function?.name;
      const args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
      const handler = toolHandlers[name];
      if (!handler) continue;

      const result = await handler(args);

      messages.push(msg);
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }
  }

  // atualizar memória simples: salvar última intenção/pedaços
  // (Você pode evoluir isso depois)
  newState.last_channel = channel;
  newState.last_seen_at = new Date().toISOString();

  await updateConversation({
    from_phone,
    state: newState,
    last_messages: newHistory.slice(-20),
  });

  return { reply: replyText };
}
