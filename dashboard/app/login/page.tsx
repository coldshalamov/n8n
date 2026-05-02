import { login, sendMagicLink } from './actions';

export const metadata = {
  title: 'Sign in — RehabOps',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Hero backdrop */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1549517045-bc93de075e53?w=2400&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-bg/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/40" />
      </div>

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Left: brand + pitch */}
        <section className="hidden lg:flex flex-col justify-between px-12 py-14">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-glow shadow-glow">
              <span className="size-3.5 rounded-sm bg-bg/80" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Rehab<span className="text-accent-soft">Ops</span>
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Every property,{' '}
              <span className="gradient-text">every job</span>,
              <br />
              one console.
            </h1>
            <p className="mt-4 text-ink-dim leading-relaxed">
              Track every Miami flip end to end — bids in, work in progress,
              budgets vs. actuals, contractor performance — without leaving
              the dashboard.
            </p>
          </div>

          <div className="text-xs text-ink-faint">
            Operations console — internal tooling
          </div>
        </section>

        {/* Right: form */}
        <section className="flex flex-col justify-center px-6 py-14 sm:px-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="lg:hidden mb-10 flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-glow shadow-glow">
                <span className="size-3 rounded-sm bg-bg/80" />
              </span>
              <span className="font-semibold tracking-tight">
                Rehab<span className="text-accent-soft">Ops</span>
              </span>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-ink-dim">
              Welcome back. Pick up where you left off.
            </p>

            <form className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-ink-dim">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-lg bg-surface ring-1 ring-line px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:ring-accent/50 focus:bg-surface-2"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-ink-dim"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-surface ring-1 ring-line px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:ring-accent/50 focus:bg-surface-2"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-bad/10 ring-1 ring-bad/30 px-3.5 py-2.5 text-sm text-bad"
                >
                  {error}
                </div>
              )}

              {sent && (
                <div
                  role="status"
                  className="rounded-lg bg-ok/10 ring-1 ring-ok/30 px-3.5 py-2.5 text-sm text-ok"
                >
                  Check {sent} for a sign-in link.
                </div>
              )}

              <button
                type="submit"
                formAction={login}
                className="w-full rounded-lg bg-gradient-to-br from-accent to-accent-soft px-4 py-2.5 text-sm font-medium text-bg shadow-glow transition hover:brightness-110 active:translate-y-px"
              >
                Sign in →
              </button>

              <button
                type="submit"
                formAction={sendMagicLink}
                formNoValidate
                className="w-full rounded-lg bg-surface ring-1 ring-line px-4 py-2.5 text-sm text-ink-dim hover:text-ink hover:bg-surface-2 transition"
              >
                Or email me a sign-in link
              </button>
            </form>

            <p className="mt-8 text-xs text-ink-faint">
              Owners sign in with email + password. Contractors can use the magic
              link option above with the email on file.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
