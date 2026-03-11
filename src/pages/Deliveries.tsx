import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ListFilter as Filter, CirclePlus as PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { DeliveryCard } from '../components/ui/DeliveryCard';
import { Button } from '../components/ui/Button';
import type { Delivery, DeliveryStatus } from '../types';

export function Deliveries() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      loadDeliveries();
    }
  }, [user, statusFilter]);

  const loadDeliveries = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('deliveries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      delivery.reference.toLowerCase().includes(searchLower) ||
      delivery.recipient_name.toLowerCase().includes(searchLower) ||
      delivery.delivery_address.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Livraisons</h1>
          <p className="text-gray-600 mt-1">{filteredDeliveries.length} livraison(s)</p>
        </div>
        <Button
          onClick={() => navigate('/deliveries/new')}
          className="flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Nouvelle livraison
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence, destinataire, adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-5 h-5" />
            Filtres
          </button>
        </div>

        {showFilters && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Tous' },
                { value: 'pending', label: 'En attente' },
                { value: 'in_progress', label: 'En cours' },
                { value: 'delivered', label: 'Livré' },
                { value: 'failed', label: 'Échoué' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value as DeliveryStatus | 'all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredDeliveries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">Aucune livraison trouvée</p>
          <Button
            onClick={() => navigate('/deliveries/new')}
            variant="primary"
          >
            Créer une livraison
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onClick={() => navigate(`/deliveries/${delivery.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
