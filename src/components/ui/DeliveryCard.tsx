import { MapPin, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import type { Delivery } from '../../types';

interface DeliveryCardProps {
  delivery: Delivery;
  onClick?: () => void;
}

export function DeliveryCard({ delivery, onClick }: DeliveryCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 text-left"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{delivery.reference}</h3>
          <p className="text-sm text-gray-600 mt-1">{delivery.recipient_name}</p>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{delivery.delivery_address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(delivery.scheduled_date), 'dd/MM/yyyy HH:mm')}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          <span className="font-medium text-gray-900">{delivery.price.toFixed(2)} FCFA</span>
        </div>
      </div>
    </button>
  );
}
