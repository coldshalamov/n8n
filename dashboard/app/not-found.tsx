import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="text-center max-w-md">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-faint">
          404
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Not <span className="gradient-text">found</span>
        </h1>
        <p className="mt-2 text-sm text-ink-dim">
          That property or contractor doesn’t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-gradient-to-br from-accent to-accent-soft px-4 py-2 text-sm font-medium text-bg shadow-glow"
        >
          Back to portfolio
        </Link>
      </div>
    </main>
  );
}
