import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { getCorsHeaders } from '../_shared/cors.ts';

interface SecretaryDelegationRequest {
  taskId: string;
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
    const { taskId, title, description, dueDate }: SecretaryDelegationRequest = await req.json();
    console.log("Processing secretary delegation for:", { taskId, title });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create notification for secretary
    const { data: notification, error: notificationError } = await supabase
      .from('secretary_notifications')
      .insert({
        doctor_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Default doctor ID
        request_id: taskId,
        type: 'task_delegation',
        title: `واگذاری وظیفه: ${title}`,
        message: `وظیفه جدیدی با عنوان "${title}" واگذار شده است. ${description ? `توضیحات: ${description}` : ''} ${dueDate ? `مهلت انجام: ${new Date(dueDate).toLocaleDateString('fa-IR')}` : ''}`,
        read: false
      })
      .select()
      .single();

    if (notificationError) {
      console.error("Error creating secretary notification:", notificationError);
      throw notificationError;
    }

    // Create secretary request entry
    const { data: request, error: requestError } = await supabase
      .from('secretary_requests')
      .insert({
        secretary_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Default secretary ID
        doctor_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        type: 'task_delegation',
        status: 'pending',
        data: {
          task_id: taskId,
          title,
          description,
          due_date: dueDate,
          delegation_method: 'secretary'
        }
      })
      .select()
      .single();

    if (requestError) {
      console.error("Error creating secretary request:", requestError);
      throw requestError;
    }

    console.log("Secretary delegation created successfully:", { notification, request });

    return new Response(JSON.stringify({
      success: true,
      notificationId: notification.id,
      requestId: request.id,
      taskId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-secretary-delegation function:", error);
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