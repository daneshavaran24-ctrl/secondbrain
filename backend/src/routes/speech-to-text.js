import { Router } from 'express';
import { Blob } from 'buffer';

const router = Router();

router.post('/', async (req, res) => {
  const { audio } = req.body;
  if (!audio) return res.status(400).json({ error: 'No audio data provided' });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error('[speech-to-text] OPENAI_API_KEY is not set');
    return res.status(503).json({ error: 'سرویس تبدیل گفتار به متن پیکربندی نشده است.' });
  }

  // Overridable so the transcription call can be pointed at a reachable
  // OpenAI-compatible endpoint when api.openai.com is blocked from the server.
  const baseUrl = (process.env.SPEECH_TO_TEXT_BASE_URL || 'https://api.openai.com/v1')
    .trim()
    .replace(/\/+$/, '');

  try {
    const binaryString = Buffer.from(audio, 'base64');
    const blob = new Blob([binaryString], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'fa');

    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
      signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS) || 30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[speech-to-text] ${baseUrl} → HTTP ${response.status}`, errorText.slice(0, 500));
      const persian =
        response.status === 401 || response.status === 403
          ? 'کلید سرویس تبدیل گفتار به متن معتبر نیست.'
          : response.status === 429
            ? 'محدودیت تعداد درخواست. لطفاً چند لحظه بعد دوباره تلاش کنید.'
            : 'سرویس تبدیل گفتار به متن موقتاً در دسترس نیست.';
      return res.status(response.status === 401 || response.status === 403 ? 502 : response.status).json({ error: persian });
    }

    const result = await response.json();
    res.json({ text: result.text, language: result.language || 'fa' });
  } catch (error) {
    const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
    console.error('[speech-to-text] request failed:', error);
    res.status(isTimeout ? 504 : 502).json({
      error: isTimeout
        ? 'تبدیل گفتار به متن بیش از حد طول کشید. دوباره تلاش کنید.'
        : 'ارتباط با سرویس تبدیل گفتار به متن برقرار نشد.',
    });
  }
});

export default router;
