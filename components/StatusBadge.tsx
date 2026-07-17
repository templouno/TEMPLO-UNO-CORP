import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/types';
import type { OrderStatus, PaymentStatus } from '@/types';

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const colors: Record<PaymentStatus, string> = { pago: '#22C55E', pendente: '#EF4444', parcial: '#EAB308' };
  return <Badge color={colors[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
