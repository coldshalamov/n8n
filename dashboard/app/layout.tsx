import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'RehabOps',
  description: 'Operations console for the Miami property portfolio.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-screen antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                'border border-line bg-surface ring-1 ring-line shadow-card rounded-xl',
              title: 'text-ink',
              description: 'text-ink-dim',
            },
          }}
        />
      </body>
    </html>
  );
}
