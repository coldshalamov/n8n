'use client';

import { useFormStatus } from 'react-dom';
import { Button } from './Button';

type Props = React.ComponentProps<typeof Button> & {
  pendingLabel?: string;
};

export function SubmitButton({ children, pendingLabel, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
