import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { sendSms } from '../utils/sms.js';
import { aiChat, sendAiError } from '../utils/ai.js';

const router = Router();

// ─── Tools (Function Calling) ─────────────────────────────────────────────────
const ASSISTANT_TOOLS = [
  { type:'function', function:{ name:'create_meeting', description:'ایجاد قرار یا جلسه جدید در تقویم', parameters:{ type:'object', properties:{ title:{type:'string',description:'عنوان جلسه'}, date:{type:'string',description:'تاریخ جلسه'}, time:{type:'string',description:'ساعت جلسه'}, duration:{type:'number',description:'مدت جلسه به دقیقه'}, participants:{type:'array',items:{type:'string'},description:'شرکت‌کنندگان'}, location:{type:'string',description:'مکان'}, description:{type:'string',description:'توضیحات'} }, required:['title'] } } },
  { type:'function', function:{ name:'cancel_meeting', description:'لغو یک قرار موجود', parameters:{ type:'object', properties:{ search_query:{type:'string',description:'عبارت جستجو برای پیدا کردن جلسه'}, meeting_id:{type:'string'} } } } },
  { type:'function', function:{ name:'create_task', description:'ایجاد وظیفه یا کار جدید', parameters:{ type:'object', properties:{ title:{type:'string',description:'عنوان وظیفه'}, description:{type:'string'}, due_date:{type:'string',description:'موعد انجام'}, priority:{type:'string',enum:['low','medium','high','urgent']}, domain:{type:'string',enum:['personal','professional','organizational']} }, required:['title'] } } },
  { type:'function', function:{ name:'create_reminder', description:'ایجاد یادآوری', parameters:{ type:'object', properties:{ title:{type:'string'}, datetime:{type:'string',description:'زمان یادآوری'}, repeat:{type:'string',enum:['once','daily','weekly','monthly']} }, required:['title','datetime'] } } },
  { type:'function', function:{ name:'save_idea', description:'ذخیره ایده جدید در بانک ایده‌ها', parameters:{ type:'object', properties:{ title:{type:'string'}, description:{type:'string'}, category:{type:'string'}, priority:{type:'string',enum:['low','medium','high']} }, required:['title'] } } },
  { type:'function', function:{ name:'save_journal_entry', description:'ذخیره دل‌نوشته یا یادداشت شخصی', parameters:{ type:'object', properties:{ content:{type:'string'}, mood:{type:'string',enum:['happy','sad','calm','anxious','grateful','motivated']}, tags:{type:'array',items:{type:'string'}} }, required:['content'] } } },
  { type:'function', function:{ name:'save_gratitude', description:'ثبت شکرگذاری روزانه', parameters:{ type:'object', properties:{ item_1:{type:'string'}, item_2:{type:'string'}, item_3:{type:'string'}, notes:{type:'string'} }, required:['item_1'] } } },
  { type:'function', function:{ name:'save_meeting_summary', description:'ذخیره خلاصه و صورتجلسه', parameters:{ type:'object', properties:{ meeting_title:{type:'string'}, meeting_date:{type:'string'}, summary:{type:'string'}, decisions:{type:'array',items:{type:'string'}}, participants:{type:'array',items:{type:'string'}} }, required:['meeting_title','summary'] } } },
  { type:'function', function:{ name:'create_contact', description:'ایجاد مخاطب جدید', parameters:{ type:'object', properties:{ name:{type:'string'}, phone:{type:'string'}, email:{type:'string'}, organization:{type:'string'}, position:{type:'string'} }, required:['name'] } } },
  { type:'function', function:{ name:'save_for_later', description:'ذخیره محتوا برای مطالعه بعد (کتاب، مقاله، ویدیو)', parameters:{ type:'object', properties:{ title:{type:'string'}, url:{type:'string'}, category:{type:'string',enum:['book','article','video','podcast','link','other']}, notes:{type:'string'} }, required:['title'] } } },
  { type:'function', function:{ name:'save_knowledge', description:'ذخیره دانش یا محتوا در مدیریت دانش', parameters:{ type:'object', properties:{ title:{type:'string'}, content:{type:'string'}, category:{type:'string'}, tags:{type:'array',items:{type:'string'}} }, required:['title','content'] } } },
  { type:'function', function:{ name:'save_health_metrics', description:'ثبت اطلاعات سلامت', parameters:{ type:'object', properties:{ exercise_minutes:{type:'number'}, sleep_hours:{type:'number'}, water_intake:{type:'number'}, weight:{type:'number'}, notes:{type:'string'} } } } },
  { type:'function', function:{ name:'create_tasks_batch', description:'ایجاد چند وظیفه به‌طور همزمان', parameters:{ type:'object', properties:{ tasks:{type:'array',items:{type:'object',properties:{title:{type:'string'},due_date:{type:'string'},priority:{type:'string'},domain:{type:'string'}}}} }, required:['tasks'] } } },
  { type:'function', function:{ name:'get_pending_tasks', description:'بررسی وظایف در انتظار', parameters:{ type:'object', properties:{ domain:{type:'string',enum:['all','personal','professional','organizational']} } } } },
  { type:'function', function:{ name:'ask_clarification', description:'سوال از کاربر برای اطلاعات بیشتر', parameters:{ type:'object', properties:{ question:{type:'string'}, options:{type:'array',items:{type:'string'}}, field:{type:'string'} }, required:['question'] } } },
  // ── Restored in the Node port: the frontend action executor already
  //    implements all of these, but the backend stopped offering them as
  //    tools, so the model could never trigger them. ──────────────────────────
  { type:'function', function:{ name:'update_meeting', description:'تغییر اطلاعات یک جلسه موجود', parameters:{ type:'object', properties:{ meeting_id:{type:'string'}, search_query:{type:'string',description:'عبارت جستجو برای پیدا کردن جلسه'}, updates:{type:'object',properties:{ title:{type:'string'}, date:{type:'string'}, time:{type:'string'}, location:{type:'string'} }} } } } },
  { type:'function', function:{ name:'search_calendar', description:'جستجوی رویدادها و قرارهای تقویم', parameters:{ type:'object', properties:{ query:{type:'string',description:'عبارت جستجو'}, date_from:{type:'string',description:'از تاریخ'}, date_to:{type:'string',description:'تا تاریخ'} } } } },
  { type:'function', function:{ name:'search_contacts', description:'جستجوی مخاطبین', parameters:{ type:'object', properties:{ query:{type:'string',description:'نام یا عبارت جستجو'} }, required:['query'] } } },
  { type:'function', function:{ name:'send_notification', description:'ارسال پیام یا اطلاع‌رسانی به یک شخص', parameters:{ type:'object', properties:{ recipient:{type:'string',description:'نام یا شماره گیرنده'}, message:{type:'string',description:'متن پیام'}, method:{type:'string',enum:['sms','email','telegram'],description:'روش ارسال'} }, required:['recipient','message'] } } },
  { type:'function', function:{ name:'save_meeting_recording', description:'ذخیره ضبط یا رونویسی جلسه', parameters:{ type:'object', properties:{ title:{type:'string'}, transcript:{type:'string',description:'متن پیاده‌شده جلسه'}, meeting_date:{type:'string'}, participants:{type:'array',items:{type:'string'}}, duration_minutes:{type:'number'}, audio_url:{type:'string'} }, required:['title'] } } },
  { type:'function', function:{ name:'import_contacts_batch', description:'وارد کردن چند مخاطب به‌طور همزمان', parameters:{ type:'object', properties:{ contacts:{type:'array',items:{type:'object',properties:{ name:{type:'string'}, phone:{type:'string'}, email:{type:'string'}, organization:{type:'string'}, position:{type:'string'} },required:['name']}}, skip_duplicates:{type:'boolean'} }, required:['contacts'] } } },
  { type:'function', function:{ name:'add_resume_item', description:'افزودن مورد جدید به رزومه', parameters:{ type:'object', properties:{ section:{type:'string',enum:['education','work','skills','certificates','awards','affiliations'],description:'بخش رزومه'}, title:{type:'string'}, organization:{type:'string'}, start_date:{type:'string'}, end_date:{type:'string'}, description:{type:'string'}, location:{type:'string'} }, required:['section','title'] } } },
  { type:'function', function:{ name:'create_csr_project', description:'ایجاد پروژه مسئولیت اجتماعی', parameters:{ type:'object', properties:{ title:{type:'string'}, description:{type:'string'}, type:{type:'string',enum:['charity','environmental','educational','health','community']}, budget:{type:'number'}, start_date:{type:'string'}, end_date:{type:'string'}, beneficiaries:{type:'array',items:{type:'string'}}, partners:{type:'array',items:{type:'string'}} }, required:['title'] } } },
  { type:'function', function:{ name:'complete_habit', description:'ثبت انجام یک عادت برای امروز', parameters:{ type:'object', properties:{ habit_name:{type:'string',description:'نام عادت'}, notes:{type:'string'} }, required:['habit_name'] } } },
  { type:'function', function:{ name:'create_legal_case', description:'ایجاد پرونده حقوقی جدید', parameters:{ type:'object', properties:{ title:{type:'string'}, case_number:{type:'string'}, case_type:{type:'string',description:'نوع پرونده، مثلاً حقوقی یا کیفری'}, court:{type:'string',description:'نام دادگاه'}, opposing_party:{type:'string',description:'طرف مقابل'}, description:{type:'string'}, next_hearing_date:{type:'string',description:'تاریخ جلسه بعدی'} }, required:['title'] } } },
  { type:'function', function:{ name:'save_lawyer_note', description:'ذخیره یادداشت حقوقی', parameters:{ type:'object', properties:{ title:{type:'string'}, content:{type:'string'}, case_title:{type:'string',description:'عنوان پرونده مرتبط'}, category:{type:'string'} }, required:['title','content'] } } },
  { type:'function', function:{ name:'create_organization_mission', description:'ایجاد ماموریت سازمانی', parameters:{ type:'object', properties:{ title:{type:'string'}, description:{type:'string'}, priority:{type:'string',enum:['low','medium','high','urgent']}, due_date:{type:'string'} }, required:['title'] } } },
  { type:'function', function:{ name:'request_missing_info', description:'درخواست اطلاعات تکمیلی از کاربر وقتی داده‌های استخراج‌شده ناقص است', parameters:{ type:'object', properties:{ data_type:{type:'string',description:'نوع داده، مثلاً مخاطب یا وظیفه'}, extracted_data:{type:'object'}, missing_fields:{type:'array',items:{type:'string'}}, suggestions:{type:'array',items:{type:'string'}} }, required:['data_type','missing_fields'] } } },
  { type:'function', function:{ name:'process_attachment', description:'پردازش فایل ضمیمه (خلاصه‌سازی، تحلیل یا استخراج داده)', parameters:{ type:'object', properties:{ file_content:{type:'string'}, file_type:{type:'string'}, action:{type:'string',enum:['summarize','analyze','extract_data']} }, required:['action'] } } },
  { type:'function', function:{ name:'send_sms', description:'ارسال پیامک به یک شماره موبایل', parameters:{ type:'object', properties:{ phone:{type:'string',description:'شماره موبایل گیرنده مثلاً ۰۹۱۲۱۲۳۴۵۶۷'}, message:{type:'string',description:'متن پیامک'} }, required:['phone','message'] } } },
];

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `###### قانون مطلق زبان (غیرقابل نقض) ######
تمام پاسخ‌های تو باید فقط به زبان فارسی باشد. هیچ کلمه انگلیسی استفاده نکن.

تو یک دستیار هوشمند اجرایی به نام «مورا» هستی که به مدیران و افراد حرفه‌ای کمک می‌کنی.

🎯 وظایف تو:
1. درک دستورات زبان طبیعی فارسی
2. تشخیص و اجرای اقدامات با استفاده از ابزارهای موجود
3. پرسیدن سوالات ضروری برای تکمیل اطلاعات
4. ارائه بازخورد دقیق به فارسی

📋 قوانین مهم:
- همیشه مختصر و مفید صحبت کن
- از ابزارهای موجود برای انجام کارها استفاده کن
- بعد از هر عملیات نتیجه را به فارسی اعلام کن
- در پایان هر پاسخ بپرس: "کار دیگری هست؟"

📍 بازخورد بعد از هر اقدام:
- قرار/جلسه → "✅ در تقویم ثبت شد - [تاریخ و ساعت]"
- وظیفه → "✅ در لیست وظایف اضافه شد - موعد: [تاریخ]"
- ایده → "✅ در بانک ایده‌ها ذخیره شد"
- یادآوری → "✅ یادآوری تنظیم شد - [زمان]"
- دل‌نوشته → "✅ دل‌نوشته ذخیره شد"
- شکرگذاری → "✅ در بخش شکرگذاری ثبت شد"
- پیامک → "✅ پیامک به [شماره] ارسال شد"

⚠️ برای ارسال پیامک حتماً قبل از اجرا شماره و متن پیام را با کاربر تأیید کن.

همیشه اول مطمئن شو چه کاری باید انجام شود، سپس با استفاده از ابزار مناسب اجرا کن.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RESUME_SECTIONS = {
  education:'تحصیلات', work:'سوابق کاری', skills:'مهارت‌ها',
  certificates:'گواهینامه‌ها', awards:'افتخارات', affiliations:'عضویت‌ها',
};

const CSR_TYPES = {
  charity:'خیریه', environmental:'محیط‌زیستی', educational:'آموزشی',
  health:'سلامت', community:'اجتماعی',
};

function getActionFeedback(fn, params) {
  const map = {
    create_meeting: { location:'تقویم حرفه‌ای', details:`قرار «${params.title||''}» - ${params.date||''} ${params.time||''}`.trim() },
    cancel_meeting: { location:'تقویم', details:'قرار لغو خواهد شد' },
    create_task: { location:`لیست وظایف ${params.domain==='personal'?'شخصی':params.domain==='professional'?'حرفه‌ای':'سازمانی'}`, details:`«${params.title||''}» موعد: ${params.due_date||'نامشخص'}` },
    create_reminder: { location:'یادآورها', details:`«${params.title||''}» - ${params.datetime||''}` },
    save_idea: { location:'بانک ایده‌ها', details:`«${params.title||''}» - ${params.category||'عمومی'}` },
    save_journal_entry: { location:'دفتر خاطرات شخصی', details:'دل‌نوشته ذخیره خواهد شد' },
    save_gratitude: { location:'شکرگذاری روزانه', details:'ثبت شکرگذاری' },
    save_meeting_summary: { location:'صورتجلسات', details:`«${params.meeting_title||''}»` },
    create_contact: { location:'مخاطبین', details:`«${params.name||''}» - ${params.organization||''}`.trim() },
    save_for_later: { location:'لیست مطالعه', details:`«${params.title||''}»` },
    save_knowledge: { location:'مدیریت دانش', details:`«${params.title||''}»` },
    save_health_metrics: { location:'سلامت', details:`${params.exercise_minutes?`ورزش: ${params.exercise_minutes}دقیقه`:''}${params.sleep_hours?` خواب: ${params.sleep_hours}ساعت`:''}`.trim()||'اطلاعات سلامت' },
    create_tasks_batch: { location:'لیست وظایف', details:`${(params.tasks||[]).length} وظیفه جدید` },
    get_pending_tasks: { location:'وظایف', details:`حوزه: ${params.domain||'همه'}` },
    send_sms: { location:'پیامک', details:`به ${params.phone||''}: ${(params.message||'').substring(0,40)}${(params.message||'').length>40?'...':''}` },
    update_meeting: { location:'تقویم حرفه‌ای', details:'اطلاعات قرار به‌روزرسانی خواهد شد' },
    search_calendar: { location:'تقویم', details:`جستجو: ${params.query||'همه رویدادها'}` },
    search_contacts: { location:'مخاطبین', details:`جستجو: ${params.query||''}` },
    send_notification: { location:'پیام‌رسانی', details:`پیام به ${params.recipient||''}` },
    save_meeting_recording: { location:'آرشیو ضبط جلسات', details:`«${params.title||''}» - ${params.duration_minutes||0} دقیقه` },
    import_contacts_batch: { location:'مخاطبین حرفه‌ای', details:`${(params.contacts||[]).length} مخاطب جدید` },
    add_resume_item: { location:`رزومه حرفه‌ای > ${RESUME_SECTIONS[params.section]||params.section||''}`, details:`${params.title||''}${params.organization?` - ${params.organization}`:''}` },
    create_csr_project: { location:'مسئولیت اجتماعی', details:`پروژه «${params.title||''}» - ${CSR_TYPES[params.type]||params.type||'عمومی'}` },
    complete_habit: { location:'عادت‌ها', details:`عادت «${params.habit_name||''}» انجام شد` },
    create_legal_case: { location:'پرونده‌های حقوقی', details:`«${params.title||''}»${params.court?` - ${params.court}`:''}` },
    save_lawyer_note: { location:'یادداشت‌های حقوقی', details:`«${params.title||''}»` },
    create_organization_mission: { location:'ماموریت‌های سازمانی', details:`«${params.title||''}»` },
    request_missing_info: { location:'درخواست اطلاعات', details:`نوع: ${params.data_type||''}` },
    process_attachment: { location:'پردازش فایل', details:`عملیات: ${params.action||''}` },
  };
  return map[fn] || { location:'سیستم', details:fn };
}

function getActionDescription(fn, params) {
  const map = {
    create_meeting: `📅 ایجاد قرار: «${params.title||''}» ${params.date||''} ${params.time||''}`.trim(),
    cancel_meeting: '❌ لغو قرار',
    create_task: `✅ وظیفه: «${params.title||''}»`,
    create_reminder: `🔔 یادآوری: «${params.title||''}» - ${params.datetime||''}`,
    save_idea: `💡 ایده: «${params.title||''}»`,
    save_journal_entry: '📝 ذخیره دل‌نوشته',
    save_gratitude: '🙏 ثبت شکرگذاری',
    save_meeting_summary: `📋 صورتجلسه: «${params.meeting_title||''}»`,
    create_contact: `👤 مخاطب: «${params.name||''}»`,
    save_for_later: `📚 ذخیره: «${params.title||''}»`,
    save_knowledge: `🧠 دانش: «${params.title||''}»`,
    save_health_metrics: '🏃 ثبت اطلاعات سلامت',
    create_tasks_batch: `✅ ${(params.tasks||[]).length} وظیفه جدید`,
    get_pending_tasks: '📊 بررسی وظایف در انتظار',
    send_sms: `📱 ارسال پیامک به ${params.phone||''}`,
    update_meeting: '✏️ ویرایش قرار',
    search_calendar: `🔍 جستجوی تقویم: «${params.query||''}»`,
    search_contacts: `🔍 جستجوی مخاطب: «${params.query||''}»`,
    send_notification: `📨 ارسال پیام به ${params.recipient||''}`,
    save_meeting_recording: `🎤 ذخیره ضبط جلسه: «${params.title||''}»`,
    import_contacts_batch: `👥 وارد کردن ${(params.contacts||[]).length} مخاطب`,
    add_resume_item: `📄 افزودن به رزومه (${RESUME_SECTIONS[params.section]||params.section||''}): «${params.title||''}»`,
    create_csr_project: `🌱 پروژه مسئولیت اجتماعی: «${params.title||''}»`,
    complete_habit: `✔️ ثبت عادت: «${params.habit_name||''}»`,
    create_legal_case: `⚖️ پرونده حقوقی: «${params.title||''}»`,
    save_lawyer_note: `📑 یادداشت حقوقی: «${params.title||''}»`,
    create_organization_mission: `🏢 ماموریت سازمانی: «${params.title||''}»`,
    request_missing_info: '❓ درخواست اطلاعات تکمیلی',
    process_attachment: '📎 پردازش فایل ضمیمه',
  };
  return map[fn] || fn;
}

// ─── Route ────────────────────────────────────────────────────────────────────
// ─── SMS execution endpoint (called after user confirms) ─────────────────────
router.post('/execute-sms', requireAuth, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone و message الزامی هستند' });
  try {
    await sendSms(phone, message);
    res.json({ success: true, to: phone });
  } catch (err) {
    console.error('[smart-assistant] SMS send failed:', err);
    res.status(502).json({ success: false, error: 'ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { message, conversationHistory = [], context = {}, attachment = null } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    // Build messages
    let systemContent = SYSTEM_PROMPT;
    if (context.currentDate) systemContent += `\n📅 تاریخ امروز: ${context.currentDate}`;
    if (context.currentTime) systemContent += `\n⏰ ساعت: ${context.currentTime}`;

    let userContent = message;
    if (attachment) {
      userContent = `[فایل: ${attachment.fileName} (${attachment.type})]\n${attachment.content?.substring(0, 2000) || ''}\n\nدرخواست: ${message}`;
    }

    const messages = [
      { role: 'system', content: systemContent },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userContent },
    ];

    // Walks the tool-capable model chain; the real failure reason is preserved.
    const { data: aiResponse } = await aiChat({
      messages,
      tools: ASSISTANT_TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1500,
      label: 'smart-assistant',
    });

    const choice = aiResponse.choices[0];
    const result = { message: '', actions: [], questions: [] };

    const safeActions = ['create_meeting','create_task','create_reminder','save_for_later',
      'save_journal_entry','save_gratitude','create_contact','save_meeting_summary',
      'create_tasks_batch','save_health_metrics','save_idea','get_pending_tasks','save_knowledge',
      // Restored actions that only create or read — never mutate or send.
      'search_calendar','search_contacts','save_meeting_recording','import_contacts_batch',
      'add_resume_item','create_csr_project','complete_habit','create_legal_case',
      'save_lawyer_note','create_organization_mission','request_missing_info','process_attachment'];
    // send_sms, send_notification, update_meeting and cancel_meeting are
    // intentionally excluded — each sends or destroys something, so the user
    // confirms before it runs.

    // Process tool calls
    if (choice.message?.tool_calls?.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        const fn = toolCall.function.name;
        let params = {};
        try { params = JSON.parse(toolCall.function.arguments || '{}'); } catch {}

        if (fn === 'ask_clarification') {
          result.questions.push({ question: params.question || '', options: params.options, field: params.field });
        } else {
          result.actions.push({
            type: 'action',
            function: fn,
            params,
            status: safeActions.includes(fn) ? 'pending' : 'needs_confirmation',
            feedback: getActionFeedback(fn, params),
          });
        }
      }
    }

    result.message = choice.message?.content || '';

    // Generate summary if no text but has actions/questions
    if (!result.message) {
      if (result.actions.length > 0) {
        const auto = result.actions.filter(a => a.status === 'pending');
        const confirm = result.actions.filter(a => a.status === 'needs_confirmation');
        if (auto.length > 0 && confirm.length === 0) {
          result.message = auto.length === 1
            ? `${getActionDescription(auto[0].function, auto[0].params)}\n\nانجام شد! ✅`
            : `انجام شد! 🎉\n${auto.map((a,i)=>`${i+1}. ${getActionDescription(a.function,a.params)}`).join('\n')}`;
        } else if (confirm.length > 0) {
          result.message = `این موارد نیاز به تأیید شما دارند:\n${confirm.map((a,i)=>`${i+1}. ⏳ ${getActionDescription(a.function,a.params)}`).join('\n')}`;
        }
      }
      if (result.questions.length > 0) {
        result.message += (result.message ? '\n\n' : '') + '❓ ' + result.questions[0].question;
      }
    }

    if (result.message && !result.message.includes('کار دیگری هست')) {
      result.message += '\n\n💬 کار دیگری هست؟';
    }

    res.json(result);
  } catch (error) {
    // sendAiError emits both `error` and `message` and logs the operator detail.
    return sendAiError(res, error, 'smart-assistant', { actions: [], questions: [] });
  }
});

export default router;
