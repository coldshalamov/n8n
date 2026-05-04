import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
};

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-accent to-accent-soft text-bg shadow-glow hover:brightness-110 disabled:opacity-50',
  secondary:
    'bg-surface-2 text-ink ring-1 ring-line hover:bg-surface-3 disabled:opacity-50',
  ghost: 'text-ink-dim hover:bg-surface-2 hover:text-ink disabled:opacity-50',
  danger: 'bg-bad/10 text-bad ring-1 ring-bad/30 hover:bg-bad/15 disabled:opacity-50',
};

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-10 px-4 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, children, className, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
        SIZE[size],
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});
