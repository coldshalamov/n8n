import { Star } from 'lucide-react';

export function Rating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={
            i <= value
              ? 'fill-accent-glow stroke-accent-glow'
              : 'fill-transparent stroke-ink-faint'
          }
        />
      ))}
    </span>
  );
}
