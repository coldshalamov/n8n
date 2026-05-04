import clsx from 'clsx';

export function FieldRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      {children}
    </div>
  );
}

export function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">
        {title}
      </legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}
