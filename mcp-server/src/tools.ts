import { supabase } from './lib/supabase';

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export const TOOL_DEFS: ToolDef[] = [
  {
    name: 'get_properties',
    description:
      'List all properties with status and budget summary. Use this when the user asks about the portfolio overall.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_property',
    description:
      'Get full details on one property by UUID or partial address (e.g. "43rd Street", "Brickell"). Returns null if no match.',
    inputSchema: {
      type: 'object',
      properties: {
        id_or_address: { type: 'string', description: 'UUID or address fragment' },
      },
      required: ['id_or_address'],
    },
  },
  {
    name: 'get_property_jobs',
    description: 'List all jobs for a property with contractor names and statuses.',
    inputSchema: {
      type: 'object',
      properties: { property_id: { type: 'string' } },
      required: ['property_id'],
    },
  },
  {
    name: 'get_property_budget',
    description:
      'Budget breakdown for a property by category (estimated vs. actual).',
    inputSchema: {
      type: 'object',
      properties: { property_id: { type: 'string' } },
      required: ['property_id'],
    },
  },
  {
    name: 'get_contractor',
    description:
      'Get contractor info matched by UUID or partial company name. Returns their active jobs.',
    inputSchema: {
      type: 'object',
      properties: {
        id_or_name: { type: 'string', description: 'UUID or name fragment' },
      },
      required: ['id_or_name'],
    },
  },
  {
    name: 'get_overdue_jobs',
    description: 'All jobs past their due_date that are not yet complete or paid.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_pending_invoices',
    description: 'All invoices waiting for owner approval.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_recent_activity',
    description: 'Most recent activity log entries across the whole portfolio.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'How many entries (default 20)' },
      },
    },
  },
  {
    name: 'update_job_status',
    description:
      'Change a job status. Valid statuses: pending, bid_requested, bid_received, approved, in_progress, inspection, complete, paid.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
        new_status: {
          type: 'string',
          enum: [
            'pending',
            'bid_requested',
            'bid_received',
            'approved',
            'in_progress',
            'inspection',
            'complete',
            'paid',
          ],
        },
      },
      required: ['job_id', 'new_status'],
    },
  },
  {
    name: 'approve_invoice',
    description:
      "Mark an invoice as approved. Updates the invoice status and logs the activity.",
    inputSchema: {
      type: 'object',
      properties: { invoice_id: { type: 'string' } },
      required: ['invoice_id'],
    },
  },
  {
    name: 'add_note',
    description: 'Append a note to a property as an activity log entry.',
    inputSchema: {
      type: 'object',
      properties: {
        property_id: { type: 'string' },
        note: { type: 'string' },
      },
      required: ['property_id', 'note'],
    },
  },
  {
    name: 'get_daily_summary',
    description:
      'High-level numbers across the whole portfolio: active properties, overdue jobs, pending invoices, total spent vs budget.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const JOB_STATUSES = new Set([
  'pending',
  'bid_requested',
  'bid_received',
  'approved',
  'in_progress',
  'inspection',
  'complete',
  'paid',
]);

function boundedLimit(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, Math.trunc(parsed)));
}

function ok(data: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(message: string) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ ok: false, error: message }) }],
    isError: true,
  };
}

export async function callTool(name: string, args: Record<string, unknown>) {
  const sb = supabase();

  switch (name) {
    case 'get_properties': {
      const { data, error } = await sb
        .from('properties')
        .select(
          'id, address, city, status, total_budget, total_spent, target_sale_price, purchase_price',
        )
        .order('updated_at', { ascending: false });
      if (error) return err(error.message);
      return ok({
        count: data?.length ?? 0,
        properties: (data ?? []).map((p) => ({
          ...p,
          budget_pct:
            p.total_budget && Number(p.total_budget) > 0
              ? Math.round(
                  (Number(p.total_spent ?? 0) / Number(p.total_budget)) * 100,
                )
              : null,
        })),
      });
    }

    case 'get_property': {
      const q = String(args.id_or_address ?? '').trim();
      if (!q) return err('id_or_address is required');
      const filter = UUID_RE.test(q)
        ? sb.from('properties').select('*').eq('id', q)
        : sb.from('properties').select('*').ilike('address', `%${q}%`);
      const { data, error } = await filter.limit(1);
      if (error) return err(error.message);
      if (!data || data.length === 0) return ok({ found: false, query: q });
      return ok(data[0]);
    }

    case 'get_property_jobs': {
      const propertyId = String(args.property_id ?? '');
      if (!UUID_RE.test(propertyId)) return err('property_id must be a UUID');
      const { data, error } = await sb
        .from('jobs')
        .select(
          'id, title, trade, status, estimated_cost, actual_cost, start_date, due_date, completed_date, contractor:contractors(id, company_name, trade)',
        )
        .eq('property_id', propertyId)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) return err(error.message);
      return ok({ count: data?.length ?? 0, jobs: data ?? [] });
    }

    case 'get_property_budget': {
      const propertyId = String(args.property_id ?? '');
      if (!UUID_RE.test(propertyId)) return err('property_id must be a UUID');
      const [propRes, budgetRes] = await Promise.all([
        sb
          .from('properties')
          .select('total_budget, total_spent')
          .eq('id', propertyId)
          .single(),
        sb.from('budget_items').select('*').eq('property_id', propertyId),
      ]);
      if (propRes.error) return err(propRes.error.message);
      if (budgetRes.error) return err(budgetRes.error.message);
      return ok({
        total_budget: propRes.data?.total_budget,
        total_spent: propRes.data?.total_spent,
        items: budgetRes.data ?? [],
      });
    }

    case 'get_contractor': {
      const q = String(args.id_or_name ?? '').trim();
      if (!q) return err('id_or_name is required');
      const filter = UUID_RE.test(q)
        ? sb.from('contractors').select('*').eq('id', q)
        : sb.from('contractors').select('*').ilike('company_name', `%${q}%`);
      const { data, error } = await filter.limit(1);
      if (error) return err(error.message);
      if (!data || data.length === 0) return ok({ found: false, query: q });
      const contractor = data[0];
      const { data: jobs } = await sb
        .from('jobs')
        .select('id, title, status, due_date, property_id')
        .eq('contractor_id', contractor.id)
        .order('due_date', { ascending: true, nullsFirst: false });
      return ok({ ...contractor, jobs: jobs ?? [] });
    }

    case 'get_overdue_jobs': {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await sb
        .from('jobs')
        .select(
          'id, title, status, due_date, property:properties(address), contractor:contractors(company_name)',
        )
        .lt('due_date', today)
        .not('status', 'in', '(paid,complete)')
        .order('due_date', { ascending: true });
      if (error) return err(error.message);
      return ok({ count: data?.length ?? 0, jobs: data ?? [] });
    }

    case 'get_pending_invoices': {
      const { data, error } = await sb
        .from('invoices')
        .select(
          'id, amount, invoice_number, submitted_at, contractor:contractors(company_name), job:jobs(title, property_id)',
        )
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });
      if (error) return err(error.message);
      return ok({ count: data?.length ?? 0, invoices: data ?? [] });
    }

    case 'get_recent_activity': {
      const limit = boundedLimit(args.limit, 20, 100);
      const { data, error } = await sb
        .from('activity_log')
        .select(
          'id, actor, action, details, created_at, property:properties(address), job:jobs(title)',
        )
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return err(error.message);
      return ok({ count: data?.length ?? 0, activity: data ?? [] });
    }

    case 'update_job_status': {
      const jobId = String(args.job_id ?? '');
      const newStatus = String(args.new_status ?? '');
      if (!UUID_RE.test(jobId)) return err('job_id must be a UUID');
      if (!JOB_STATUSES.has(newStatus)) return err('new_status is invalid');
      const { data, error } = await sb
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId)
        .select('id, title, status, property_id')
        .single();
      if (error) return err(error.message);
      const { error: logError } = await sb.from('activity_log').insert({
        property_id: data?.property_id,
        job_id: jobId,
        actor: 'OpenClaw',
        action: 'status_changed',
        details: { to: newStatus },
      });
      if (logError) return err(logError.message);
      return ok({ updated: data });
    }

    case 'approve_invoice': {
      const invoiceId = String(args.invoice_id ?? '');
      if (!UUID_RE.test(invoiceId)) return err('invoice_id must be a UUID');
      const { data, error } = await sb
        .from('invoices')
        .update({ status: 'approved' })
        .eq('id', invoiceId)
        .select('id, job_id, amount, contractor_id')
        .single();
      if (error) return err(error.message);
      const { error: logError } = await sb.from('activity_log').insert({
        job_id: data?.job_id,
        actor: 'OpenClaw',
        action: 'invoice_approved',
        details: { amount: data?.amount, invoice_id: invoiceId },
      });
      if (logError) return err(logError.message);
      return ok({ approved: data });
    }

    case 'add_note': {
      const propertyId = String(args.property_id ?? '');
      const note = String(args.note ?? '').trim();
      if (!UUID_RE.test(propertyId)) return err('property_id must be a UUID');
      if (!note) return err('note is required');
      if (note.length > 5000) return err('note is too long');
      const { data, error } = await sb
        .from('activity_log')
        .insert({
          property_id: propertyId,
          actor: 'OpenClaw',
          action: 'note_added',
          details: { note },
        })
        .select()
        .single();
      if (error) return err(error.message);
      return ok({ added: data });
    }

    case 'get_daily_summary': {
      const today = new Date().toISOString().slice(0, 10);
      const [props, overdue, pending] = await Promise.all([
        sb
          .from('properties')
          .select('id, status, total_budget, total_spent, address'),
        sb
          .from('jobs')
          .select('id')
          .lt('due_date', today)
          .not('status', 'in', '(paid,complete)'),
        sb.from('invoices').select('id, amount').eq('status', 'pending'),
      ]);
      if (props.error) return err(props.error.message);
      const properties = props.data ?? [];
      const active = properties.filter((p) => p.status !== 'sold');
      const totalBudget = properties.reduce(
        (s, p) => s + Number(p.total_budget ?? 0),
        0,
      );
      const totalSpent = properties.reduce(
        (s, p) => s + Number(p.total_spent ?? 0),
        0,
      );
      const pendingTotal = (pending.data ?? []).reduce(
        (s, i) => s + Number(i.amount ?? 0),
        0,
      );
      return ok({
        active_properties: active.length,
        sold_properties: properties.length - active.length,
        total_budget: totalBudget,
        total_spent: totalSpent,
        budget_remaining: totalBudget - totalSpent,
        budget_pct: totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0,
        overdue_jobs: overdue.data?.length ?? 0,
        pending_invoices: pending.data?.length ?? 0,
        pending_invoices_total: pendingTotal,
        as_of: new Date().toISOString(),
      });
    }

    default:
      return err(`Unknown tool: ${name}`);
  }
}
