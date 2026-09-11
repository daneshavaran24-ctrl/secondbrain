import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export type AssistantActionStatus = "success" | "failed" | "pending_confirmation";

export interface AssistantLogInput {
  action_type: string;
  summary: string;
  domain?: string | null;
  target_table?: string | null;
  target_id?: string | null;
  payload?: Record<string, unknown>;
  session_id?: string | null;
  status?: AssistantActionStatus;
  error_message?: string | null;
}

/**
 * ثبت یک اقدام دستیار هوشمند در جدول لاگ.
 * این تابع silent است — هرگز نباید جریان اصلی را بشکند.
 */
export async function logAssistantAction(input: AssistantLogInput): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("assistant_action_logs").insert([{
      user_id: user.id,
      action_type: input.action_type,
      summary: input.summary,
      domain: input.domain ?? null,
      target_table: input.target_table ?? null,
      target_id: input.target_id ?? null,
      payload: (input.payload ?? {}) as any,
      session_id: input.session_id ?? null,
      status: input.status ?? "success",
      error_message: input.error_message ?? null,
    }]);

    if (error) {
      logger.warn("[assistantLog] failed to insert log", error);
    }
  } catch (e) {
    logger.warn("[assistantLog] exception", e);
  }
}