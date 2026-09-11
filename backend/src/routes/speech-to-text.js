import { Router } from 'express';
import { Blob } from 'buffer';

const router = Router();

router.post('/', async (req, res) => {
  const { audio } = req.body;
  if (!audio) return res.status(400).json({ error: 'No audio data provided' });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: 'AI service is not configured' });

  try {
    const binaryString = Buffer.from(audio, 'base64');
    const blob = new Blob([binaryString], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'fa');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    res.json({ text: result.text, language: result.language || 'fa' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Speech-to-text error' });
  }
});

export default router;
