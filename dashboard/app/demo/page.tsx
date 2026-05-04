import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  BadgeDollarSign,
  Bot,
  Building2,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Hammer,
  Inbox,
  MessageSquareText,
  Route,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { BudgetBar } from '@/components/BudgetBar';
import { PropertyStatusBadge, JobStatusBadge } from '@/components/StatusBadge';
import { externalUrl, money, pct, relativeDate } from '@/lib/format';

export const metadata = {
  title: 'Demo Cockpit - RehabOps',
};

const n8nUrl = externalUrl(process.env.NEXT_PUBLIC_N8N_URL) ?? 'https://n8n-server-pz47.onrender.com';

const properties = [
  {
    id: 'demo-1',
    address: '1842 SW 23rd Terrace',
    city: 'Miami',
    status: 'in_progress' as const,
    budget: 128000,
    spent: 84200,
    margin: 146000,
    due: 'Punch list in 11 days',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
  },
  {
    id: 'demo-2',
    address: '431 NE 43rd Street',
    city: 'Little Haiti',
    status: 'permitting' as const,
    budget: 91000,
    spent: 23800,
    margin: 118500,
    due: 'Permit answer due Friday',
    image: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1200&q=80',
  },
  {
    id: 'demo-3',
    address: '9121 SW 12th Court',
    city: 'Westchester',
    status: 'listing' as const,
    budget: 76000,
    spent: 71800,
    margin: 161250,
    due: 'Showing package ready',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  },
];

const jobs = [
  ['Electrical rough-in', 'in_progress', 'PowerGrid Electric', '$18.4k', '2 days left'],
  ['Roof dry-in inspection', 'inspection', 'Atlas Roofing', '$31.8k', 'today'],
  ['Cabinet install bid', 'bid_received', 'Luna Millwork', '$22.1k', 'needs approval'],
  ['Final staging photos', 'pending', 'Mia Listing Media', '$1.6k', 'next week'],
] as const;

const automations = [
  ['Daily owner digest', '7:00 AM', 'Ready'],
  ['Deadline reminder', '8:00 AM', '3 jobs'],
  ['New email alert', 'Webhook', 'Listening'],
  ['Invoice approved', 'Webhook', 'Budget sync'],
] as const;

const activity = [
  ['invoice_submitted', 'Atlas Roofing sent invoice #1048 for 431 NE 43rd Street', '12 min ago'],
  ['photo_uploaded', '28 progress photos added to 1842 SW 23rd Terrace', '43 min ago'],
  ['bid_received', 'Luna Millwork submitted a cabinet bid', '1 hr ago'],
  ['note_added', 'OpenClaw added owner note: hold contingency until inspection clears', '2 hr ago'],
] as const;

export default function DemoPage() {
  const totalBudget = properties.reduce((sum, property) => sum + property.budget, 0);
  const totalSpent = properties.reduce((sum, property) => sum + property.spent, 0);
  const totalMargin = properties.reduce((sum, property) => sum + property.margin, 0);

  return (
    <main className="min-h-screen overflow-x-hidden bg-bg text-ink">
      <section className="relative isolate overflow-hidden border-b border-line">
        <Image
          src="/images/rehabops-command-mock.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover opacity-28"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/92 to-bg/55" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-transparent to-bg/40" />
        <div className="mx-auto grid min-h-[640px] max-w-7xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div className="min-w-0 flex flex-col justify-between gap-8">
            <nav className="flex max-w-full items-center gap-3 overflow-hidden">
              <Link href="/login" className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-glow shadow-glow">
                  <span className="size-3.5 rounded-sm bg-bg/80" />
                </span>
                <span className="text-base font-semibold tracking-tight sm:text-lg">
                  Rehab<span className="text-accent-soft">Ops</span>
                </span>
              </Link>
              <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
                <Link
                  href="/n8n"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg shadow-glow transition hover:brightness-110"
                >
                  <Workflow className="size-4" />
                  n8n Builder
                  <ExternalLink className="size-3.5" />
                </Link>
                <Link
                  href="/login"
                  className="hidden rounded-lg bg-surface/80 px-3 py-2 text-sm text-ink-dim ring-1 ring-line backdrop-blur transition hover:text-ink sm:inline-flex"
                >
                  Sign in
                </Link>
              </div>
            </nav>

            <div className="max-w-3xl pb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-ink-faint ring-1 ring-line backdrop-blur">
                <Sparkles className="size-3.5 text-accent-soft" />
                Demo cockpit
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
                The real estate rehab command center.
              </h1>
              <p className="mt-5 max-w-full break-words text-base leading-7 text-ink-dim sm:max-w-2xl sm:text-lg">
                A sharp owner wrapper around n8n: portfolio health, contractor work,
                email intake, payables, and OpenClaw-ready operations tools in one place.
              </p>
              <div className="mt-7 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                <HeroMetric icon={Building2} label="Active rehabs" value="3" />
                <HeroMetric icon={Hammer} label="Open jobs" value="14" />
                <HeroMetric icon={BadgeDollarSign} label="Budget used" value={`${pct(totalSpent, totalBudget)}%`} />
                <HeroMetric icon={Bot} label="AI tools" value="12" />
              </div>
            </div>
          </div>

          <aside className="self-end rounded-xl bg-bg/70 p-4 shadow-card ring-1 ring-line backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
                  Automation pulse
                </h2>
                <p className="mt-1 text-xs text-ink-faint">
                  n8n handles the deterministic work
                </p>
              </div>
              <Zap className="size-5 text-accent-soft" />
            </div>
            <div className="mt-4 space-y-2">
              {automations.map(([name, trigger, state]) => (
                <div key={name} className="grid grid-cols-1 gap-3 rounded-lg bg-surface/80 p-3 ring-1 ring-line sm:grid-cols-[1fr_auto]">
                  <div>
                    <div className="text-sm font-medium">{name}</div>
                    <div className="mt-0.5 text-xs text-ink-faint">{trigger}</div>
                  </div>
                  <div className="w-fit self-center rounded-full bg-ok/10 px-2 py-1 text-[11px] text-ok ring-1 ring-ok/30">
                    {state}
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/n8n"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-surface"
            >
              Open workflow canvas
              <ExternalLink className="size-3.5" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard label="Rehab budget" value={money(totalBudget)} hint={`${money(totalSpent)} committed`} icon={BadgeDollarSign} />
            <SummaryCard label="Projected margin" value={money(totalMargin)} hint="Across active pipeline" icon={Route} />
            <SummaryCard label="Owner attention" value="5" hint="2 bids, 3 invoices" icon={Clock3} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {properties.map((property) => (
              <article key={property.id} className="overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={property.image}
                    alt={property.address}
                    fill
                    sizes="(max-width: 1280px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
                  <div className="absolute left-3 top-3">
                    <PropertyStatusBadge status={property.status} />
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h2 className="text-base font-semibold leading-tight">{property.address}</h2>
                    <p className="mt-0.5 text-xs text-ink-dim">{property.city}</p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <BudgetBar spent={property.spent} budget={property.budget} compact />
                  <div className="grid grid-cols-2 gap-2">
                    <Mini label="Target spread" value={money(property.margin)} />
                    <Mini label="Next move" value={property.due} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-xl bg-surface p-5 shadow-card ring-1 ring-line">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
                  Job coordination
                </h2>
                <p className="mt-1 text-xs text-ink-faint">
                  What contractors and n8n are moving right now
                </p>
              </div>
              <ShieldCheck className="size-4 text-accent-soft" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-ink-faint">
                  <tr className="border-b border-line">
                    <th className="py-3 font-medium">Job</th>
                    <th className="py-3 font-medium">Contractor</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium">Value</th>
                    <th className="py-3 font-medium">Next</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(([title, status, contractor, value, next]) => (
                    <tr key={title} className="border-b border-line/70 last:border-0">
                      <td className="py-3 font-medium">{title}</td>
                      <td className="py-3 text-ink-dim">{contractor}</td>
                      <td className="py-3"><JobStatusBadge status={status} /></td>
                      <td className="py-3 tabular-nums text-ink-dim">{value}</td>
                      <td className="py-3 text-ink-dim">{next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl bg-surface p-5 shadow-card ring-1 ring-line">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
                  OpenClaw / MCP
                </h2>
                <p className="mt-1 text-xs text-ink-faint">Chat can call real tools</p>
              </div>
              <MessageSquareText className="size-4 text-accent-soft" />
            </div>
            <div className="mt-4 rounded-lg bg-bg/60 p-3 ring-1 ring-line">
              <p className="text-sm text-ink-dim">
                &ldquo;What&apos;s overdue and what should I approve today?&rdquo;
              </p>
              <div className="mt-3 rounded-lg bg-accent/10 p-3 text-sm text-ink ring-1 ring-accent/25">
                2 approvals need owner review. No critical overdue items. Atlas roof invoice should wait for inspection.
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-surface p-5 shadow-card ring-1 ring-line">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
                Intake queue
              </h2>
              <Inbox className="size-4 text-ink-faint" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Mini label="Emails" value="18" />
              <Mini label="Photos" value="64" />
              <Mini label="Bids" value="2" />
            </div>
          </div>

          <div className="rounded-xl bg-surface p-5 shadow-card ring-1 ring-line">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
                Live activity
              </h2>
              <Activity className="size-4 text-ink-faint" />
            </div>
            <div className="space-y-3">
              {activity.map(([action, detail, when]) => (
                <div key={detail} className="flex gap-3">
                  <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 ring-1 ring-line">
                    {action === 'photo_uploaded' ? (
                      <Camera className="size-3.5 text-accent-soft" />
                    ) : action === 'note_added' ? (
                      <Bot className="size-3.5 text-accent-soft" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-ok" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm leading-5 text-ink-dim">{detail}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{when}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-faint">
              Last sync {relativeDate(new Date().toISOString())}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

type Icon = React.ComponentType<{ className?: string }>;

function HeroMetric({ icon: Icon, label, value }: { icon: Icon; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg/65 p-3 ring-1 ring-line backdrop-blur">
      <Icon className="size-4 text-accent-soft" />
      <div className="mt-3 text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, hint }: { icon: Icon; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-card ring-1 ring-line">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-faint">{label}</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
          <div className="mt-1 text-xs text-ink-dim">{hint}</div>
        </div>
        <div className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent-soft ring-1 ring-accent/25">
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-surface-2 px-3 py-2 ring-1 ring-line">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-0.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5 tabular-nums">
        {value}
      </div>
    </div>
  );
}
