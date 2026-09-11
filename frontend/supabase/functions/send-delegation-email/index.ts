import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { getCorsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface DelegationEmailRequest {
  taskId: string;
  email: string;
  delegateeName?: string;
  title: string;
  description: string;
  dueDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, email, delegateeName, title, description, dueDate }: DelegationEmailRequest = await req.json();
    console.log("Processing delegation email for:", { taskId, email, title });

    const dueDateText = dueDate 
      ? new Date(dueDate).toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'تعیین نشده';

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>واگذاری وظیفه جدید</title>
        <style>
          body {
            font-family: 'Tahoma', 'Arial', sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .content {
            padding: 30px;
          }
          .task-card {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .task-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
          }
          .task-description {
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 15px;
          }
          .due-date {
            background: #fef3c7;
            color: #92400e;
            padding: 10px;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
          }
          .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
          }
          .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 واگذاری وظیفه جدید</h1>
            <p>${delegateeName ? `سلام ${delegateeName}، ` : ''}وظیفه‌ای جدید برای شما واگذار شده است</p>
          </div>
          
          <div class="content">
            <div class="task-card">
              <div class="task-title">${title}</div>
              <div class="task-description">${description || 'بدون توضیحات اضافی'}</div>
              <div class="due-date">
                ⏰ مهلت انجام: ${dueDateText}
              </div>
            </div>
            
            <p>لطفاً نسبت به انجام این وظیفه اقدام نمایید و در صورت نیاز به توضیحات بیشتر با واگذار کننده تماس بگیرید.</p>
          </div>
          
          <div class="footer">
            <p>این ایمیل از سیستم مدیریت وظایف BrainForge ارسال شده است</p>
            <p>شناسه وظیفه: ${taskId}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "BrainForge <noreply@brainforge.dev>",
      to: [email],
      subject: `🎯 واگذاری وظیفه جدید: ${title}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      messageId: emailResponse.data?.id,
      taskId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-delegation-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);