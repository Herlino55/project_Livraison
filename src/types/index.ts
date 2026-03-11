export type DeliveryStatus = 'pending' | 'in_progress' | 'delivered' | 'failed';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  user_id: string;
  client_id: string | null;
  reference: string;
  description: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  price: number;
  status: DeliveryStatus;
  scheduled_date: string;
  delivered_at: string | null;
  notes: string;
  signature: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPhoto {
  id: string;
  delivery_id: string;
  photo_url: string;
  photo_type: 'product' | 'proof';
  created_at: string;
}
