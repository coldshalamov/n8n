import clsx from 'clsx';
import { forwardRef } from 'react';

type Common = {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
};

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & Common;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, prefix, suffix, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">
          {label}
        </span>
      )}
      <span
        className={clsx(
          'flex h-10 items-center gap-2 rounded-lg bg-surface-2 px-3 ring-1 ring-line transition-colors focus-within:ring-accent/50',
          error && 'ring-bad/40',
        )}
      >
        {prefix && <span className="text-ink-faint">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint disabled:opacity-60',
            className,
          )}
          {...rest}
        />
        {suffix && <span className="text-ink-faint">{suffix}</span>}
      </span>
      {(hint || error) && (
        <span
          className={clsx(
            'mt-1 block text-xs',
            error ? 'text-bad' : 'text-ink-faint',
          )}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & Common;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">
          {label}
        </span>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={clsx(
          'block w-full rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-ink ring-1 ring-line outline-none transition-colors placeholder:text-ink-faint focus-within:ring-accent/50 disabled:opacity-60',
          error && 'ring-bad/40',
          className,
        )}
        {...rest}
      />
      {(hint || error) && (
        <span
          className={clsx(
            'mt-1 block text-xs',
            error ? 'text-bad' : 'text-ink-faint',
          )}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & Common;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">
          {label}
        </span>
      )}
      <select
        ref={ref}
        id={inputId}
        className={clsx(
          'h-10 w-full rounded-lg bg-surface-2 px-3 text-sm text-ink ring-1 ring-line outline-none transition-colors focus:ring-accent/50 disabled:opacity-60',
          error && 'ring-bad/40',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {(hint || error) && (
        <span
          className={clsx(
            'mt-1 block text-xs',
            error ? 'text-bad' : 'text-ink-faint',
          )}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
});
