# Agente de IA para Lanchonete (WhatsApp + Vercel + GitHub + Supabase)

Este projeto é um **MVP profissional** de um agente de IA para lanchonete rodando no **WhatsApp Cloud API (Meta)**.
Ele:
- atende clientes no WhatsApp
- consulta cardápio no Supabase
- cria pedidos e calcula taxa de entrega
- confirma o pedido e notifica a cozinha/atendente via WhatsApp
- mantém contexto (conversa) por número

## 1) Pré-requisitos
- Conta no GitHub
- Conta na Vercel
- Conta no Supabase
- WhatsApp Cloud API (Meta) configurada (token + phone_number_id)
- Chave da OpenAI

## 2) Variáveis de ambiente (Vercel / local)
Crie um arquivo `.env.local` (local) ou configure na Vercel:

### OpenAI
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4.1-mini` (padrão) — pode trocar

### Supabase (SERVICE ROLE — apenas server-side)
- `SUPABASE_URL=https://xxxx.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=...`

### WhatsApp Cloud API (Meta)
- `WHATSAPP_VERIFY_TOKEN=uma_senha_qualquer_para_verificacao`
- `WHATSAPP_TOKEN=EAAG...` (token do app)
- `WHATSAPP_PHONE_NUMBER_ID=1234567890`
- `WHATSAPP_API_VERSION=v20.0` (padrão)

### Operação
- `BUSINESS_NAME=Sua Lanchonete`
- `BUSINESS_PHONE=5511999999999` (número do atendente/cozinha que receberá notificação)
- `TIMEZONE=America/Sao_Paulo`

## 3) Banco (Supabase)
Execute o SQL em `supabase/schema.sql`.

Depois, insira itens do cardápio em `menu_items`.

## 4) Rodar local
```bash
npm install
npm run dev
```
Acesse:
- Webchat de teste: http://localhost:3000
- Healthcheck: http://localhost:3000/api/health

## 5) Configurar Webhook da Meta (WhatsApp Cloud API)
Use esta URL (depois do deploy na Vercel):
- Callback URL: `https://SEU-DOMINIO.vercel.app/api/whatsapp/webhook`
- Verify Token: o mesmo de `WHATSAPP_VERIFY_TOKEN`

Assine os eventos de **messages**.

## 6) Produção (Vercel)
- Faça push no GitHub
- Importe o repo na Vercel
- Configure as env vars
- Deploy

## 7) Segurança importante
- **NUNCA** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Este projeto usa o service role **somente em rotas server** (API routes).
- Se você for vender como SaaS multi-lanchonetes, separe por `tenant_id`.

---

Se quiser, dá pra evoluir para:
- Pagamento (Mercado Pago)
- Impressão de comanda
- Modo multi-loja
- Painel admin com login (Supabase Auth)
