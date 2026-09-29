// Приймає заявку із сайту й надсилає її в Telegram (через бота).
// Потрібні змінні середовища в Netlify: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
const clip = (s, n) => String(s || '').replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { statusCode: 500, body: 'Not configured' };

  let d;
  try { d = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Bad JSON' }; }
  if (d.website) return { statusCode: 200, body: 'ok' }; // honeypot для ботів

  const name = clip(d.name, 80), phone = clip(d.phone, 30);
  if (!name || phone.replace(/\D/g, '').length < 9) return { statusCode: 400, body: 'Invalid' };

  const lines = ['🔔 Нова заявка з сайту', '',
    '👤 ' + name, '📞 ' + phone, '🎯 ' + clip(d.goal, 30)];
  if (d.object) lines.push('🏠 ' + clip(d.object, 200));
  if (d.topic) lines.push('📌 ' + clip(d.topic, 150));
  if (d.note) lines.push('', '💬 ' + clip(d.note, 1500));

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), disable_web_page_preview: true })
  });
  return { statusCode: r.ok ? 200 : 502, body: r.ok ? 'ok' : 'Telegram error' };
};
