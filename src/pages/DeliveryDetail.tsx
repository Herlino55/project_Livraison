/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Calendar, Package, CreditCard as Edit, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import type { Delivery, DeliveryPhoto, DeliveryStatus } from '../types';

export function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [photos, setPhotos] = useState<DeliveryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadDelivery();
    }
  }, [id]);

  const loadDelivery = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const { data: deliveryData, error: deliveryError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', id)
        .single();

      if (deliveryError) throw deliveryError;

      const { data: photosData } = await supabase
        .from('delivery_photos')
        .select('*')
        .eq('delivery_id', id);

      setDelivery(deliveryData);
      setPhotos(photosData || []);
    } catch (error) {
      console.error('Error loading delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: DeliveryStatus) => {
    if (!id) return;

    setUpdating(true);
    try {
      const updates: any = { status: newStatus };
 
      if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await loadDelivery();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files?.[0]) return;

    setUpdating(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}/proof-${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photo_Livraison')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photo_Livraison')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('delivery_photos')
        .insert({
          delivery_id: id,
          photo_url: publicUrl,
          photo_type: 'proof',
        });

      if (insertError) throw insertError;

      await loadDelivery();
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Livraison non trouvée</p>
        <Button onClick={() => navigate('/deliveries')}>
          Retour aux livraisons
        </Button>
      </div>
    );
  }

  const productPhotos = photos.filter((p) => p.photo_type === 'product');
  const proofPhotos = photos.filter((p) => p.photo_type === 'proof');

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/deliveries')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour aux livraisons
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-6 h-6 text-gray-400" />
                <h1 className="text-2xl font-bold text-gray-900">{delivery.reference}</h1>
              </div>
              <p className="text-gray-600">{delivery.description}</p>
            </div>
            <StatusBadge status={delivery.status} />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowStatusModal(true)}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Changer statut
            </Button>

            <label className="cursor-pointer">
              <Button
                as="span"
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Ajouter preuve
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations destinataire</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{delivery.recipient_name}</p>
                  <p className="text-sm text-gray-600">{delivery.recipient_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400" />
                <p>{delivery.delivery_address}</p>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Livraison prévue</p>
                  <p className="font-medium">
                    {format(new Date(delivery.scheduled_date), 'dd/MM/yyyy à HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {delivery.notes && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{delivery.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <span className="text-gray-700 font-medium">Prix transport</span>
            <span className="text-2xl font-bold text-blue-600">{delivery.price.toFixed(2)} FCFA</span>
          </div>

          {productPhotos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos produit</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {productPhotos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photo_url}
                    alt="Product"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {proofPhotos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preuves de livraison</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {proofPhotos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photo_url}
                    alt="Proof"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Changer le statut</h3>
            <div className="space-y-2">
              {[
                { value: 'pending', label: 'En attente' },
                { value: 'in_progress', label: 'En cours' },
                { value: 'delivered', label: 'Livré' },
                { value: 'failed', label: 'Échoué' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => updateStatus(status.value as DeliveryStatus)}
                  disabled={updating || delivery.status === status.value}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    delivery.status === status.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {status.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => setShowStatusModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
