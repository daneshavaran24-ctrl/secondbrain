import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook برای همگام‌سازی Real-time داده‌های تلگرام
 * 
 * این hook به تغییرات جداول همه ماژول‌های Mora
 * گوش می‌دهد و وقتی داده جدیدی از تلگرام می‌آید، UI را به‌روزرسانی می‌کند
 */
export const useTelegramSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('[TELEGRAM_SYNC] Setting up real-time subscriptions for all modules...');

    const subscriptions = [
      { channel: 'telegram-meetings', table: 'meetings', message: '📅 جلسه جدید از تلگرام ثبت شد!', queryKey: 'meetings' },
      { channel: 'telegram-knowledge', table: 'knowledge_base', message: '📝 نکته جدید از تلگرام ثبت شد!', queryKey: 'knowledge' },
      { channel: 'telegram-tasks', table: 'delegation_tasks', message: '✅ تسک جدید از تلگرام ثبت شد!', queryKey: 'delegation-tasks' },
      { channel: 'telegram-gratitude', table: 'gratitude_entries', message: '🙏 قدردانی جدید از تلگرام ثبت شد!', queryKey: 'gratitude' },
      { channel: 'telegram-health', table: 'health_metrics', message: '💪 داده سلامتی جدید از تلگرام ثبت شد!', queryKey: 'health' },
      { channel: 'telegram-ideas', table: 'ideas', message: '💡 ایده جدید از تلگرام ثبت شد!', queryKey: 'ideas' },
      { channel: 'telegram-calendar', table: 'calendar_events', message: '📌 رویداد جدید از تلگرام ثبت شد!', queryKey: 'calendar' },
      { channel: 'telegram-companies', table: 'business_companies', message: '🏢 شرکت جدید از تلگرام ثبت شد!', queryKey: 'companies' },
      { channel: 'telegram-correspondence', table: 'correspondence', message: '✉️ مکاتبه جدید از تلگرام ثبت شد!', queryKey: 'correspondence' },
      { channel: 'telegram-csr', table: 'csr_projects', message: '🌱 پروژه CSR جدید از تلگرام ثبت شد!', queryKey: 'csr' },
    ];

    const channels = subscriptions.map(({ channel, table, message, queryKey }) =>
      supabase
        .channel(channel)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table,
          },
          (payload) => {
            console.log(`[TELEGRAM_SYNC] New ${table} entry from Telegram:`, payload);
            toast.success(message, {
              description: payload.new.title || payload.new.content?.substring(0, 50),
              duration: 4000,
            });
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          }
        )
        .subscribe((status) => {
          console.log(`[TELEGRAM_SYNC] ${channel} status:`, status);
        })
    );

    // Cleanup
    return () => {
      console.log('[TELEGRAM_SYNC] Cleaning up all subscriptions...');
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [queryClient]);
};
