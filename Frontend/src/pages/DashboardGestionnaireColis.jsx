import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function DashboardGestionnaireColis() {
  const [stats, setStats] = useState({
    colisTotal: 0,
    colisLivre: 0,
    colisEnCours: 0,
    colisEnAttente: 0,
    clients: 0,
    chauffeurs: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentColis, setRecentColis] = useState([]);
  const [chartData, setChartData] = useState([
    { day: "Lun", value: 0 },
    { day: "Mar", value: 0 },
    { day: "Mer", value: 0 },
    { day: "Jeu", value: 0 },
    { day: "Ven", value: 0 },
    { day: "Sam", value: 0 },
    { day: "Dim", value: 0 }
  ]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError("Token d'authentification manquant. Connexion requise.");
      setLoading(false);
      return;
    }

    // Récupérer les statistiques des colis
    const fetchStats = async () => {
      try {
        const [colisRes, clientsRes, chauffeursRes] = await Promise.all([
          axios.get("/colis/stats", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("/users/count", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("/drivers/count", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setStats({
          ...colisRes.data,
          clients: clientsRes.data.count || 0,
          chauffeurs: chauffeursRes.data.count || 0
        });
      } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err);
        setError("Erreur lors du chargement des statistiques.");
      }
    };

    // Récupérer les colis récents
    const fetchRecentColis = async () => {
      try {
        const res = await axios.get("/colis?limit=5", { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setRecentColis(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des colis récents:", err);
      }
    };

    // Récupérer les données du graphique (colis par jour)
    const fetchChartData = async () => {
      try {
        const res = await axios.get("/colis/chart", { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setChartData(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données du graphique:", err);
      }
    };

    Promise.all([
      fetchStats(),
      fetchRecentColis(),
      fetchChartData()
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Chargement des données...</div>;
  if (error) return <div className="p-4 text-red-500">{error.toString()}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord - Gestionnaire de Colis</h1>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Colis" 
          value={stats.colisTotal} 
          icon={<LocalShippingIcon className="text-blue-500" />}
          color="blue"
        />
        <StatCard 
          title="Colis Livrés" 
          value={stats.colisLivre} 
          icon={<CheckCircleIcon className="text-green-500" />}
          color="green"
        />
        <StatCard 
          title="En cours" 
          value={stats.colisEnCours} 
          icon={<PendingIcon className="text-yellow-500" />}
          color="yellow"
        />
        <StatCard 
          title="En attente" 
          value={stats.colisEnAttente} 
          icon={<ErrorIcon className="text-red-500" />}
          color="red"
        />
      </div>

      {/* Graphique des colis */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Statistiques des colis (7 derniers jours)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4F46E5" name="Nombre de colis" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers colis */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Derniers colis</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentColis.length > 0 ? (
                  recentColis.map((colis) => (
                    <tr key={colis._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {colis.trackingNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {colis.expediteur?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={colis.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(colis.createdAt), 'PPpp', { locale: fr })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucun colis trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistiques des utilisateurs */}
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Répartition des utilisateurs</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Clients', value: stats.clients },
                      { name: 'Chauffeurs', value: stats.chauffeurs },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[stats.clients, stats.chauffeurs].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-4">
              <a 
                href="/colis/nouveau" 
                className="p-3 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-600 transition-colors"
              >
                Nouveau colis
              </a>
              <a 
                href="/colis" 
                className="p-3 bg-green-500 text-white rounded-lg text-center hover:bg-green-600 transition-colors"
              >
                Voir tous les colis
              </a>
              <a 
                href="/clients" 
                className="p-3 bg-purple-500 text-white rounded-lg text-center hover:bg-purple-600 transition-colors"
              >
                Gérer les clients
              </a>
              <a 
                href="/chauffeurs" 
                className="p-3 bg-yellow-500 text-white rounded-lg text-center hover:bg-yellow-600 transition-colors"
              >
                Gérer les chauffeurs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour les cartes de statistiques
function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700'
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Composant pour afficher le statut d'un colis
function StatusBadge({ status }) {
  const statusConfig = {
    'en_attente': { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    'en_cours': { text: 'En cours', color: 'bg-blue-100 text-blue-800' },
    'livre': { text: 'Livré', color: 'bg-green-100 text-green-800' },
    'retour': { text: 'Retour', color: 'bg-red-100 text-red-800' },
    'annule': { text: 'Annulé', color: 'bg-gray-100 text-gray-800' },
  };

  const config = statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.text}
    </span>
  );
}

export default DashboardGestionnaireColis;
