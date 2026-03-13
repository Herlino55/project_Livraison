import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, CircleCheck as CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { StatsCard } from '../components/ui/StatsCard';
import { DeliveryCard } from '../components/ui/DeliveryCard';
import { Button } from '../components/ui/Button';
import type { Delivery } from '../types';
import { startOfDay, startOfWeek, endOfDay } from 'date-fns';

export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    weekDeliveries: 0,
    totalRevenue: 0,
    successRate: 0,
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const today = startOfDay(new Date()).toISOString();
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      const [todayResult, weekResult, revenueResult, activeResult, totalResult] = await Promise.all([
        supabase
          .from('deliveries')
          .select('id', { count: 'exact' })
          .gte('created_at', today)
          .lte('created_at', todayEnd),

        supabase
          .from('deliveries')
          .select('id', { count: 'exact' })
          .gte('created_at', weekStart),

        supabase
          .from('deliveries')
          .select('price')
          .eq('status', 'delivered'),

        supabase
          .from('deliveries')
          .select('*')
          .in('status', ['pending', 'in_progress'])
          .order('scheduled_date', { ascending: true })
          .limit(5),

        supabase
          .from('deliveries')
          .select('status', { count: 'exact' }),
      ]);

      const todayCount = todayResult.count || 0;
      const weekCount = weekResult.count || 0;
      const totalRevenue = revenueResult.data?.reduce((sum, d) => sum + Number(d.price), 0) || 0;

      const totalDeliveries = totalResult.count || 0;
      const deliveredCount = await supabase
        .from('deliveries')
        .select('id', { count: 'exact' })
        .eq('status', 'delivered');

      const successRate = totalDeliveries > 0
        ? ((deliveredCount.count || 0) / totalDeliveries) * 100
        : 0;

      setStats({
        todayDeliveries: todayCount,
        weekDeliveries: weekCount,
        totalRevenue,
        successRate: Math.round(successRate),
      });

      setActiveDeliveries(activeResult.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Aperçu de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Livraisons aujourd'hui"
          value={stats.todayDeliveries}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Livraisons cette semaine"
          value={stats.weekDeliveries}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Total des Livraisons"
          value={`${stats.totalRevenue.toFixed(2)} FCFA`}
          icon={DollarSign}
          color="yellow"
        />
        <StatsCard
          title="Taux de réussite"
          value={`${stats.successRate}%`}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Livraisons en cours</h2>
          <button
            onClick={() => navigate('/deliveries')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir tout
          </button>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucune livraison en cours</p>
            {user.email === "herlindongmo@gmail.com" && ( 
              <Button
                onClick={() => navigate('/deliveries/new')}
                variant="primary"
                size="sm"
                className="mt-4"
              >
                Créer une nouvelle livraison
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onClick={() => navigate(`/deliveries/${delivery.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
