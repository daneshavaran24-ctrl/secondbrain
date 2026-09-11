import { Resend } from 'resend';

const FROM = process.env.EMAIL_FROM || 'noreply@brainforge.dev';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(key);
}

export async function sendPasswordResetEmail(to, resetUrl) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: '🔐 بازیابی رمز عبور BrainForge',
    html: `<!DOCTYPE html><html dir="rtl" lang="fa">
<head><meta charset="UTF-8"><style>
body{font-family:Tahoma,Arial,sans-serif;background:#f8fafc;direction:rtl;padding:20px}
.box{max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:36px;box-shadow:0 4px 12px rgba(0,0,0,.1)}
h2{color:#1e293b}p{color:#475569;line-height:1.7}
.btn{display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold}
.note{font-size:13px;color:#94a3b8;margin-top:16px}
</style></head>
<body><div class="box">
  <h2>🔐 بازیابی رمز عبور</h2>
  <p>برای بازیابی رمز عبور روی دکمه زیر کلیک کنید:</p>
  <p><a class="btn" href="${resetUrl}">بازیابی رمز عبور</a></p>
  <p class="note">این لینک ۱ ساعت معتبر است. اگر شما این درخواست را ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
</div></body></html>`,
  });
}

export async function sendDelegationEmail(to, { taskId, delegateeName, title, description, dueDate }) {
  const resend = getResend();
  const dueDateText = dueDate
    ? new Date(dueDate).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'تعیین نشده';

  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `🎯 واگذاری وظیفه جدید: ${title}`,
    html: `<!DOCTYPE html><html dir="rtl" lang="fa">
<head><meta charset="UTF-8"><style>
body{font-family:Tahoma,Arial,sans-serif;background:#f8fafc;direction:rtl;padding:20px}
.box{max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)}
.hdr{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:28px;text-align:center}
.hdr h1{margin:0;font-size:22px}
.body{padding:28px}
.card{background:#f1f5f9;border-radius:8px;padding:20px;margin:16px 0}
.title{font-size:20px;font-weight:bold;color:#1e293b;margin-bottom:8px}
.desc{color:#64748b;line-height:1.6}
.badge{background:#fef3c7;color:#92400e;padding:8px 14px;border-radius:6px;font-weight:bold;display:inline-block;margin-top:12px}
.foot{background:#f8fafc;padding:16px;text-align:center;color:#94a3b8;font-size:13px}
</style></head>
<body><div class="box">
  <div class="hdr"><h1>🎯 واگذاری وظیفه جدید</h1>
    <p>${delegateeName ? `سلام ${delegateeName}،` : ''} وظیفه‌ای جدید برای شما واگذار شده است</p>
  </div>
  <div class="body"><div class="card">
    <div class="title">${title}</div>
    <div class="desc">${description || 'بدون توضیحات اضافی'}</div>
    <div class="badge">⏰ مهلت: ${dueDateText}</div>
  </div>
  <p>لطفاً نسبت به انجام این وظیفه اقدام نمایید.</p></div>
  <div class="foot"><p>BrainForge — شناسه وظیفه: ${taskId}</p></div>
</div></body></html>`,
  });
}
