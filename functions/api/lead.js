// Cloudflare Pages Function: приймає заявку із сайту й надсилає її в Telegram (через бота).
// Потрібні змінні середовища в Cloudflare: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
const clip = (s, n) => String(s || '').replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return new Response('Not configured', { status: 500 });

  let d;
  try { d = await request.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  if (d.website) return new Response('ok', { status: 200 }); // honeypot для ботів

  const name = clip(d.name, 80), phone = clip(d.phone, 30);
  if (!name || phone.replace(/\D/g, '').length < 9) return new Response('Invalid', { status: 400 });

  const lines = ['🔔 Нова заявка з сайту', '',
    '👤 ' + name, '📞 ' + phone, '🎯 ' + clip(d.goal, 30)];
  if (d.object) lines.push('🏠 ' + clip(d.object, 200));
  if (d.note) lines.push('', '💬 ' + clip(d.note, 1500));

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), disable_web_page_preview: true })
  });
  return new Response(r.ok ? 'ok' : 'Telegram error', { status: r.ok ? 200 : 502 });
}

export const onRequest = () => new Response('Method Not Allowed', { status: 405 });
