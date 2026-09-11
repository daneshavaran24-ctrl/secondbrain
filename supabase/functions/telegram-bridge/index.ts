import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

// تشخیص ماژول مقصد از روی کلمات کلیدی
const detectModule = (text: string): { module: string; confidence: number } => {
  const lowerText = text.toLowerCase();
  
  // 1. Meetings
  if (/جلسه|قرار|ملاقات|میتینگ|meeting|appointment/.test(lowerText)) {
    return { module: 'meetings', confidence: 0.9 };
  }
  
  // 2. Knowledge Base
  if (/نکته|یادداشت|ذخیره|مطلب|یادگیری|دانش|knowledge|note|مقاله/.test(lowerText)) {
    return { module: 'knowledge', confidence: 0.85 };
  }
  
  // 3. Tasks (Delegation)
  if (/کار|تسک|وظیفه|انجام|task|todo|واگذاری|delegation/.test(lowerText)) {
    return { module: 'tasks', confidence: 0.8 };
  }
  
  // 4. Gratitude Journal
  if (/قدردانی|سپاس|شکرگزاری|gratitude|thankful|ممنون/.test(lowerText)) {
    return { module: 'gratitude', confidence: 0.85 };
  }
  
  // 5. Health Metrics
  if (/سلامتی|وزن|ورزش|خواب|health|weight|exercise|sleep/.test(lowerText)) {
    return { module: 'health', confidence: 0.85 };
  }
  
  // 6. Ideas
  if (/ایده|نوآوری|ابتکار|idea|innovation|startup/.test(lowerText)) {
    return { module: 'ideas', confidence: 0.8 };
  }
  
  // 7. Calendar Events
  if (/رویداد|تقویم|calendar|event|یادآوری|reminder/.test(lowerText)) {
    return { module: 'calendar', confidence: 0.8 };
  }
  
  // 8. Business Companies
  if (/شرکت|کمپانی|بیزینس|company|business|سازمان تجاری/.test(lowerText)) {
    return { module: 'companies', confidence: 0.75 };
  }
  
  // 9. Correspondence
  if (/مکاتبه|نامه|correspondence|letter|رسمی/.test(lowerText)) {
    return { module: 'correspondence', confidence: 0.75 };
  }
  
  // 10. CSR Projects
  if (/مسئولیت اجتماعی|csr|خیریه|charity|پروژه اجتماعی/.test(lowerText)) {
    return { module: 'csr', confidence: 0.75 };
  }
  
  // 11. Social Media
  if (/شبکه اجتماعی|social media|پست|tweet|اینستاگرام/.test(lowerText)) {
    return { module: 'social_media', confidence: 0.7 };
  }
  
  // 12. Hi Dock Recording
  if (/ضبط|recording|صوت|audio|hi dock/.test(lowerText)) {
    return { module: 'recording', confidence: 0.7 };
  }
  
  return { module: 'unknown', confidence: 0 };
};

// تعریف مراحل گفت‌وگو
const conversationSteps = {
  meetings: [
    { field: 'title', question: '📝 عنوان جلسه چیه؟', required: true },
    { field: 'date', question: '📅 تاریخ جلسه؟ (مثال: 1403/09/15)', required: true },
    { field: 'time', question: '🕐 ساعت؟ (مثال: 14:30)', required: true },
    { field: 'participants', question: '👥 شرکت‌کنندگان؟ (نام‌ها با کاما جدا کنید)', required: false },
  ],
  knowledge: [
    { field: 'title', question: '📝 عنوان مطلب؟', required: true },
    { field: 'category', question: '📁 دسته‌بندی؟\n- Projects (پروژه‌ها)\n- Areas (حوزه‌ها)\n- Resources (منابع)\n- Archives (آرشیو)', required: true },
  ],
  tasks: [
    { field: 'title', question: '📝 عنوان کار؟', required: true },
    { field: 'due_date', question: '📅 مهلت انجام؟ (مثال: 1403/09/20)', required: false },
    { field: 'priority', question: '⚡ اولویت؟\n- low (کم)\n- medium (متوسط)\n- high (زیاد)', required: false },
  ],
  gratitude: [
    { field: 'content', question: '🙏 امروز به چه چیزی قدردانی داری؟', required: true },
    { field: 'mood', question: '😊 حال و هوات چطوره؟\n- happy (خوشحال)\n- calm (آرام)\n- grateful (سپاسگزار)\n- motivated (باانگیزه)', required: false },
    { field: 'tags', question: '🏷️ برچسب‌ها؟ (با کاما جدا کن)', required: false },
  ],
  health: [
    { field: 'date', question: '📅 تاریخ ثبت؟ (مثال: 1403/09/15)', required: true },
    { field: 'weight', question: '⚖️ وزن (کیلوگرم)؟', required: false },
    { field: 'exercise_minutes', question: '🏃 مدت ورزش (دقیقه)؟', required: false },
    { field: 'sleep_hours', question: '😴 ساعات خواب؟', required: false },
    { field: 'water_intake', question: '💧 مصرف آب (لیوان)؟', required: false },
  ],
  ideas: [
    { field: 'title', question: '💡 عنوان ایده؟', required: true },
    { field: 'description', question: '📝 توضیحات؟', required: true },
    { field: 'category', question: '📁 دسته‌بندی؟\n- product (محصول)\n- service (خدمات)\n- business (کسب‌وکار)\n- social (اجتماعی)', required: false },
    { field: 'priority', question: '⚡ اولویت؟ (low/medium/high)', required: false },
  ],
  calendar: [
    { field: 'title', question: '📌 عنوان رویداد؟', required: true },
    { field: 'start_date', question: '📅 تاریخ شروع؟ (مثال: 1403/09/15)', required: true },
    { field: 'start_time', question: '🕐 ساعت شروع؟ (مثال: 14:30)', required: true },
    { field: 'end_time', question: '🕐 ساعت پایان؟ (مثال: 16:00)', required: false },
    { field: 'description', question: '📝 توضیحات؟', required: false },
  ],
  companies: [
    { field: 'company_name', question: '🏢 نام شرکت؟', required: true },
    { field: 'industry', question: '🏭 صنعت؟', required: false },
    { field: 'description', question: '📝 توضیحات؟', required: false },
  ],
  correspondence: [
    { field: 'title', question: '✉️ عنوان مکاتبه؟', required: true },
    { field: 'correspondence_type', question: '📋 نوع؟\n- incoming (ورودی)\n- outgoing (خروجی)\n- internal (داخلی)', required: true },
    { field: 'content', question: '📝 متن مکاتبه؟', required: true },
    { field: 'reference_number', question: '🔢 شماره مرجع؟', required: false },
  ],
  csr: [
    { field: 'title', question: '🌱 عنوان پروژه CSR؟', required: true },
    { field: 'type', question: '📁 نوع پروژه؟\n- education (آموزش)\n- health (سلامت)\n- environment (محیط‌زیست)\n- community (جامعه)', required: true },
    { field: 'description', question: '📝 توضیحات؟', required: false },
    { field: 'budget', question: '💰 بودجه (تومان)؟', required: false },
  ],
  social_media: [
    { field: 'platform', question: '📱 پلتفرم؟\n- twitter\n- instagram\n- linkedin\n- telegram', required: true },
    { field: 'content', question: '📝 محتوای پست؟', required: true },
    { field: 'post_url', question: '🔗 لینک پست؟', required: false },
  ],
  recording: [
    { field: 'title', question: '🎙️ عنوان ضبط؟', required: true },
    { field: 'category', question: '📁 دسته‌بندی؟\n- meeting (جلسه)\n- lecture (سخنرانی)\n- personal (شخصی)\n- interview (مصاحبه)', required: false },
  ],
};

// پردازش ویس
const processVoice = async (fileId: string, botToken: string) => {
  try {
    // دریافت URL فایل از تلگرام
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    const fileData = await fileResponse.json();
    
    if (!fileData.ok) {
      throw new Error('Failed to get file from Telegram');
    }
    
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
    
    // دانلود فایل
    const audioResponse = await fetch(fileUrl);
    const audioBuffer = await audioResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    // فراخوانی speech-to-text function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const sttResponse = await fetch(`${supabaseUrl}/functions/v1/speech-to-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ audio: base64Audio }),
    });
    
    const sttData = await sttResponse.json();
    return sttData.text || '';
  } catch (error) {
    console.error('[TELEGRAM] Voice processing error:', error);
    return null;
  }
};

// پردازش عکس
const processPhoto = async (fileId: string, botToken: string, userId: string, supabase: any) => {
  try {
    // دریافت URL فایل
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    const fileData = await fileResponse.json();
    
    if (!fileData.ok) {
      throw new Error('Failed to get file from Telegram');
    }
    
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
    
    // دانلود عکس
    const photoResponse = await fetch(fileUrl);
    const photoBlob = await photoResponse.blob();
    
    // آپلود به Supabase Storage
    const fileName = `telegram/${userId}/${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, photoBlob, { contentType: 'image/jpeg' });
    
    if (error) {
      console.error('[TELEGRAM] Upload error:', error);
      return null;
    }
    
    // دریافت URL عمومی
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);
    
    return { url: publicUrl, path: fileName };
  } catch (error) {
    console.error('[TELEGRAM] Photo processing error:', error);
    return null;
  }
};

// ارسال پیام به تلگرام
const sendTelegramMessage = async (chatId: number, text: string, botToken: string) => {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (error) {
    console.error('[TELEGRAM] Send message error:', error);
  }
};

// مدیریت گفت‌وگو
const manageConversation = async (
  supabase: any,
  userId: string,
  telegramId: number,
  module: string,
  userResponse: string,
  chatId: number,
  botToken: string
) => {
  // پیدا کردن conversation فعال
  const { data: conversations } = await supabase
    .from('telegram_conversations')
    .select('*')
    .eq('telegram_user_id', telegramId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);
  
  let conv = conversations?.[0];
  
  if (!conv) {
    // شروع conversation جدید
    const steps = conversationSteps[module];
    const { data: newConv, error } = await supabase
      .from('telegram_conversations')
      .insert({
        telegram_user_id: telegramId,
        user_id: userId,
        target_module: module,
        conversation_state: { [steps[0].field]: userResponse },
        current_step: steps[0].field,
        step_index: 0,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[TELEGRAM] Create conversation error:', error);
      return { completed: false, error: 'خطا در ایجاد گفت‌وگو' };
    }
    
    conv = newConv;
    
    // سؤال بعدی
    const nextStep = steps[1];
    if (nextStep) {
      await supabase
        .from('telegram_conversations')
        .update({
          current_step: nextStep.field,
          step_index: 1,
        })
        .eq('id', conv.id);
      
      return { completed: false, question: nextStep.question };
    }
  } else {
    // ادامه conversation موجود
    const steps = conversationSteps[module];
    const currentState = conv.conversation_state || {};
    currentState[conv.current_step] = userResponse;
    
    // سؤال بعدی
    const nextStepIndex = conv.step_index + 1;
    const nextStep = steps[nextStepIndex];
    
    if (nextStep) {
      await supabase
        .from('telegram_conversations')
        .update({
          conversation_state: currentState,
          current_step: nextStep.field,
          step_index: nextStepIndex,
        })
        .eq('id', conv.id);
      
      return { completed: false, question: nextStep.question };
    }
    
    // همه سؤالات تمام شد
    await supabase
      .from('telegram_conversations')
      .update({
        conversation_state: currentState,
        is_active: false,
      })
      .eq('id', conv.id);
    
    return { completed: true, data: currentState };
  }
  
  return { completed: true, data: conv.conversation_state };
};

// Insert نهایی در جداول مقصد
const insertToTargetModule = async (
  supabase: any,
  module: string,
  data: any,
  userId: string,
  rawMessageId: string,
  mediaUrl?: string
) => {
  try {
    let targetRecordId = null;
    
    switch (module) {
      case 'meetings':
        // ترکیب تاریخ و ساعت
        let meetingDate = data.date;
        if (data.time) {
          meetingDate = `${data.date} ${data.time}:00`;
        }
        
        const { data: meeting, error: meetingError } = await supabase
          .from('meetings')
          .insert({
            user_id: userId,
            title: data.title,
            meeting_date: meetingDate,
            description: data.participants ? `شرکت‌کنندگان: ${data.participants}` : '',
            status: 'scheduled',
          })
          .select()
          .single();
        
        if (meetingError) throw meetingError;
        targetRecordId = meeting.id;
        break;
        
      case 'knowledge':
        const { data: knowledge, error: knowledgeError } = await supabase
          .from('knowledge_base')
          .insert({
            author_id: userId,
            title: data.title,
            content: data.content || data.title,
            category: data.category || 'Areas',
            tags: [],
          })
          .select()
          .single();
        
        if (knowledgeError) throw knowledgeError;
        targetRecordId = knowledge.id;
        break;
        
      case 'tasks':
        const { data: task, error: taskError } = await supabase
          .from('delegation_tasks')
          .insert({
            delegator_id: userId,
            title: data.title,
            description: data.description || '',
            due_date: data.due_date ? `${data.due_date} 23:59:59` : null,
            priority: data.priority || 'medium',
            status: 'pending',
          })
          .select()
          .single();
        
        if (taskError) throw taskError;
        targetRecordId = task.id;
        break;
      
      case 'gratitude':
        const { data: gratitude, error: gratitudeError } = await supabase
          .from('gratitude_entries')
          .insert({
            user_id: userId,
            content: data.content,
            mood: data.mood || null,
            tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
            date: new Date().toISOString().split('T')[0],
            media_urls: mediaUrl ? [mediaUrl] : null,
          })
          .select()
          .single();
        
        if (gratitudeError) throw gratitudeError;
        targetRecordId = gratitude.id;
        break;
      
      case 'health':
        const { data: health, error: healthError } = await supabase
          .from('health_metrics')
          .insert({
            user_id: userId,
            date: data.date,
            weight: data.weight ? parseFloat(data.weight) : null,
            exercise_minutes: data.exercise_minutes ? parseInt(data.exercise_minutes) : null,
            sleep_hours: data.sleep_hours ? parseFloat(data.sleep_hours) : null,
            water_intake: data.water_intake ? parseInt(data.water_intake) : null,
          })
          .select()
          .single();
        
        if (healthError) throw healthError;
        targetRecordId = health.id;
        break;
      
      case 'ideas':
        const { data: idea, error: ideaError } = await supabase
          .from('ideas')
          .insert({
            user_id: userId,
            title: data.title,
            description: data.description,
            category: data.category || null,
            priority: data.priority || 'medium',
            status: 'new',
            stage: 'idea',
          })
          .select()
          .single();
        
        if (ideaError) throw ideaError;
        targetRecordId = idea.id;
        break;
      
      case 'calendar':
        const startDateTime = `${data.start_date} ${data.start_time}:00`;
        const endDateTime = data.end_time 
          ? `${data.start_date} ${data.end_time}:00`
          : `${data.start_date} ${data.start_time}:00`;
        
        const { data: calEvent, error: calError } = await supabase
          .from('calendar_events')
          .insert({
            user_id: userId,
            title: data.title,
            start_date: startDateTime,
            end_date: endDateTime,
            description: data.description || null,
            event_type: 'event',
          })
          .select()
          .single();
        
        if (calError) throw calError;
        targetRecordId = calEvent.id;
        break;
      
      case 'companies':
        const { data: company, error: companyError } = await supabase
          .from('business_companies')
          .insert({
            user_id: userId,
            company_name: data.company_name,
            industry: data.industry || null,
            description: data.description || null,
          })
          .select()
          .single();
        
        if (companyError) throw companyError;
        targetRecordId = company.id;
        break;
      
      case 'correspondence':
        const { data: corresp, error: correspError } = await supabase
          .from('correspondence')
          .insert({
            user_id: userId,
            title: data.title,
            correspondence_type: data.correspondence_type,
            content: data.content,
            reference_number: data.reference_number || null,
            status: 'draft',
            date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();
        
        if (correspError) throw correspError;
        targetRecordId = corresp.id;
        break;
      
      case 'csr':
        const { data: csrProject, error: csrError } = await supabase
          .from('csr_projects')
          .insert({
            user_id: userId,
            title: data.title,
            type: data.type,
            description: data.description || null,
            budget: data.budget ? parseFloat(data.budget) : null,
            status: 'planning',
            priority: 'medium',
          })
          .select()
          .single();
        
        if (csrError) throw csrError;
        targetRecordId = csrProject.id;
        break;
      
      case 'social_media':
        const { data: socialPost, error: socialError } = await supabase
          .from('social_media_posts')
          .insert({
            user_id: userId,
            platform: data.platform,
            content: data.content,
            post_url: data.post_url || null,
            media_url: mediaUrl || null,
          })
          .select()
          .single();
        
        if (socialError) throw socialError;
        targetRecordId = socialPost.id;
        break;
      
      case 'recording':
        const { data: recording, error: recordingError } = await supabase
          .from('hi_dock_recordings')
          .insert({
            user_id: userId,
            title: data.title,
            category: data.category || 'personal',
            dock_recording_id: `telegram_${Date.now()}`,
            recorded_at: new Date().toISOString(),
            audio_url: mediaUrl || null,
            processing_status: 'completed',
          })
          .select()
          .single();
        
        if (recordingError) throw recordingError;
        targetRecordId = recording.id;
        break;
    }
    
    // ثبت در telegram_processed_entries
    await supabase
      .from('telegram_processed_entries')
      .insert({
        raw_message_id: rawMessageId,
        user_id: userId,
        target_module: module,
        target_record_id: targetRecordId,
        processing_result: data,
      });
    
    return { success: true, recordId: targetRecordId };
  } catch (error) {
    console.error('[TELEGRAM] Insert error:', error);
    return { success: false, error: error.message };
  }
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
    
    if (!botToken || !webhookSecret) {
      throw new Error('Missing bot configuration');
    }
    
    // اعتبارسنجی secret token
    const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secretToken !== webhookSecret) {
      console.error('[TELEGRAM] Invalid secret token');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    
    const update = await req.json();
    console.log('[TELEGRAM] Received update:', JSON.stringify(update));
    
    // بررسی وجود پیام
    if (!update.message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const message = update.message;
    const chatId = message.chat.id;
    const telegramUser = message.from;
    const messageId = message.message_id;
    
    // ایجاد Supabase client با service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Security: Lookup existing telegram user to get linked application user
    // Only process messages from previously registered telegram users
    const { data: existingTelegramUser, error: telegramLookupError } = await supabase
      .from('telegram_users')
      .select('user_id, is_active')
      .eq('telegram_id', telegramUser.id)
      .single();
    
    if (telegramLookupError || !existingTelegramUser) {
      // Telegram user not linked - inform them to register first
      console.log(`[TELEGRAM] Unregistered telegram user attempted access: ${telegramUser.id}`);
      await sendTelegramMessage(
        chatId,
        '❌ حساب تلگرام شما به اپلیکیشن Mora متصل نیست.\n\n' +
        '📱 لطفاً ابتدا در اپلیکیشن Mora وارد شوید و از بخش تنظیمات، حساب تلگرام خود را متصل کنید.',
        botToken
      );
      
      // Log unauthorized access attempt for security audit
      await supabase.from('auth_audit').insert({
        actor_type: 'telegram',
        action: 'telegram_unauthorized_access',
        details: {
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username,
          chat_id: chatId,
        },
        ip_address: req.headers.get('x-forwarded-for') || null,
        user_agent: 'Telegram Bot API',
      });
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check if telegram user account is active
    if (!existingTelegramUser.is_active) {
      console.log(`[TELEGRAM] Inactive telegram user attempted access: ${telegramUser.id}`);
      await sendTelegramMessage(
        chatId,
        '❌ حساب تلگرام شما غیرفعال شده است. لطفاً با پشتیبانی تماس بگیرید.',
        botToken
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const userId = existingTelegramUser.user_id;
    
    // Update telegram user metadata (username, names may change)
    await supabase
      .from('telegram_users')
      .update({
        username: telegramUser.username || null,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegramUser.id);
    
    // پردازش نوع پیام
    let messageType = 'text';
    let processedContent = message.text || '';
    let mediaUrl = null;
    
    // پردازش ویس
    if (message.voice) {
      messageType = 'voice';
      await sendTelegramMessage(chatId, '🎙️ در حال پردازش پیام صوتی...', botToken);
      processedContent = await processVoice(message.voice.file_id, botToken);
      
      if (!processedContent) {
        await sendTelegramMessage(chatId, '❌ خطا در پردازش پیام صوتی', botToken);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // پردازش عکس
    if (message.photo && message.photo.length > 0) {
      messageType = 'photo';
      const largestPhoto = message.photo[message.photo.length - 1];
      const photoData = await processPhoto(largestPhoto.file_id, botToken, userId, supabase);
      
      if (photoData) {
        mediaUrl = photoData.url;
        processedContent = message.caption || 'عکس ارسال شده از تلگرام';
      }
    }
    
    // ذخیره پیام خام
    const { data: rawMessage, error: rawError } = await supabase
      .from('telegram_raw_messages')
      .insert({
        telegram_user_id: telegramUser.id,
        user_id: userId,
        message_type: messageType,
        raw_content: processedContent,
        media_url: mediaUrl,
        telegram_message_id: messageId,
        chat_id: chatId,
        processing_status: 'processing',
      })
      .select()
      .single();
    
    if (rawError) {
      console.error('[TELEGRAM] Raw message insert error:', rawError);
      await sendTelegramMessage(chatId, '❌ خطا در ذخیره پیام', botToken);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // بررسی conversation فعال
    const { data: activeConvs } = await supabase
      .from('telegram_conversations')
      .select('*')
      .eq('telegram_user_id', telegramUser.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    let targetModule = 'unknown';
    
    if (activeConvs && activeConvs.length > 0) {
      // ادامه conversation موجود
      const activeConv = activeConvs[0];
      targetModule = activeConv.target_module;
      
      const result = await manageConversation(
        supabase,
        userId,
        telegramUser.id,
        targetModule,
        processedContent,
        chatId,
        botToken
      );
      
      if (result.completed) {
        // ثبت نهایی
        const insertResult = await insertToTargetModule(
          supabase,
          targetModule,
          result.data,
          userId,
          rawMessage.id,
          mediaUrl
        );
        
        if (insertResult.success) {
          await supabase
            .from('telegram_raw_messages')
            .update({ processing_status: 'completed' })
            .eq('id', rawMessage.id);
          
          const moduleNames = {
            meetings: { name: 'جلسه', emoji: '📅' },
            knowledge: { name: 'نکته', emoji: '📝' },
            tasks: { name: 'تسک', emoji: '✅' },
            gratitude: { name: 'قدردانی', emoji: '🙏' },
            health: { name: 'سلامتی', emoji: '💪' },
            ideas: { name: 'ایده', emoji: '💡' },
            calendar: { name: 'رویداد', emoji: '📌' },
            companies: { name: 'شرکت', emoji: '🏢' },
            correspondence: { name: 'مکاتبه', emoji: '✉️' },
            csr: { name: 'پروژه CSR', emoji: '🌱' },
            social_media: { name: 'پست', emoji: '📱' },
            recording: { name: 'ضبط', emoji: '🎙️' },
          };
          
          const moduleName = moduleNames[targetModule] || { name: 'آیتم', emoji: '✅' };
          await sendTelegramMessage(
            chatId,
            `${moduleName.emoji} ${moduleName.name} با موفقیت ثبت شد!`,
            botToken
          );
        } else {
          await sendTelegramMessage(chatId, '❌ خطا در ثبت نهایی', botToken);
        }
      } else if (result.question) {
        await sendTelegramMessage(chatId, result.question, botToken);
      }
    } else {
      // تشخیص ماژول جدید
      const detection = detectModule(processedContent);
      
      if (detection.module === 'unknown') {
        await sendTelegramMessage(
          chatId,
          '❓ متوجه نشدم! لطفاً یکی از این کلمات رو استفاده کن:\n\n' +
          '📅 جلسه - برای ثبت قرار ملاقات\n' +
          '📝 نکته - برای ذخیره یادداشت\n' +
          '✅ کار - برای ایجاد تسک\n' +
          '🙏 قدردانی - برای ثبت شکرگزاری\n' +
          '💪 سلامتی - برای ثبت اطلاعات سلامت\n' +
          '💡 ایده - برای ثبت ایده جدید\n' +
          '📌 رویداد - برای ثبت رویداد تقویم\n' +
          '🏢 شرکت - برای ثبت شرکت\n' +
          '✉️ مکاتبه - برای ثبت نامه رسمی\n' +
          '🌱 CSR - برای پروژه مسئولیت اجتماعی\n' +
          '📱 پست - برای شبکه اجتماعی\n' +
          '🎙️ ضبط - برای ثبت صوت',
          botToken
        );
      } else {
        targetModule = detection.module;
        
        const result = await manageConversation(
          supabase,
          userId,
          telegramUser.id,
          targetModule,
          processedContent,
          chatId,
          botToken
        );
        
        if (result.question) {
          await sendTelegramMessage(chatId, result.question, botToken);
        }
      }
    }
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('[TELEGRAM] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
