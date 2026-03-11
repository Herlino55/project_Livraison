import type { DeliveryStatus } from '../../types';

interface StatusBadgeProps {
  status: DeliveryStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<DeliveryStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En cours' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Livré' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Échoué' },
  };

  const style = styles[status];

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
