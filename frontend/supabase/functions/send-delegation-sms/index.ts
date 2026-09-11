import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

interface DelegationSMSRequest {
  taskId: string;
  phone: string;
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
    const { taskId, phone, delegateeName, title, description, dueDate }: DelegationSMSRequest = await req.json();
    console.log("Processing delegation SMS for:", { taskId, phone, title });

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials not configured");
    }

    const dueDateText = dueDate 
      ? new Date(dueDate).toLocaleDateString('fa-IR')
      : 'تعیین نشده';

    // Create SMS message in Persian
    const message = `🎯 واگذاری وظیفه جدید

${delegateeName ? `سلام ${delegateeName}،` : ''}

عنوان: ${title}

${description ? `توضیحات: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}` : ''}

مهلت: ${dueDateText}

شناسه: ${taskId}

BrainForge`;

    // Send SMS using Twilio API
    const auth = btoa(`${accountSid}:${authToken}`);
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Twilio API error:", errorData);
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("SMS sent successfully:", result);

    return new Response(JSON.stringify({
      success: true,
      messageSid: result.sid,
      taskId,
      to: phone
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-delegation-sms function:", error);
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