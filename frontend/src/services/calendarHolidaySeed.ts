import Holidays from 'date-holidays';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { DomainType } from '@/types';
import { generateTimeIrEventsForGregorianYear } from '@/services/timeIrObservances';

export type HolidayPack = 'IR' | 'UN' | 'TIMEIR';

type CalendarInsert = Database['public']['Tables']['calendar_events']['Insert'];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function ymd(date: Date) {
  return date.toISOString().split('T')[0];
}

// Helpers for TIMEIR seed computation
const persianToEnglishDigits = (s: string) => s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
function getJalaliYearForGregorianYear(gYear: number) {
  const midYear = new Date(gYear, 6, 1);
  const jYearStr = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(midYear);
  return Number(persianToEnglishDigits(jYearStr));
}
function getPackSeed(pack: HolidayPack, gYear: number) {
  if (pack === 'TIMEIR') {
    const jYear = getJalaliYearForGregorianYear(gYear);
    return `TIMEIR-JY-${jYear}`;
  }
  return `${pack}-${gYear}`;
}

export async function generateHolidayEvents(year: number, packs: HolidayPack[]) {
  const events: Array<{
    title: string;
    start: Date;
    end: Date;
    pack: HolidayPack;
    seed: string;
    event_type: 'holiday' | 'observance';
  }> = [];

  for (const pack of packs) {
    if (pack === 'TIMEIR') {
      const items = generateTimeIrEventsForGregorianYear(year);
      for (const it of items) {
        events.push(it);
      }
      continue;
    }

    const hd = new Holidays(pack);
    const items = hd.getHolidays(year) as any[];
    const seed = getPackSeed(pack, year);
    for (const h of items) {
      const start = startOfDay(h.start ? new Date(h.start) : new Date(h.date));
      const end = endOfDay(h.end ? new Date(h.end) : new Date(h.date));
      events.push({
        title: h.name,
        start,
        end,
        pack,
        seed,
        event_type: pack === 'IR' ? 'holiday' : 'observance',
      });
    }
  }

  return events;
}


export async function seedHolidaysToSupabase(params: {
  packs: HolidayPack[];
  domains: DomainType[];
  year?: number;
}) {
  const year = params.year ?? new Date().getFullYear();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('کاربر وارد نشده است');

  const generated = await generateHolidayEvents(year, params.packs);

  // Build existing map per pack (seed)
  const existingKeys = new Set<string>();
  for (const pack of params.packs) {
    const seed = getPackSeed(pack, year);
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id,title,start_date,domain')
      .eq('user_id', user.id)
      .in('domain', params.domains)
      .like('title', `%${seed}%`); // Use title filter instead of recurring
    if (error) continue;
    for (const row of (data as any[]) || []) {
      const dateKey = ymd(new Date(row.start_date as string));
      existingKeys.add(`${row.domain}|${row.title}|${dateKey}|${seed}`);
    }
  }

  const rows: CalendarInsert[] = [];
  for (const ev of generated) {
    for (const domain of params.domains) {
      const key = `${domain}|${ev.title}|${ymd(ev.start)}|${ev.seed}`;
      if (existingKeys.has(key)) continue;
      rows.push({
        user_id: user.id,
        title: ev.title,
        description: null,
        start_date: ev.start.toISOString(),
        end_date: ev.end.toISOString(),
        domain,
        event_type: ev.event_type,
        color: null,
        all_day: true
        // family_member removed - doesn't exist in schema
      });
    }
  }

  let inserted = 0;
  if (rows.length > 0) {
    const { error, count } = await supabase
      .from('calendar_events')
      .insert(rows, { count: 'exact' });
    if (error) throw error;
    inserted = count || rows.length;
  }

  return { inserted, skipped: generated.length * params.domains.length - inserted, total: generated.length * params.domains.length };
}

export async function deleteHolidaySeeds(params: {
  packs: HolidayPack[];
  domains: DomainType[];
  year?: number;
}) {
  const year = params.year ?? new Date().getFullYear();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('کاربر وارد نشده است');

  let deleted = 0;
  for (const pack of params.packs) {
    const seed = getPackSeed(pack, year);
    const { error, count } = await supabase
      .from('calendar_events')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .in('domain', params.domains)
      .like('title', `%${seed}%`); // Use title filter instead of recurring
    if (error) throw error;
    deleted += count || 0;
  }

  return { deleted };
}
