/**
 * SMS Service — SMS.ir (ایده پردازان)
 * Docs: https://app.sms.ir/developer
 */

const GATEWAY_URL = 'https://api.sms.ir/v1';

function getApiKey() {
  const key = process.env.SMS_API_KEY;
  if (!key) throw new Error('SMS service is not configured');
  return key;
}

function normalizePhone(phone) {
  const n = phone.replace(/\D/g, '');
  if (n.startsWith('98')) return '0' + n.slice(2);
  if (n.startsWith('0')) return n;
  return '0' + n;
}

/**
 * Send a plain text SMS
 */
export async function sendSms(receptor, message, lineNumber = '') {
  const apiKey = getApiKey();
  const mobile = normalizePhone(Array.isArray(receptor) ? receptor[0] : receptor);
  const sender = lineNumber || process.env.SMS_LINE_NUMBER || '';

  const response = await fetch(`${GATEWAY_URL}/send/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      lineNumber: sender,
      sendDateTime: null,
      messageText: message,
      mobiles: [mobile],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`SMS error: HTTP ${response.status} — ${text || 'no response'}`);
  }
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (data.status !== 1) {
    throw new Error(data.message || `SMS error (status ${data.status})`);
  }
  return data;
}

/**
 * Send OTP via template (SMS_OTP_TEMPLATE = templateId number)
 * Falls back to plain SMS if not configured.
 */
export async function sendOtp(phone, code) {
  const templateId = process.env.SMS_OTP_TEMPLATE;

  if (templateId) {
    const apiKey = getApiKey();
    const mobile = normalizePhone(phone);

    const response = await fetch(`${GATEWAY_URL}/send/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        mobile,
        templateId: Number(templateId),
        parameters: [{ name: 'Code', value: String(code) }],
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`OTP SMS error: HTTP ${response.status} — ${text || 'no response'}`);
    }
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (data.status !== 1) {
      throw new Error(data.message || `OTP SMS error (status ${data.status})`);
    }
    return data;
  }

  // Fallback: plain text OTP
  return sendSms(phone, `کد تأیید شما: ${code}\nاین کد ۵ دقیقه معتبر است.\nMora System`);
}
