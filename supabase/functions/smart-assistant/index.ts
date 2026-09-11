// AI traffic routed through Liara AI (OpenAI-compatible). See _shared/liaraAI.ts
import { aiFetch as fetch, liaraEnabled } from '../_shared/liaraAI.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Assistant capabilities - Tools for function calling
const ASSISTANT_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_meeting",
      description: "ایجاد قرار یا جلسه جدید در تقویم",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان جلسه" },
          date: { type: "string", description: "تاریخ جلسه (مثال: فردا، ۱۴۰۳/۱۰/۱۵)" },
          time: { type: "string", description: "ساعت جلسه (مثال: ۱۴:۰۰، ساعت ۲ بعدازظهر)" },
          duration: { type: "number", description: "مدت جلسه به دقیقه" },
          participants: { 
            type: "array", 
            items: { type: "string" },
            description: "لیست شرکت‌کنندگان" 
          },
          location: { type: "string", description: "مکان جلسه" },
          description: { type: "string", description: "توضیحات جلسه" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_meeting",
      description: "لغو یا کنسل کردن یک قرار موجود",
      parameters: {
        type: "object",
        properties: {
          meeting_id: { type: "string", description: "شناسه جلسه برای کنسل کردن" },
          search_query: { type: "string", description: "عبارت جستجو برای پیدا کردن جلسه (مثال: جلسه با احمدی)" },
          date: { type: "string", description: "تاریخ جلسه برای محدود کردن جستجو" },
          notify_participants: { type: "boolean", description: "آیا به شرکت‌کنندگان اطلاع داده شود؟" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_meeting",
      description: "تغییر اطلاعات یک جلسه موجود",
      parameters: {
        type: "object",
        properties: {
          meeting_id: { type: "string", description: "شناسه جلسه" },
          search_query: { type: "string", description: "عبارت جستجو برای پیدا کردن جلسه" },
          updates: {
            type: "object",
            properties: {
              title: { type: "string" },
              date: { type: "string" },
              time: { type: "string" },
              location: { type: "string" }
            }
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "ایجاد وظیفه یا کار جدید",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان وظیفه" },
          description: { type: "string", description: "توضیحات وظیفه" },
          due_date: { type: "string", description: "موعد انجام (مثال: آخر هفته، ۱۴۰۳/۱۰/۲۰)" },
          priority: { 
            type: "string", 
            enum: ["low", "medium", "high", "urgent"],
            description: "اولویت: کم، متوسط، بالا، فوری" 
          },
          domain: {
            type: "string",
            enum: ["personal", "professional", "organizational"],
            description: "حوزه: شخصی، حرفه‌ای، سازمانی"
          }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_notification",
      description: "ارسال پیام یا اطلاع‌رسانی به شخص",
      parameters: {
        type: "object",
        properties: {
          recipient: { type: "string", description: "نام یا شماره گیرنده" },
          message: { type: "string", description: "متن پیام" },
          method: { 
            type: "string", 
            enum: ["sms", "email", "telegram"],
            description: "روش ارسال: پیامک، ایمیل، تلگرام" 
          }
        },
        required: ["recipient", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_calendar",
      description: "جستجوی رویدادها و قرارهای تقویم",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "عبارت جستجو" },
          date_from: { type: "string", description: "از تاریخ" },
          date_to: { type: "string", description: "تا تاریخ" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_contacts",
      description: "جستجوی مخاطبین",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "نام یا عبارت جستجو" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ask_clarification",
      description: "سوال از کاربر برای کسب اطلاعات بیشتر",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "سوال از کاربر" },
          options: { 
            type: "array", 
            items: { type: "string" },
            description: "گزینه‌های پیشنهادی برای پاسخ" 
          },
          field: { type: "string", description: "فیلدی که نیاز به اطلاعات دارد" }
        },
        required: ["question"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_reminder",
      description: "ایجاد یادآوری",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان یادآوری" },
          datetime: { type: "string", description: "زمان یادآوری" },
          repeat: { 
            type: "string", 
            enum: ["once", "daily", "weekly", "monthly"],
            description: "تکرار: یکبار، روزانه، هفتگی، ماهانه" 
          }
        },
        required: ["title", "datetime"]
      }
    }
  },
  // NEW TOOLS FOR ENHANCED FUNCTIONALITY
  {
    type: "function",
    function: {
      name: "save_journal_entry",
      description: "ذخیره دل‌نوشته، یادداشت شخصی یا خاطره",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "متن دل‌نوشته یا یادداشت" },
          mood: { 
            type: "string", 
            enum: ["happy", "sad", "calm", "anxious", "grateful", "motivated"],
            description: "حال و هوا: شاد، غمگین، آرام، نگران، شکرگزار، باانگیزه" 
          },
          tags: { 
            type: "array", 
            items: { type: "string" },
            description: "برچسب‌ها" 
          }
        },
        required: ["content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_gratitude",
      description: "ذخیره شکرگذاری روزانه - چیزهایی که امروز برایشان شکرگزارم",
      parameters: {
        type: "object",
        properties: {
          item_1: { type: "string", description: "اولین مورد شکرگذاری" },
          item_2: { type: "string", description: "دومین مورد شکرگذاری (اختیاری)" },
          item_3: { type: "string", description: "سومین مورد شکرگذاری (اختیاری)" },
          notes: { type: "string", description: "یادداشت اضافی" }
        },
        required: ["item_1"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_meeting_summary",
      description: "ذخیره خلاصه و صورتجلسه",
      parameters: {
        type: "object",
        properties: {
          meeting_title: { type: "string", description: "عنوان جلسه" },
          meeting_date: { type: "string", description: "تاریخ جلسه" },
          participants: { 
            type: "array", 
            items: { type: "string" },
            description: "شرکت‌کنندگان" 
          },
          summary: { type: "string", description: "خلاصه مذاکرات" },
          decisions: { 
            type: "array", 
            items: { type: "string" },
            description: "تصمیمات گرفته شده" 
          },
          action_items: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                task: { type: "string" },
                assignee: { type: "string" },
                deadline: { type: "string" }
              }
            },
            description: "اقدامات پیگیری" 
          }
        },
        required: ["meeting_title", "summary"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "process_attachment",
      description: "پردازش و تحلیل فایل ضمیمه شده (تصویر، PDF، اکسل)",
      parameters: {
        type: "object",
        properties: {
          file_content: { type: "string", description: "محتوای استخراج شده از فایل" },
          file_type: { 
            type: "string", 
            enum: ["image", "pdf", "excel", "csv", "audio"],
            description: "نوع فایل" 
          },
          action: {
            type: "string",
            enum: ["summarize", "analyze", "extract_data", "save"],
            description: "عملیات مورد نظر روی فایل"
          }
        },
        required: ["file_content", "file_type"]
      }
    }
  },
  // NEW: Contact extraction and creation tools
  {
    type: "function",
    function: {
      name: "create_contact",
      description: "ایجاد مخاطب جدید در لیست مخاطبین از اطلاعات استخراج شده (مثل کارت ویزیت)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "نام کامل مخاطب" },
          phone: { type: "string", description: "شماره تلفن یا موبایل" },
          email: { type: "string", description: "آدرس ایمیل" },
          organization: { type: "string", description: "نام شرکت یا سازمان" },
          role: { type: "string", description: "سمت یا نقش" },
          address: { type: "string", description: "آدرس" },
          notes: { type: "string", description: "یادداشت" }
        },
        required: ["name"]
      }
    }
  },
  // NEW: Meeting recording tool
  {
    type: "function",
    function: {
      name: "save_meeting_recording",
      description: "ذخیره ضبط صوتی جلسه به همراه رونویسی",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان ضبط" },
          transcript: { type: "string", description: "متن رونویسی شده" },
          meeting_date: { type: "string", description: "تاریخ جلسه" },
          participants: { 
            type: "array", 
            items: { type: "string" },
            description: "شرکت‌کنندگان" 
          },
          duration_minutes: { type: "number", description: "مدت زمان به دقیقه" },
          audio_url: { type: "string", description: "آدرس فایل صوتی" },
          linked_calendar_event_id: { type: "string", description: "شناسه رویداد تقویم مرتبط" }
        },
        required: ["title", "transcript"]
      }
    }
  },
  // NEW: Batch task creation
  {
    type: "function",
    function: {
      name: "create_tasks_batch",
      description: "ایجاد چندین وظیفه به صورت دسته‌ای از لیست استخراج شده",
      parameters: {
        type: "object",
        properties: {
          tasks: { 
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "عنوان وظیفه" },
                due_date: { type: "string", description: "موعد انجام" },
                priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                assignee: { type: "string", description: "مسئول انجام" }
              },
              required: ["title"]
            },
            description: "لیست وظایف"
          },
          domain: {
            type: "string",
            enum: ["personal", "professional", "organizational"],
            description: "حوزه: شخصی، حرفه‌ای، سازمانی"
          }
        },
        required: ["tasks"]
      }
    }
  },
  // NEW: Request missing information
  {
    type: "function",
    function: {
      name: "request_missing_info",
      description: "درخواست اطلاعات ناقص از کاربر برای تکمیل داده",
      parameters: {
        type: "object",
        properties: {
          data_type: { 
            type: "string", 
            enum: ["contact", "meeting", "task", "recording"],
            description: "نوع داده" 
          },
          extracted_data: { 
            type: "object",
            description: "داده‌های استخراج شده تاکنون"
          },
          missing_fields: { 
            type: "array",
            items: { type: "string" },
            description: "فیلدهای ناقص" 
          },
          suggestions: { 
            type: "object",
            description: "پیشنهادات برای هر فیلد"
          }
        },
        required: ["data_type", "missing_fields"]
      }
    }
  },
  // NEW: Import contacts from Excel
  {
    type: "function",
    function: {
      name: "import_contacts_batch",
      description: "وارد کردن دسته‌ای مخاطبین از فایل اکسل یا CSV",
      parameters: {
        type: "object",
        properties: {
          contacts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                organization: { type: "string" },
                role: { type: "string" }
              },
              required: ["name"]
            },
            description: "لیست مخاطبین"
          },
          skip_duplicates: { type: "boolean", description: "رد کردن موارد تکراری" }
        },
        required: ["contacts"]
      }
    }
  },
  // Save for later - Cultural content (books, movies, podcasts)
  {
    type: "function",
    function: {
      name: "save_for_later",
      description: "ذخیره محتوای فرهنگی (کتاب، فیلم، پادکست، ویدیو) در مدیریت محتوای فرهنگی",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان محتوا، کتاب یا فیلم" },
          content: { type: "string", description: "توضیحات، خلاصه یا نقد" },
          source_url: { type: "string", description: "آدرس لینک یا منبع (اختیاری)" },
          category: { 
            type: "string", 
            enum: ["book", "movie", "series", "youtube", "podcast", "audiobook", "theater"],
            description: "دسته‌بندی: کتاب، فیلم، سریال، یوتیوب، پادکست، کتاب صوتی، تئاتر" 
          },
          tags: { 
            type: "array", 
            items: { type: "string" },
            description: "برچسب‌ها" 
          }
        },
        required: ["title"]
      }
    }
  },
  // NEW: Save knowledge - for Knowledge Management (notes, research, articles)
  {
    type: "function",
    function: {
      name: "save_knowledge",
      description: "ذخیره دانش، یادداشت تخصصی، نکته علمی یا مقاله در مدیریت دانش",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان یادداشت یا مقاله" },
          content: { type: "string", description: "محتوای کامل" },
          category: { 
            type: "string", 
            enum: ["مقالات", "نکات", "آموزشی", "تحقیقاتی", "یادداشت", "صورتجلسات"],
            description: "دسته‌بندی دانش" 
          },
          tags: { 
            type: "array", 
            items: { type: "string" },
            description: "برچسب‌ها" 
          }
        },
        required: ["title", "content"]
      }
    }
  },
  // ============ NEW DOMAIN TOOLS ============
  // Health - ثبت اطلاعات سلامت
  {
    type: "function",
    function: {
      name: "save_health_metrics",
      description: "ثبت اطلاعات سلامت روزانه (وزن، فشار خون، خواب، ورزش، آب)",
      parameters: {
        type: "object",
        properties: {
          weight: { type: "number", description: "وزن به کیلوگرم" },
          blood_pressure: { type: "string", description: "فشار خون (مثال: ۱۲۰/۸۰)" },
          heart_rate: { type: "number", description: "ضربان قلب" },
          sleep_hours: { type: "number", description: "ساعات خواب" },
          exercise_minutes: { type: "number", description: "دقیقه ورزش" },
          water_intake: { type: "number", description: "لیوان آب" },
          notes: { type: "string", description: "یادداشت" }
        }
      }
    }
  },
  // Resume - اضافه کردن به رزومه
  {
    type: "function",
    function: {
      name: "add_resume_item",
      description: "اضافه کردن آیتم به رزومه (تحصیلات، سوابق کاری، مهارت، گواهینامه)",
      parameters: {
        type: "object",
        properties: {
          section: { 
            type: "string", 
            enum: ["education", "work", "skills", "certificates", "awards", "affiliations"],
            description: "بخش رزومه: تحصیلات، سوابق کاری، مهارت‌ها، گواهینامه‌ها، افتخارات، عضویت‌ها" 
          },
          title: { type: "string", description: "عنوان (مثال: کارشناسی، مدیر پروژه، PMP)" },
          organization: { type: "string", description: "سازمان/دانشگاه/موسسه صادرکننده" },
          start_date: { type: "string", description: "تاریخ شروع" },
          end_date: { type: "string", description: "تاریخ پایان (یا «تاکنون»)" },
          description: { type: "string", description: "توضیحات تکمیلی" },
          location: { type: "string", description: "محل (شهر/کشور)" }
        },
        required: ["section", "title"]
      }
    }
  },
  // CSR Project - پروژه مسئولیت اجتماعی
  {
    type: "function",
    function: {
      name: "create_csr_project",
      description: "ایجاد پروژه مسئولیت اجتماعی (خیریه، محیط زیست، آموزش، سلامت)",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان پروژه" },
          description: { type: "string", description: "توضیحات پروژه" },
          type: { 
            type: "string", 
            enum: ["charity", "environmental", "educational", "health", "community"],
            description: "نوع: خیریه، محیط‌زیستی، آموزشی، سلامت، اجتماعی" 
          },
          budget: { type: "number", description: "بودجه (تومان)" },
          start_date: { type: "string", description: "تاریخ شروع" },
          end_date: { type: "string", description: "تاریخ پایان" },
          beneficiaries: { 
            type: "array", 
            items: { type: "string" },
            description: "ذی‌نفعان (مثال: کودکان، سالمندان)" 
          },
          partners: { 
            type: "array", 
            items: { type: "string" },
            description: "شرکای همکار" 
          }
        },
        required: ["title"]
      }
    }
  },
  // Idea - ذخیره ایده
  {
    type: "function",
    function: {
      name: "save_idea",
      description: "ذخیره ایده جدید در بانک ایده‌ها",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان ایده" },
          description: { type: "string", description: "توضیحات کامل ایده" },
          category: { 
            type: "string", 
            enum: ["business", "product", "process", "marketing", "technology", "personal"],
            description: "دسته‌بندی: کسب‌وکار، محصول، فرآیند، بازاریابی، فناوری، شخصی" 
          },
          domain: { 
            type: "string", 
            enum: ["personal", "professional", "organizational"],
            description: "حوزه: شخصی، حرفه‌ای، سازمانی" 
          },
          tags: { 
            type: "array", 
            items: { type: "string" },
            description: "برچسب‌ها" 
          },
          priority: { 
            type: "string", 
            enum: ["low", "medium", "high"],
            description: "اولویت" 
          }
        },
        required: ["title", "description"]
      }
    }
  },
  // Pending Tasks - وظایف معوق
  {
    type: "function",
    function: {
      name: "get_pending_tasks",
      description: "دریافت لیست کارهای در انتظار، امروز، و عقب‌افتاده",
      parameters: {
        type: "object",
        properties: {
          domain: { 
            type: "string", 
            enum: ["personal", "professional", "organizational", "all"],
            description: "حوزه: شخصی، حرفه‌ای، سازمانی، همه" 
          },
          include_overdue: { type: "boolean", description: "شامل معوق‌ها باشد؟" },
          days_ahead: { type: "number", description: "چند روز آینده؟ (پیش‌فرض: ۷)" }
        }
      }
    }
  },
  // Habit tracking - ثبت عادت
  {
    type: "function",
    function: {
      name: "complete_habit",
      description: "ثبت انجام عادت روزانه",
      parameters: {
        type: "object",
        properties: {
          habit_name: { type: "string", description: "نام عادت" },
          notes: { type: "string", description: "یادداشت اختیاری" }
        },
        required: ["habit_name"]
      }
    }
  },
  // ============ LEGAL & ORGANIZATION TOOLS ============
  // Legal - ثبت پرونده حقوقی
  {
    type: "function",
    function: {
      name: "create_legal_case",
      description: "ایجاد پرونده حقوقی جدید",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان پرونده" },
          case_number: { type: "string", description: "شماره پرونده" },
          case_type: { 
            type: "string", 
            enum: ["civil", "criminal", "administrative", "family", "commercial"],
            description: "نوع پرونده: حقوقی، کیفری، اداری، خانواده، تجاری" 
          },
          court: { type: "string", description: "نام دادگاه/شعبه" },
          opposing_party: { type: "string", description: "طرف مقابل" },
          description: { type: "string", description: "شرح پرونده" },
          next_hearing_date: { type: "string", description: "تاریخ جلسه بعدی" }
        },
        required: ["title"]
      }
    }
  },
  // Lawyer Note - یادداشت حقوقی
  {
    type: "function",
    function: {
      name: "save_lawyer_note",
      description: "ذخیره یادداشت حقوقی برای پرونده",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان یادداشت" },
          content: { type: "string", description: "متن یادداشت" },
          case_title: { type: "string", description: "عنوان پرونده مرتبط (اختیاری)" },
          category: { 
            type: "string", 
            enum: ["meeting-prep", "follow-up", "important", "reminder", "general"],
            description: "دسته‌بندی" 
          }
        },
        required: ["title", "content"]
      }
    }
  },
  // Organization Planning - ماموریت سازمانی
  {
    type: "function",
    function: {
      name: "create_organization_mission",
      description: "ایجاد ماموریت سازمانی یا وظیفه سازمانی",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان ماموریت" },
          description: { type: "string", description: "شرح ماموریت" },
          priority: { 
            type: "string", 
            enum: ["low", "medium", "high", "urgent"],
            description: "اولویت" 
          },
          due_date: { type: "string", description: "موعد انجام" }
        },
        required: ["title"]
      }
    }
  }
];
const SYSTEM_PROMPT = `###### قانون مطلق زبان (اولویت صفر - غیرقابل نقض) ######
تمام پاسخ‌های تو باید فقط به زبان فارسی باشد. این قانون استثناپذیر نیست:
✗ هیچ کلمه انگلیسی در پاسخت استفاده نکن
✗ حتی اگر کاربر به انگلیسی نوشت، فارسی جواب بده
✗ نام توابع داخلی هستند و کاربر آنها را نمی‌بیند
✓ همیشه ۱۰۰٪ فارسی بنویس

مثال صحیح:
- ✅ "کتاب در لیست مطالعه ذخیره شد"
- ✅ "قرار برای فردا ساعت ۱۴ تنظیم شد"
- ❌ "I saved the book" (نادرست!)
- ❌ "Meeting scheduled" (نادرست!)

##################################################

تو یک دستیار هوشمند اجرایی به نام «مورا» هستی که به مدیران و افراد حرفه‌ای کمک می‌کنی.

🎯 وظایف تو:
1. درک دستورات زبان طبیعی فارسی
2. تشخیص و اجرای اقداماتی که باید انجام شود
3. پرسیدن سوالات ضروری برای تکمیل اطلاعات
4. ارائه بازخورد دقیق به فارسی درباره محل ذخیره‌سازی

📋 قوانین مهم:
- همیشه مختصر و مفید صحبت کن
- از ابزارهای موجود برای انجام کارها استفاده کن
- بعد از هر عملیات، نتیجه را به فارسی اعلام کن

📍 قوانین بازخورد (مهم):
بعد از هر اقدام، حتماً این اطلاعات را به فارسی بگو:
- قرار/جلسه → "✅ در تقویم حرفه‌ای ثبت شد - [تاریخ و ساعت]"
- وظیفه → "✅ در لیست وظایف [حوزه] اضافه شد - موعد: [تاریخ]"
- مخاطب → "✅ در لیست مخاطبین حرفه‌ای ذخیره شد"
- دل‌نوشته → "✅ دل‌نوشته در مدیریت دانش > دل‌نوشته ذخیره شد 📝"
- شکرگذاری → "✅ در بخش شکرگذاری امروز ثبت شد"
- خلاصه جلسه → "✅ صورتجلسه «[عنوان]» ذخیره شد"
- ضبط جلسه → "✅ ضبط صوتی در آرشیو جلسات ذخیره شد"
- یادآوری → "✅ یادآوری تنظیم شد - [زمان]"
- ذخیره برای بعد → "✅ «[عنوان]» در مدیریت محتوای فرهنگی ذخیره شد 📚"
- پرونده حقوقی → "✅ پرونده حقوقی «[عنوان]» در بخش امور حقوقی ایجاد شد ⚖️"
- یادداشت حقوقی → "✅ یادداشت حقوقی «[عنوان]» در مدیریت دانش ذخیره شد ⚖️"
- ماموریت سازمانی → "✅ ماموریت «[عنوان]» در برنامه‌ریزی سازمانی ایجاد شد 🎯"

🔚 در پایان هر پاسخ بپرس: "کار دیگری هست؟"

📝 دل‌نوشته‌ها - حالت ایجنت (بسیار مهم):
وقتی کاربر می‌خواهد دل‌نوشته، شعر، خاطره یا خواب ثبت کند، قبل از ذخیره حتماً این سوالات را بپرس:

مرحله ۱: از ask_clarification استفاده کن برای نوع نوشته:
{
  "question": "چه نوع نوشته‌ای را می‌خواهید ثبت کنید؟",
  "options": ["دل‌نوشته 📝", "شعر 🎭", "خاطره 📸", "خواب 💭", "یادداشت 📋"],
  "field": "type"
}

مرحله ۲: بپرس احساس چیست:
{
  "question": "احساس شما در این لحظه چیست؟",
  "options": ["شاد 😊", "غمگین 😢", "آرام 😌", "خنثی 😐", "امیدوار 🌟", "نگران 😰"],
  "field": "mood"
}

مرحله ۳: بپرس آیا ضمیمه دارد:
{
  "question": "آیا فایل ضمیمه‌ای دارید؟",
  "options": ["بله، تصویر 🖼️", "بله، صوت 🎤", "خیر، ادامه بده ✅"],
  "field": "attachment"
}

مرحله ۴: بعد از گرفتن جواب‌ها، save_journal_entry را اجرا کن با:
- content: متن دل‌نوشته
- mood: احساس انتخاب شده
- tags: [نوع نوشته انتخاب شده، احساس]

❗ مهم: اگر کاربر مستقیماً نوع و احساس را در پیام گفت (مثلاً "دل‌نوشته شاد امروز...")، نیازی به پرسیدن نیست و مستقیماً ذخیره کن.

🤖 حالت ایجنت کامل برای همه بخش‌ها (بسیار مهم):
قانون کلی: اگر کاربر تمام اطلاعات لازم را در یک پیام داد، نیازی به سوال نیست و مستقیم ذخیره کن.
اما اگر اطلاعات ناقص بود، مرحله‌ای سوال بپرس:

❤️ سلامت (save_health_metrics):
وقتی کاربر اطلاعات سلامت می‌دهد، اعداد را دقیق استخراج کن:
- "۳۰ دقیقه دویدم" → exercise_minutes: 30
- "۸ ساعت خوابیدم" → sleep_hours: 8
- "وزنم ۷۵ کیلو" → weight: 75
- "فشارم ۱۲۰ روی ۸۰" → blood_pressure: "120/80"
- "۶ لیوان آب خوردم" → water_intake: 6
- "ضربان قلبم ۸۰" → heart_rate: 80
اگر فقط گفت "سلامتم رو ثبت کن" بدون جزئیات:
مرحله ۱: ask_clarification: "چه اطلاعاتی ثبت کنم؟" options: ["ورزش 🏋️", "خواب 😴", "وزن ⚖️", "فشار خون 🩺", "آب 💧", "همه موارد 📋"]
مرحله ۲: مقدار دقیق بپرس
مرحله ۳: save_health_metrics

🙏 شکرگذاری (save_gratitude):
اگر فقط گفت "شکرگذاری ثبت کن":
مرحله ۱: ask_clarification: "اولین مورد شکرگذاری امروز چیست؟"
مرحله ۲: "آیا مورد دوم یا سوم هم دارید؟" options: ["بله، ادامه بده ✍️", "خیر، همین کافیه ✅"]
مرحله ۳: save_gratitude

📅 جلسه (create_meeting):
اگر فقط گفت "یه جلسه بذار":
مرحله ۱: ask_clarification: "عنوان و تاریخ جلسه چیست؟"
مرحله ۲: ask_clarification: "ساعت چند؟" options: ["۹ صبح", "۱۰ صبح", "۱۱ صبح", "۲ بعدازظهر", "ساعت دیگر"]
مرحله ۳: ask_clarification: "مکان جلسه؟" options: ["آنلاین 💻", "دفتر 🏢", "خارج از شرکت 🏪"]
مرحله ۴: create_meeting + پیشنهاد اطلاع‌رسانی

✅ وظیفه (create_task):
اگر اطلاعات ناقص بود:
مرحله ۱: ask_clarification: "حوزه وظیفه چیست؟" options: ["شخصی 🏠", "حرفه‌ای 💼", "سازمانی 🏢"]
مرحله ۲: ask_clarification: "اولویت؟" options: ["کم", "متوسط", "بالا", "فوری 🔴"]
مرحله ۳: ask_clarification: "موعد انجام چه زمانی؟" options: ["امروز", "فردا", "آخر هفته", "تاریخ دیگر"]
مرحله ۴: create_task

💡 ایده (save_idea):
اگر فقط گفت "یه ایده دارم":
مرحله ۱: بپرس ایده چیست
مرحله ۲: ask_clarification: "دسته‌بندی؟" options: ["کسب‌وکار 💰", "محصول 📦", "فناوری 💻", "شخصی 🌟"]
مرحله ۳: ask_clarification: "اولویت؟" options: ["کم", "متوسط", "بالا"]
مرحله ۴: save_idea

⚖️ پرونده حقوقی (create_legal_case):
مرحله ۱: ask_clarification: "نوع پرونده؟" options: ["حقوقی ⚖️", "کیفری 🔨", "خانواده 👨‍👩‍👧", "تجاری 📊", "اداری 🏛️"]
مرحله ۲: "نام دادگاه یا شعبه؟"
مرحله ۳: "طرف مقابل و تاریخ جلسه؟"
مرحله ۴: create_legal_case

📇 مخاطب (create_contact):
اگر فقط گفت "مخاطب ذخیره کن":
مرحله ۱: "نام و نام خانوادگی؟"
مرحله ۲: ask_clarification: "شماره تلفن؟"
مرحله ۳: ask_clarification: "ایمیل؟" options: ["ندارم ❌", "وارد کن ✉️"]
مرحله ۴: ask_clarification: "شرکت یا سازمان؟" options: ["ندارد", "وارد کن 🏢"]
مرحله ۵: create_contact

📄 رزومه (add_resume_item):
مرحله ۱: ask_clarification: "کدام بخش رزومه؟" options: ["تحصیلات 🎓", "سوابق کاری 💼", "مهارت 🛠️", "گواهینامه 📜"]
مرحله ۲: جزئیات مرتبط بپرس
مرحله ۳: add_resume_item

🌱 مسئولیت اجتماعی (create_csr_project):
مرحله ۱: ask_clarification: "نوع پروژه؟" options: ["خیریه ❤️", "محیط زیست 🌱", "آموزشی 📚", "سلامت 🏥"]
مرحله ۲: "بودجه و زمان‌بندی؟"
مرحله ۳: create_csr_project

🔔 پرسش هوشمند برای اطلاع‌رسانی (مهم):
وقتی قراری با شخص ایجاد می‌کنی، بعد از ثبت قرار حتماً بپرس:
"آیا به [نام شخص] اطلاع بدهم؟
📧 ایمیل | 📱 پیامک | ✈️ تلگرام | ❌ خیر"

اگر کاربر روش اطلاع‌رسانی را انتخاب کرد:
- شماره تلفن/ایمیل/آیدی تلگرام را بپرس (اگر نداری)
- از send_notification استفاده کن

⏰ تبدیل زمان:
- "فردا" = تاریخ فردا
- "امروز ساعت ۲" = همان روز ۱۴:۰۰
- "آخر هفته" = پنجشنبه یا جمعه
- "هفته آینده" = ۷ روز بعد

🔄 برای دستورات چند قسمتی:
مثال: "قرار ساعت ۲ فردا کنسل شد، به جاش قرار با احمدی بذار"
1. ابتدا قرار فعلی را پیدا و کنسل کن
2. سوال کن: قرار جدید چه ساعتی باشد؟
3. قرار جدید را ایجاد کن

📎 پردازش فایل (مهم):
وقتی فایلی ضمیمه شد:

🖼️ تصویر/کارت ویزیت:
- اطلاعات مخاطب (نام، شماره، ایمیل، شرکت، سمت) را استخراج کن
- از create_contact استفاده کن
- اگر سمت مشخص نیست، بپرس

🎤 فایل صوتی:
- رونویسی را تحلیل کن
- اگر صورتجلسه است: save_meeting_summary
- اگر ضبط جلسه است: save_meeting_recording
- اقدامات پیگیری را استخراج و به وظیفه تبدیل کن (create_tasks_batch)

📊 اکسل/CSV:
- ستون‌ها را بررسی کن
- اگر لیست مخاطبین است: import_contacts_batch
- اگر لیست وظایف است: create_tasks_batch

💭 تشخیص نوع محتوا:
- اگر کاربر از احساسات یا تجربیات شخصی صحبت کرد → save_journal_entry
- اگر از شکرگذاری یا قدردانی صحبت کرد → save_gratitude
- اگر خلاصه جلسه داد → save_meeting_summary
- اگر قرار خواست → create_meeting (و بپرس آیا اطلاع‌رسانی کنی)
- اگر تصویر کارت ویزیت فرستاد → create_contact

📚 تفکیک مدیریت محتوا و مدیریت دانش (بسیار مهم):

🎬 مدیریت محتوای فرهنگی (save_for_later):
- کتاب، فیلم، سریال، پادکست، کتاب صوتی، تئاتر
- "این کتاب رو بذار برام"، "فیلم X رو ذخیره کن"، "پادکست Y"
- مثال: "کتاب اثر مرکب رو اضافه کن" → save_for_later (category: book)

🧠 مدیریت دانش (save_knowledge):
- یادداشت تخصصی، نکته علمی، مقاله، تحقیق
- "این نکته رو ذخیره کن"، "یادداشت کن که..."، "یه مقاله درباره..."
- مثال: "یادداشت کن: نکته مهم درباره مذاکره" → save_knowledge

🧠 تشخیص هوشمند محل ذخیره (مهم):
براساس کلمات کلیدی تشخیص بده کجا ذخیره شود:

❤️ سلامت و بهره‌وری (save_health_metrics):
- "وزنم"، "فشار خونم"، "ضربان قلب"، "امشب خوابیدم"، "ورزش کردم"
- "آب خوردم"، "پیاده‌روی"، "دویدم"، "باشگاه رفتم"
- مثال: "امروز ۳۰ دقیقه ورزش کردم" → save_health_metrics

📋 رزومه حرفه‌ای (add_resume_item):
- "گواهینامه گرفتم"، "دوره گذراندم"، "مدرک گرفتم"، "سابقه کاری"
- "تحصیلات"، "مهارت جدید"، "کارگاه"، "دانشگاه"، "شرکت X کار کردم"
- مثال: "گواهینامه PMP گرفتم" → add_resume_item (section: certificates)

🌱 مسئولیت اجتماعی (create_csr_project):
- "خیریه"، "کمک"، "محیط زیست"، "داوطلبانه"، "پروژه اجتماعی"
- "درخت‌کاری"، "نیکوکاری"، "کمک به نیازمندان"
- مثال: "می‌خوام یه پروژه خیریه راه بندازم" → create_csr_project

💡 بانک ایده‌ها (save_idea):
- "یه ایده دارم"، "به ذهنم رسید"، "پیشنهاد می‌کنم"، "طرح جدید"
- "چه می‌شد اگر..."، "فکر کردم که..."
- مثال: "یه ایده برای اپلیکیشن دارم" → save_idea

📊 وضعیت کارها (get_pending_tasks):
- "چه کارهایی دارم؟"، "کارهای عقب‌افتاده"، "وظایف امروز"
- "چی عقب افتاده؟"، "لیست کارها"
- مثال: "کارهای امروزم چیه؟" → get_pending_tasks

🏋️ ثبت عادت (complete_habit):
- "امروز [عادت] انجام دادم"، "مدیتیشن کردم"، "کتاب خوندم"
- مثال: "امروز مدیتیشن کردم" → complete_habit

📍 بازخورد دقیق بعد از ذخیره:
- سلامت → "✅ در سلامت و بهره‌وری ثبت شد 🏃"
- رزومه → "✅ در رزومه حرفه‌ای > [بخش] اضافه شد 📄"
- CSR → "✅ در مسئولیت اجتماعی ثبت شد 🌱"
- ایده → "✅ در بانک ایده‌ها ذخیره شد 💡"
- عادت → "✅ عادت [نام] برای امروز ثبت شد ✔️"
- محتوای فرهنگی → "✅ در مدیریت محتوای فرهنگی ذخیره شد 📚"
- دانش → "✅ در مدیریت دانش ذخیره شد 🧠"

⚠️ مدیریت تداخل زمانی و ثبت تکراری (بسیار مهم):
- اگر نتیجه اجرای create_meeting خطای TIME_CONFLICT برگرداند:
  → به کاربر بگو: "⚠️ تداخل زمانی! در این ساعت قرار [نام قرار] دارید."
  → ساعت‌های جایگزین پیشنهاد بده: "ساعت‌های پیشنهادی: [۱ ساعت بعد] | [۲ ساعت بعد] | [فردا همان ساعت]"
- اگر خطای DUPLICATE برگرداند:
  → بگو: "⚠️ این قرار قبلاً ثبت شده. آیا می‌خواهید تغییرش بدهید؟"
- بعد از ثبت موفق قرار:
  → بگو: "✅ ثبت شد. یادآوری: [تاریخ] ساعت [ساعت] قرار [عنوان] دارید 📅"

همیشه اول مطمئن شو چه کاری باید انجام شود، سپس با استفاده از ابزار مناسب اجرا کن.
یادت باشد: حتماً به فارسی پاسخ بده!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY && !liaraEnabled()) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { message, conversationHistory = [], context = {}, attachment = null } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "پیام معتبر نیست" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages array with history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
    ];

    // Add context to system prompt
    let contextInfo = "";
    if (context.currentDate) {
      contextInfo += `\n📅 تاریخ امروز: ${context.currentDate}`;
    }
    if (context.currentTime) {
      contextInfo += `\n⏰ ساعت فعلی: ${context.currentTime}`;
    }
    
    if (contextInfo) {
      messages[0].content += contextInfo;
    }

    // Build user message with attachment info if present
    let userContent = message;
    if (attachment) {
      userContent = `[فایل ضمیمه: ${attachment.fileName} (${attachment.type})]
محتوای استخراج شده:
${attachment.content?.substring(0, 2000) || 'محتوایی استخراج نشد'}
${attachment.content?.length > 2000 ? '...(ادامه دارد)' : ''}

درخواست کاربر: ${message}`;
    }

    messages.push({ role: "user", content: userContent });

    // Call AI with tool calling
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: ASSISTANT_TOOLS,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "محدودیت تعداد درخواست. لطفاً کمی صبر کنید." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "اعتبار کافی نیست. لطفاً اعتبار خود را شارژ کنید." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("خطا در ارتباط با هوش مصنوعی");
    }

    const aiResponse = await response.json();
    const choice = aiResponse.choices?.[0];

    if (!choice) {
      throw new Error("پاسخی از هوش مصنوعی دریافت نشد");
    }

    // Process response
    const result: {
      message: string;
      actions: Array<{
        type: string;
        function: string;
        params: Record<string, unknown>;
        status: 'pending' | 'needs_confirmation' | 'needs_info';
        feedback?: {
          location: string;
          details: string;
        };
      }>;
      questions: Array<{
        question: string;
        options?: string[];
        field?: string;
      }>;
    } = {
      message: "",
      actions: [],
      questions: [],
    };

    // Check for tool calls
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        const functionName = toolCall.function.name;
        let params = {};
        
        try {
          params = JSON.parse(toolCall.function.arguments || "{}");
        } catch (e) {
          console.error("Failed to parse tool arguments:", e);
        }

        if (functionName === "ask_clarification") {
          // This is a question, not an action
          result.questions.push({
            question: (params as any).question || "",
            options: (params as any).options,
            field: (params as any).field,
          });
        } else {
          // Generate feedback based on action type
          const feedback = generateActionFeedback(functionName, params);
          
          // Determine status based on action type
          // Safe actions: auto-execute (pending)
          // Sensitive actions: require confirmation
          const safeActions = [
            'create_meeting', 'create_task', 'create_reminder',
            'save_for_later', 'save_journal_entry', 'save_gratitude',
            'create_contact', 'save_meeting_summary', 'save_meeting_recording',
            'create_tasks_batch', 'import_contacts_batch',
            // NEW safe actions
            'save_health_metrics', 'add_resume_item', 'create_csr_project',
            'save_idea', 'get_pending_tasks', 'complete_habit'
          ];
          
          const actionStatus = safeActions.includes(functionName) 
            ? 'pending'  // Auto-execute
            : 'needs_confirmation';  // Needs user confirmation
          
          // This is an action to execute
          result.actions.push({
            type: "action",
            function: functionName,
            params,
            status: actionStatus,
            feedback,
          });
        }
      }
    }

    // Get text response
    result.message = choice.message?.content || "";

    // If no text but has actions, generate Persian summary
    if (!result.message && (result.actions.length > 0 || result.questions.length > 0)) {
      if (result.actions.length > 0) {
        // List of safe actions for status check
        const safeActionsList = [
          'create_meeting', 'create_task', 'create_reminder',
          'save_for_later', 'save_journal_entry', 'save_gratitude',
          'create_contact', 'save_meeting_summary', 'save_meeting_recording',
          'create_tasks_batch', 'import_contacts_batch',
          // NEW safe actions
          'save_health_metrics', 'add_resume_item', 'create_csr_project',
          'save_idea', 'get_pending_tasks', 'complete_habit'
        ];
        
        // Separate auto-executed and pending actions
        const autoActions = result.actions.filter(a => safeActionsList.includes(a.function));
        const pendingActions = result.actions.filter(a => !safeActionsList.includes(a.function));
        
        if (autoActions.length > 0 && pendingActions.length === 0) {
          // All actions are safe - will be auto-executed
          // Generate clear Persian message indicating completion
          if (autoActions.length === 1) {
            const action = autoActions[0];
            const desc = getActionDescription(action.function, action.params);
            result.message = `${desc}\n\nانجام شد! ✅`;
          } else {
            const descriptions = autoActions.map((a, i) => 
              `${i + 1}. ${getActionDescription(a.function, a.params)}`
            );
            result.message = `انجام شد! 🎉\n${descriptions.join("\n")}`;
          }
        } else if (autoActions.length > 0 && pendingActions.length > 0) {
          // Mix of auto and pending
          const autoDescs = autoActions.map((a, i) => 
            `${i + 1}. ✅ ${getActionDescription(a.function, a.params)}`
          );
          const pendingDescs = pendingActions.map((a, i) => 
            `${i + 1}. ⏳ ${getActionDescription(a.function, a.params)}`
          );
          result.message = `این کارها انجام شد:\n${autoDescs.join("\n")}\n\nاین موارد نیاز به تأیید شما دارند:\n${pendingDescs.join("\n")}`;
        } else {
          // All actions need confirmation
          const descriptions = result.actions.map((a, i) => 
            `${i + 1}. ⏳ ${getActionDescription(a.function, a.params)}`
          );
          result.message = `متوجه شدم! این کارها نیاز به تأیید شما دارند:\n${descriptions.join("\n")}`;
        }
      }
      
      if (result.questions.length > 0) {
        result.message += result.message ? "\n\n" : "";
        result.message += "❓ چند سوال دارم:\n" + result.questions.map(q => `• ${q.question}`).join("\n");
      }
    }

    // Append "کار دیگری هست؟" if there's a response and it doesn't already end with it
    if (result.message && !result.message.includes("کار دیگری هست")) {
      result.message += "\n\n💬 کار دیگری هست؟";
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Smart assistant error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "خطای ناشناخته",
        message: "متأسفانه مشکلی پیش آمد. لطفاً دوباره تلاش کنید.\n\n💬 کار دیگری هست؟",
        actions: [],
        questions: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Generate feedback information for an action
 */
function generateActionFeedback(functionName: string, params: any): { location: string; details: string } {
  switch (functionName) {
    case 'create_meeting':
      return {
        location: 'تقویم حرفه‌ای',
        details: `قرار "${params.title || ''}" - ${params.date || ''} ${params.time || ''}`
      };
    case 'cancel_meeting':
      return {
        location: 'تقویم حرفه‌ای',
        details: 'قرار لغو خواهد شد'
      };
    case 'create_task':
      const taskDomain = params.domain === 'personal' ? 'شخصی' : 
                     params.domain === 'professional' ? 'حرفه‌ای' : 'سازمانی';
      return {
        location: `لیست وظایف ${taskDomain}`,
        details: `وظیفه "${params.title || ''}" - موعد: ${params.due_date || 'نامشخص'}`
      };
    case 'create_reminder':
      return {
        location: 'یادآورها',
        details: `یادآوری "${params.title || ''}" - ${params.datetime || ''}`
      };
    case 'save_journal_entry':
      return {
        location: 'دفتر خاطرات شخصی',
        details: 'دل‌نوشته ذخیره خواهد شد'
      };
    case 'save_gratitude':
      return {
        location: 'بخش شکرگذاری روزانه',
        details: 'شکرگذاری امروز ثبت خواهد شد'
      };
    case 'save_meeting_summary':
      return {
        location: 'صورتجلسات حرفه‌ای',
        details: `صورتجلسه "${params.meeting_title || ''}"`
      };
    case 'send_notification':
      return {
        location: 'پیام‌رسانی',
        details: `پیام به ${params.recipient || ''}`
      };
    // NEW action feedbacks
    case 'create_contact':
      return {
        location: 'لیست مخاطبین حرفه‌ای',
        details: `مخاطب "${params.name || ''}" - ${params.organization || ''}`
      };
    case 'save_meeting_recording':
      return {
        location: 'آرشیو ضبط جلسات',
        details: `ضبط "${params.title || ''}" - ${params.duration_minutes || 0} دقیقه`
      };
    case 'create_tasks_batch':
      return {
        location: 'لیست وظایف',
        details: `${(params.tasks || []).length} وظیفه جدید`
      };
    case 'import_contacts_batch':
      return {
        location: 'لیست مخاطبین حرفه‌ای',
        details: `${(params.contacts || []).length} مخاطب جدید`
      };
    case 'request_missing_info':
      return {
        location: 'درخواست اطلاعات',
        details: `نوع: ${params.data_type || ''}`
      };
    // NEW action feedbacks
    case 'save_health_metrics':
      return {
        location: 'سلامت و بهره‌وری',
        details: `${params.exercise_minutes ? `ورزش: ${params.exercise_minutes} دقیقه` : ''} ${params.sleep_hours ? `خواب: ${params.sleep_hours} ساعت` : ''} ${params.weight ? `وزن: ${params.weight}` : ''}`.trim() || 'اطلاعات سلامت'
      };
    case 'add_resume_item': {
      const sectionMap: Record<string, string> = {
        'education': 'تحصیلات', 'work': 'سوابق کاری', 'skills': 'مهارت‌ها',
        'certificates': 'گواهینامه‌ها', 'awards': 'افتخارات', 'affiliations': 'عضویت‌ها'
      };
      return {
        location: `رزومه حرفه‌ای > ${sectionMap[params.section] || params.section}`,
        details: `${params.title || ''} ${params.organization ? `- ${params.organization}` : ''}`.trim()
      };
    }
    case 'create_csr_project': {
      const typeMap: Record<string, string> = {
        'charity': 'خیریه', 'environmental': 'محیط‌زیستی', 'educational': 'آموزشی',
        'health': 'سلامت', 'community': 'اجتماعی'
      };
      return {
        location: 'مسئولیت اجتماعی',
        details: `پروژه "${params.title || ''}" - ${typeMap[params.type] || params.type || 'عمومی'}`
      };
    }
    case 'save_idea':
      return {
        location: 'بانک ایده‌ها',
        details: `ایده "${params.title || ''}" - ${params.category || 'عمومی'}`
      };
    case 'get_pending_tasks':
      return {
        location: 'وضعیت وظایف',
        details: `حوزه: ${params.domain === 'all' ? 'همه' : params.domain || 'همه'}`
      };
    case 'complete_habit':
      return {
        location: 'عادت‌ها',
        details: `عادت "${params.habit_name || ''}" انجام شد`
      };
    default:
      return {
        location: 'سیستم',
        details: functionName
      };
  }
}

/**
 * Get human-readable description for an action
 */
function getActionDescription(functionName: string, params: any): string {
  switch (functionName) {
    case 'create_meeting':
      return `📅 ایجاد قرار: «${params.title || 'بدون عنوان'}» ${params.date || ''} ${params.time || ''}`.trim();
    case 'cancel_meeting':
      return '❌ لغو قرار';
    case 'update_meeting':
      return '✏️ ویرایش قرار';
    case 'create_task': {
      const domainLabel = params.domain === 'personal' ? 'شخصی' : 
                         params.domain === 'professional' ? 'حرفه‌ای' : 'سازمانی';
      return `✅ ایجاد وظیفه ${domainLabel}: «${params.title || 'بدون عنوان'}»`;
    }
    case 'create_reminder':
      return `🔔 ایجاد یادآوری: «${params.title || 'بدون عنوان'}» - ${params.datetime || ''}`;
    case 'send_notification':
      return `📨 ارسال پیام به ${params.recipient || ''}`;
    case 'save_journal_entry':
      return '📝 ذخیره دل‌نوشته در دفتر خاطرات';
    case 'save_gratitude':
      return '🙏 ثبت شکرگذاری امروز';
    case 'save_meeting_summary':
      return `📋 ذخیره صورتجلسه: «${params.meeting_title || ''}»`;
    case 'process_attachment':
      return `📎 پردازش فایل`;
    case 'create_contact':
      return `👤 ایجاد مخاطب: «${params.name || 'بدون نام'}» ${params.organization ? `- ${params.organization}` : ''}`.trim();
    case 'save_meeting_recording':
      return `🎤 ذخیره ضبط جلسه: «${params.title || ''}»`;
    case 'create_tasks_batch':
      return `✅ ایجاد ${(params.tasks || []).length} وظیفه`;
    case 'import_contacts_batch':
      return `👥 وارد کردن ${(params.contacts || []).length} مخاطب`;
    case 'request_missing_info':
      return `❓ درخواست اطلاعات تکمیلی`;
    case 'save_for_later': {
      const categoryMap: Record<string, string> = {
        'book': 'کتاب', 'article': 'مقاله', 'video': 'ویدیو',
        'podcast': 'پادکست', 'link': 'لینک', 'other': 'محتوا'
      };
      const cat = categoryMap[params.category] || 'محتوا';
      return `📚 ذخیره ${cat}: «${params.title || 'بدون عنوان'}» در لیست مطالعه`;
    }
    // NEW action descriptions
    case 'save_health_metrics': {
      const parts = [];
      if (params.exercise_minutes) parts.push(`${params.exercise_minutes} دقیقه ورزش`);
      if (params.sleep_hours) parts.push(`${params.sleep_hours} ساعت خواب`);
      if (params.water_intake) parts.push(`${params.water_intake} لیوان آب`);
      if (params.weight) parts.push(`وزن: ${params.weight} کیلو`);
      return `🏃 ثبت سلامت: ${parts.join('، ') || 'اطلاعات سلامت'}`;
    }
    case 'add_resume_item': {
      const sectionMap: Record<string, string> = {
        'education': 'تحصیلات', 'work': 'سوابق کاری', 'skills': 'مهارت',
        'certificates': 'گواهینامه', 'awards': 'افتخار', 'affiliations': 'عضویت'
      };
      const sec = sectionMap[params.section] || params.section;
      return `📄 افزودن به رزومه (${sec}): «${params.title || ''}»`;
    }
    case 'create_csr_project':
      return `🌱 ایجاد پروژه مسئولیت اجتماعی: «${params.title || 'بدون عنوان'}»`;
    case 'save_idea':
      return `💡 ذخیره ایده: «${params.title || 'بدون عنوان'}»`;
    case 'get_pending_tasks':
      return `📊 بررسی وظایف ${params.domain === 'all' ? 'همه حوزه‌ها' : params.domain || 'در انتظار'}`;
    case 'complete_habit':
      return `✔️ ثبت عادت: «${params.habit_name || ''}»`;
    default:
      return functionName;
  }
}
