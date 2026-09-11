/**
 * Generic backend data proxy
 * Handles CRUD for tables stored in backend PostgreSQL.
 * All queries are automatically scoped to the authenticated user.
 */

import { Router } from 'express';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Tables available in backend DB and their user-scoping column
const BACKEND_TABLES = {
  ideas:                  { userCol: 'user_id' },
  calendar_events:        { userCol: 'user_id' },
  knowledge_base:         { userCol: 'author_id' },
  business_companies:     { userCol: 'user_id' },
  meetings:               { userCol: 'user_id' },
  gratitude_entries:      { userCol: 'user_id' },
  health_metrics:         { userCol: 'user_id' },
  delegation_tasks:       { userCol: 'delegator_id' },
  csr_projects:           { userCol: 'user_id' },
  correspondence:         { userCol: 'user_id' },
  social_media_posts:     { userCol: 'user_id' },
  hi_dock_recordings:     { userCol: 'user_id' },
  legal_cases:            { userCol: 'user_id' },
  user_profiles:          { userCol: 'user_id' },
  // Habit Tracker
  habits:                      { userCol: 'user_id' },
  habit_completions:           { userCol: 'user_id' },
  habit_streaks:               { userCol: 'user_id' },
  habit_settings:              { userCol: 'user_id', conflictCol: 'user_id' },
  // Contacts & Networking
  personal_contacts:           { userCol: 'user_id' },
  networking_contacts:         { userCol: 'user_id' },
  networking_interactions:     { userCol: 'user_id' },
  networking_goals:            { userCol: 'user_id' },
  networking_events:           { userCol: 'user_id' },
  // Cultural Content
  cultural_content:            { userCol: 'user_id' },
  // AI Chat
  ai_chat_sessions:            { userCol: 'user_id' },
  ai_chat_messages:            { userCol: 'user_id' },
  // Delegation sub-tables
  delegation_subtasks:         { userCol: 'user_id' },
  delegation_notifications:    { userCol: 'user_id' },
  delegation_attachments:      { userCol: 'user_id' },
  delegation_task_events:      { userCol: 'user_id' },
  // Organizations
  organizations:               { userCol: null },
  organization_members:        { userCol: 'user_id' },
  organization_invitations:    { userCol: null },
  organization_departments:    { userCol: null },
  organization_employees:      { userCol: null },
  organization_missions:       { userCol: null },
  organization_policies:       { userCol: null },
  organization_finance:        { userCol: null },
  organization_hr:             { userCol: null },
  organization_operations:     { userCol: null },
  organization_strategies:     { userCol: null },
  organization_okr_key_results:{ userCol: null },
  organization_roadmap_milestones: { userCol: null },
  organization_notifications:  { userCol: 'user_id' },
  organization_chart_nodes:    { userCol: null },
  organization_checklist_items:{ userCol: null },
  organization_decision_options:{ userCol: null },
  organization_sop_steps:      { userCol: null },
  organization_succession_plans:{ userCol: null },
  organization_succession_successors:{ userCol: null },
  organization_performance_evaluations:{ userCol: null },
  organizational_claims:       { userCol: 'user_id' },
  organizational_policy_attachments:{ userCol: null },
  // Planning & Projects
  personal_planning:           { userCol: 'user_id' },
  projects:                    { userCol: 'user_id' },
  project_tasks:               { userCol: 'user_id' },
  profiles:                    { userCol: 'user_id' },
  // Resume
  resume_personal_info:        { userCol: 'user_id' },
  resume_work_experience:      { userCol: 'user_id' },
  resume_education:            { userCol: 'user_id' },
  resume_skills:               { userCol: 'user_id' },
  resume_certificates:         { userCol: 'user_id' },
  resume_awards:               { userCol: 'user_id' },
  resume_publications:         { userCol: 'user_id' },
  resume_affiliations:         { userCol: 'user_id' },
  resume_interests:            { userCol: 'user_id' },
  resume_media_interviews:     { userCol: 'user_id' },
  resume_templates:            { userCol: 'user_id' },
  resume_template_customizations:{ userCol: 'user_id' },
  resume_exports:              { userCol: 'user_id' },
  // Sales & Marketing
  sales_leads:                 { userCol: 'user_id' },
  sales_icp_profiles:          { userCol: 'user_id' },
  sales_funnel_stages:         { userCol: 'user_id' },
  marketing_campaigns:         { userCol: 'user_id' },
  // Ideas sub-tables
  idea_business_model_canvas:  { userCol: 'user_id' },
  idea_swot_analysis:          { userCol: 'user_id' },
  idea_strategy:               { userCol: 'user_id' },
  idea_financial_analysis:     { userCol: 'user_id' },
  idea_milestones:             { userCol: 'user_id' },
  idea_risks:                  { userCol: 'user_id' },
  idea_inspirations:           { userCol: 'user_id' },
  idea_revenue_opportunities:  { userCol: 'user_id' },
  idea_suggested_actions:      { userCol: 'user_id' },
  idea_analysis_queue:         { userCol: 'user_id' },
  // Knowledge
  knowledge_folders:           { userCol: 'user_id' },
  knowledge_items:             { userCol: 'user_id' },
  // CSR sub-tables
  csr_project_milestones:      { userCol: null },
  csr_project_documents:       { userCol: null },
  csr_project_team:            { userCol: null },
  csr_impact_assessments:      { userCol: null },
  // Company sub-tables
  company_contacts:            { userCol: 'user_id' },
  company_notes:               { userCol: 'user_id' },
  company_profiles:            { userCol: 'user_id' },
  company_tasks:               { userCol: 'user_id' },
  company_calls:               { userCol: 'user_id' },
  // Messaging
  messages:                    { userCol: 'sender_id' },
  channel_members:             { userCol: 'user_id' },
  polls:                       { userCol: 'user_id' },
  poll_options:                { userCol: null },
  poll_votes:                  { userCol: 'user_id' },
  // Devices
  plaud_connections:           { userCol: 'user_id' },
  plaud_recordings:            { userCol: 'user_id' },
  hi_dock_connections:         { userCol: 'user_id' },
  // System
  user_organizations:          { userCol: 'user_id' },
  user_permissions:            { userCol: 'user_id' },
  user_audit_log:              { userCol: 'user_id' },
  system_permissions:          { userCol: null },
  assistant_action_logs:       { userCol: 'user_id' },
  auth_audit:                  { userCol: null },
  succession_positions:        { userCol: null },
  documents:                   { userCol: 'user_id' },
  attachments:                 { userCol: 'user_id' },
  recordings:                  { userCol: 'user_id' },
  avatars:                     { userCol: 'user_id' },
};

// جداولی که ستون updated_at ندارند
const TABLES_WITHOUT_UPDATED_AT = new Set([
  'social_media_posts',
  'gratitude_entries',
  'ai_chat_messages',
  'habit_completions',
  'networking_interactions',
  'networking_events',
  'delegation_subtasks',
  'delegation_notifications',
  'delegation_attachments',
  'delegation_task_events',
]);

const OP_MAP = { eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' };

function buildWhere(filters, userId, userCol) {
  const conditions = [`"${userCol}" = $1`];
  const values = [userId];
  let idx = 2;

  for (const f of (filters || [])) {
    const col = f.col || f.column;
    const op  = f.op || 'eq';
    const val = f.val !== undefined ? f.val : f.value;
    if (!col) continue;
    // user-scope column already handled above — skip to avoid duplicate condition
    if (col === userCol || col === 'user_id' || col === 'author_id') continue;

    if (OP_MAP[op]) {
      conditions.push(`"${col}" ${OP_MAP[op]} $${idx}`);
      values.push(val); idx++;
    } else if (op === 'like') {
      conditions.push(`"${col}" LIKE $${idx}`);
      values.push(val); idx++;
    } else if (op === 'ilike') {
      conditions.push(`"${col}" ILIKE $${idx}`);
      values.push(val); idx++;
    } else if (op === 'in') {
      conditions.push(`"${col}" = ANY($${idx})`);
      values.push(val); idx++;
    } else if (op === 'is') {
      conditions.push(val === null ? `"${col}" IS NULL` : `"${col}" IS NOT NULL`);
    }
  }

  return { where: conditions.join(' AND '), values, nextIdx: idx };
}

router.use(requireAuth);

router.post('/:table', async (req, res) => {
  const { table } = req.params;
  const conf = BACKEND_TABLES[table];
  if (!conf) {
    return res.status(404).json({ data: null, error: { message: `Table '${table}' not in backend` } });
  }

  const userId = req.user.id;
  const { userCol } = conf;
  const {
    operation = 'select',
    select: selectCols = '*',
    filters = [],
    order,
    limit,
    offset,
    data: rowData,
    single,
  } = req.body;

  try {
    // ── SELECT ────────────────────────────────────────────────────────────────
    if (operation === 'select') {
      const { where, values } = buildWhere(filters, userId, userCol);

      const cols = selectCols === '*' ? '*'
        : selectCols.split(',').map(c => `"${c.trim()}"`).join(', ');

      let sql = `SELECT ${cols} FROM ${table} WHERE ${where}`;

      if (order) {
        const col = order.col || order.column;
        const asc = order.asc !== false && order.ascending !== false;
        if (col) sql += ` ORDER BY "${col}" ${asc ? 'ASC' : 'DESC'}`;
      }
      if (limit)  sql += ` LIMIT ${parseInt(limit)}`;
      if (offset) sql += ` OFFSET ${parseInt(offset)}`;

      const result = await query(sql, values);
      if (single) return res.json({ data: result.rows[0] || null, error: null });
      return res.json({ data: result.rows, error: null });

    // ── INSERT ────────────────────────────────────────────────────────────────
    } else if (operation === 'insert') {
      const rows = Array.isArray(rowData) ? rowData : [rowData];
      const inserted = [];

      for (const row of rows) {
        const r = { ...row, [userCol]: userId };
        const keys = Object.keys(r).filter(k => r[k] !== undefined);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const vals = keys.map(k => r[k]);
        const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`;
        const result = await query(sql, vals);
        inserted.push(result.rows[0]);
      }

      return res.json({ data: inserted.length === 1 ? inserted[0] : inserted, error: null });

    // ── UPDATE ────────────────────────────────────────────────────────────────
    } else if (operation === 'update') {
      const { where, values } = buildWhere(filters, userId, userCol);
      const updateData = { ...rowData };
      delete updateData[userCol];
      delete updateData.id;
      delete updateData.created_at;

      const keys = Object.keys(updateData).filter(k => updateData[k] !== undefined);
      if (!keys.length) return res.json({ data: [], error: null });

      let idx = values.length + 1;
      const sets = keys.map(k => { const s = `"${k}" = $${idx}`; idx++; return s; }).join(', ');
      const updateVals = [...values, ...keys.map(k => updateData[k])];

      const hasUpdatedAt = !TABLES_WITHOUT_UPDATED_AT.has(table);
      const sql = `UPDATE ${table} SET ${sets}${hasUpdatedAt ? ', updated_at = NOW()' : ''} WHERE ${where} RETURNING *`;
      const result = await query(sql, updateVals);
      return res.json({ data: result.rows, error: null });

    // ── DELETE ────────────────────────────────────────────────────────────────
    } else if (operation === 'delete') {
      const { where, values } = buildWhere(filters, userId, userCol);
      const sql = `DELETE FROM ${table} WHERE ${where} RETURNING id`;
      const result = await query(sql, values);
      return res.json({ data: result.rows, error: null });

    // ── UPSERT ────────────────────────────────────────────────────────────────
    } else if (operation === 'upsert') {
      const rows = Array.isArray(rowData) ? rowData : [rowData];
      const upserted = [];
      // برخی جداول بر اساس ستونی غیر از id تضاد دارند (مثلاً habit_settings بر user_id)
      const conflictCol = conf.conflictCol || 'id';
      const hasUpdatedAtUpsert = !TABLES_WITHOUT_UPDATED_AT.has(table);

      for (const row of rows) {
        const r = { ...row, [userCol]: userId };
        const keys = Object.keys(r).filter(k => r[k] !== undefined);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const vals = keys.map(k => r[k]);
        const updates = keys
          .filter(k => k !== conflictCol && k !== userCol && k !== 'created_at')
          .map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');

        const updatedAtClause = (hasUpdatedAtUpsert && updates) ? ', updated_at = NOW()' : '';
        const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders})
          ON CONFLICT (${conflictCol}) DO UPDATE SET ${updates || `"${conflictCol}" = EXCLUDED."${conflictCol}"`}${updatedAtClause}
          RETURNING *`;
        const result = await query(sql, vals);
        upserted.push(result.rows[0]);
      }

      return res.json({ data: upserted.length === 1 ? upserted[0] : upserted, error: null });

    // ── COUNT ─────────────────────────────────────────────────────────────────
    } else if (operation === 'count') {
      const { where, values } = buildWhere(filters, userId, userCol);
      const sql = `SELECT COUNT(*) FROM ${table} WHERE ${where}`;
      const result = await query(sql, values);
      return res.json({ count: parseInt(result.rows[0].count), data: null, error: null });

    } else {
      return res.status(400).json({ data: null, error: { message: `Unknown operation: ${operation}` } });
    }

  } catch (err) {
    console.error(`[db/${table}] error:`, err.message);
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
});

export default router;
