/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PhotoUploader } from '../components/ui/PhotoUploader';

const deliverySchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  description: z.string().optional(),
  recipient_name: z.string().min(1, 'Nom du destinataire requis'),
  recipient_phone: z.string().min(9, 'Téléphone invalide'),
  delivery_address: z.string().min(1, 'Adresse requise'),
  price: z.string().min(0, 'Prix requis'),
  scheduled_date: z.string().min(1, 'Date requise'),
  notes: z.string().optional(),
});

type DeliveryForm = z.infer<typeof deliverySchema>;

export function NewDelivery() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryForm>({
    resolver: zodResolver(deliverySchema),
  });

  const uploadPhotos = async (deliveryId: string, files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${deliveryId}/${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photo_Livraison')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photo_Livraison')
        .getPublicUrl(filePath);

      return {
        delivery_id: deliveryId,
        photo_url: publicUrl,
        photo_type: 'product' as const,
      };
    });

    const photoRecords = await Promise.all(uploadPromises);

    const { error: insertError } = await supabase
      .from('delivery_photos')
      .insert(photoRecords);

    if (insertError) throw insertError;
  };

  const onSubmit = async (data: DeliveryForm) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          user_id: user.id,
          reference: data.reference,
          description: data.description || '',
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          delivery_address: data.delivery_address,
          price: parseFloat(data.price),
          scheduled_date: new Date(data.scheduled_date).toISOString(),
          notes: data.notes || '',
          status: 'pending',
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      if (photos.length > 0 && delivery) {
        await uploadPhotos(delivery.id, photos);
      }

      navigate('/deliveries');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle livraison</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Référence colis *"
              {...register('reference')}
              error={errors.reference?.message}
              placeholder="REF-12345"
            />

            <Input
              label="Prix transport (FCFA) *"
              type="number"
              step="0.01"
              {...register('price')}
              error={errors.price?.message}
              placeholder="25.00"
            />
          </div>

          <Input
            label="Description produit"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Description du colis"
          />

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos produit</h2>
            <PhotoUploader
              maxFiles={5}
              onPhotosChange={setPhotos}
            />
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations destinataire</h2>
            <div className="space-y-4">
              <Input
                label="Nom destinataire *"
                {...register('recipient_name')}
                error={errors.recipient_name?.message}
                placeholder="Jean Dupont"
              />

              <Input
                label="Téléphone *"
                type="tel"
                {...register('recipient_phone')}
                error={errors.recipient_phone?.message}
                placeholder="0612345678"
              />

              <Input
                label="Adresse de livraison *"
                {...register('delivery_address')}
                error={errors.delivery_address?.message}
                placeholder="123 Rue de la Paix, 75001 Paris"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Planification</h2>
            <div className="space-y-4">
              <Input
                label="Date et heure de livraison *"
                type="datetime-local"
                {...register('scheduled_date')}
                error={errors.scheduled_date?.message}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Instructions spéciales, code d'accès, etc."
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Création...' : 'Créer la livraison'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
