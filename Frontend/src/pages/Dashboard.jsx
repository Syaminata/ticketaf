import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, LabelList, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import RevenueWidget from "../components/RevenueWidget";

import PeopleIcon from '@mui/icons-material/People';
import DriveEtaIcon from '@mui/icons-material/DriveEta'; 
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'; 
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus'; 
import MapIcon from '@mui/icons-material/Map'; 
import WarningIcon from '@mui/icons-material/Warning'; 
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star'; 
import { Star, TrendingUp, Award, Package } from 'lucide-react';

const getMedalColor = (index) => {
    switch(index) {
      case 0: return '#FFD700'; // Or
      case 1: return '#C0C0C0'; // Argent
      case 2: return '#CD7F32'; // Bronze
      default: return '#ffcc33';
    }
  };

function Dashboard() {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userRole = user?.role || "Admin"; 

  const [stats, setStats] = useState({
    utilisateurs: 0,
    conducteurs: 0,
    reservations: 0,
    bus: 0,
    voyages: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animatedStats, setAnimatedStats] = useState({
    utilisateurs: 0,
    conducteurs: 0,
    reservations: 0,
    bus: 0,
    voyages: 0,
  });

  const [chartData, setChartData] = useState([
  { day: "Lun", value: 0 },
  { day: "Mar", value: 0 },
  { day: "Mer", value: 0 },
  { day: "Jeu", value: 0 },
  { day: "Ven", value: 0 },
  { day: "Sam", value: 0 },
  { day: "Dim", value: 0 }
]);

  
  const [recentReservations, setRecentReservations] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [realPopularRoutes, setRealPopularRoutes] = useState([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Gestion du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [userRoleData, setUserRoleData] = useState([]);
  const [realRevenueData, setRealRevenueData] = useState([]);
  const [topChauffeurs, setTopChauffeurs] = useState([]);
  const [topClientsColis, setTopClientsColis] = useState([]);
  const [topReservationsClients, setTopReservationsClients] = useState([]);
  const [topColisDestinations, setTopColisDestinations] = useState([]);



  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError("Token d'authentification manquant. Connexion requise.");
      setLoading(false);
      return;
    }

    // Récupérer les statistiques générales
    axios.get("/stats", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setStats(res.data);
      
      Object.keys(res.data).forEach(key => {
        animateNumber(key, res.data[key]);
      });
    })
    .catch(err => {
      console.error("Erreur lors de la récupération des statistiques:", err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError("Impossible de se connecter au serveur. Vérifiez que le backend est démarré.");
      } else {
        setError("Erreur lors du chargement des statistiques.");
      }
    });

    // Récupérer les données du graphique (réservations par jour)
    axios.get("/reservations/chart", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("Données du graphique reçues:", res.data);
      setChartData(res.data);
    })
    .catch(err => {
      console.error("Erreur lors de la récupération des données du graphique:", err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error("Le serveur backend n'est pas accessible. Vérifiez qu'il est démarré sur le port 3000.");
      } else {
        console.error("Détails de l'erreur:", err.response?.data);
      }
    });

    
    axios.get("/reservations", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("Réservations reçues:", res.data);
      console.log("Nombre de réservations:", res.data.length);
      
      // Filtrer et prendre les réservations les plus récentes
      const recentReservations = res.data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      console.log("Réservations récentes sélectionnées:", recentReservations);
      
      const formattedReservations = formatReservations(recentReservations);
      console.log("Réservations formatées:", formattedReservations);
      
      setRecentReservations(formattedReservations);
      
      // Calculer les routes populaires
      const popularRoutes = calculatePopularRoutes(res.data);
      console.log("Routes populaires calculées:", popularRoutes);
      setRealPopularRoutes(popularRoutes);
      
      setLoading(false);
    })
    .catch(err => {
      console.error("Erreur lors de la récupération des réservations:", err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error("Le serveur backend n'est pas accessible. Vérifiez qu'il est démarré sur le port 3000.");
      } else {
        console.error("Détails de l'erreur:", err.response?.data);
      }
      setRecentReservations([]);
      setLoading(false);
    });

    // Récupérer tous les utilisateurs et les grouper par rôle
    Promise.all([
      axios.get("/users", { headers: { Authorization: `Bearer ${token}` } }),
      axios.get("/drivers", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
    ])
    .then(([usersRes, driversRes]) => {
      console.log("Utilisateurs reçus:", usersRes.data);
      console.log("Chauffeurs reçus:", driversRes.data);
      
      // Traiter les utilisateurs normaux
      const users = usersRes.data || [];
      const drivers = driversRes.data || [];
      
      console.log("Utilisateurs normaux:", users.length);
      console.log("Chauffeurs séparés:", drivers.length);
      
      // Créer une liste des IDs des utilisateurs normaux pour éviter les doublons
      const userIds = new Set(users.map(user => user._id || user.id));
      
      // Ajouter seulement les chauffeurs qui ne sont pas déjà dans les utilisateurs
      const uniqueDrivers = drivers.filter(driver => {
        const driverId = driver._id || driver.id;
        return !userIds.has(driverId);
      });
      
      console.log("Chauffeurs uniques (non doublons):", uniqueDrivers.length);
      
      // Combiner sans doublons
      const allUsers = [...users];
      uniqueDrivers.forEach(driver => {
        allUsers.push({ ...driver, role: 'driver' });
      });
      
      console.log("Total utilisateurs uniques:", allUsers.length);
      
      // Grouper les utilisateurs par rôle
      const roleCounts = allUsers.reduce((acc, user) => {
        let role = user.role || 'client';
        
        // Normaliser les noms de rôles
        if (role === 'chauffeur' || role === 'conducteur' || role === 'driver') {
          role = 'driver';
        } else if (role === 'admin' || role === 'administrateur') {
          role = 'admin';
        } else {
          role = 'client';
        }
        
        console.log(`Utilisateur ${user.name || user.email}: rôle original = ${user.role}, rôle normalisé = ${role}`);
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});
      
      console.log("Comptage final par rôle:", roleCounts);
      
      // Formater les données pour le graphique
      const formattedData = [
        { 
          name: "Clients", 
          value: roleCounts.client || 0, 
          color: "#ffcc33" 
        },
        { 
          name: "Chauffeurs", 
          value: roleCounts.driver || 0, 
          color: "#C0C0C0" 
        },
        { 
          name: "Admins", 
          value: roleCounts.admin || 0, 
          color: "#CD7F32" 
        }
      ];
      
      // Filtrer les rôles qui ont des utilisateurs
      const filteredData = formattedData.filter(item => item.value > 0);
      
      setUserRoleData(filteredData.length > 0 ? filteredData : formattedData);
    })
    .catch(err => {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error("Le serveur backend n'est pas accessible. Vérifiez qu'il est démarré sur le port 3000.");
      }
      // Données de démonstration en cas d'erreur
      setUserRoleData([
        { name: "Clients", value: 45, color: "#2196f3" },
        { name: "Chauffeurs", value: 12, color: "#C0C0C0" },
        { name: "Admins", value: 3, color: "#ffcc33" }
      ]);
    });

    axios.get("/stats/top-drivers", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setTopChauffeurs(res.data);
    })
    .catch(err => {
      console.error("Erreur lors de la récupération des meilleurs chauffeurs:", err);
    });

    axios.get("/stats/top-clients", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("Top clients reçus:", res.data);
      console.log("Données des topClientsColis:", topClientsColis);
      setTopClientsColis(res.data);
    })
    .catch(err => {
      console.error("Erreur lors de la récupération des meilleurs clients:", err);
    });

    axios.get("/stats/top-reservations-clients", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("Données des meilleurs clients:", res.data);
      setTopReservationsClients(res.data);
    })
    .catch(err => {
      console.error("Erreur lors de la récupération des clients avec le plus de réservations:", err);
    });

    axios.get("/stats/top-colis-destinations", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setTopColisDestinations(res.data);
    })
    .catch(err => {
      console.error("Erreur lors de la récupération des destinations de colis:", err);
    });

  }, []);

  // Fonction pour formater les réservations récentes
  const formatReservations = (reservations) => {
    const now = new Date();
    // Normaliser la date actuelle à minuit pour comparer seulement les dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return reservations.map(reservation => {
      // Déterminer la date du voyage/bus
      let voyageDate = null;
      
      if (reservation.voyage?.date) {
        voyageDate = new Date(reservation.voyage.date);
      } else if (reservation.bus?.departureDate) {
        voyageDate = new Date(reservation.bus.departureDate);
      }
      
      // Déterminer le statut selon si la date est passée
      let status = 'Confirmé';
      if (voyageDate) {
        // Normaliser la date du voyage à minuit pour comparer seulement les dates
        const voyageDateOnly = new Date(voyageDate.getFullYear(), voyageDate.getMonth(), voyageDate.getDate());
        if (voyageDateOnly < today) {
          status = 'Passé';
        }
      }
      
      return {
        id: reservation._id,
        client: reservation.user?.name || reservation.user?.email || 'Client inconnu',
        route: reservation.voyage ? 
          `${reservation.voyage.from} → ${reservation.voyage.to}` :
          reservation.bus ? 
            (reservation.bus.from && reservation.bus.to ? 
              `${reservation.bus.from} → ${reservation.bus.to}` :
              `${reservation.bus.name} (${reservation.bus.plateNumber})`) :
            'Transport non spécifié',
        time: new Date(reservation.createdAt).toLocaleTimeString('fr-FR', { 
          day: 'numeric',
          month:'numeric',
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: status
      };
    });
  };

  // Fonction pour calculer les revenus par mois
  const calculateRevenueByMonth = (reservations) => {
    const monthlyRevenue = {};
    
    reservations.forEach(reservation => {
      let revenue = 0;
      
      if (reservation.voyage && reservation.voyage.price) {
        revenue = reservation.voyage.price * (reservation.quantity || 1);
      } else if (reservation.bus && reservation.bus.price) {
        revenue = reservation.bus.price * (reservation.quantity || 1);
      }
      
      if (revenue > 0) {
        const month = new Date(reservation.createdAt).toLocaleDateString('fr-FR', { month: 'short' });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenue;
      }
    });
    
    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  // Fonction pour calculer les routes populaires
  const calculatePopularRoutes = (reservations) => {
    console.log("Calcul des routes populaires avec:", reservations);
    
    const routeStats = {};
    
    reservations.forEach((reservation, index) => {
      console.log(`Réservation ${index}:`, reservation);
      
      let routeKey = '';
      let routeName = '';
      let revenue = 0;
      
      if (reservation.voyage) {
        routeKey = `${reservation.voyage.from}-${reservation.voyage.to}`;
        routeName = `${reservation.voyage.from} → ${reservation.voyage.to}`;
        revenue = (reservation.voyage.price || 0) * (reservation.quantity || 1);
        console.log(`Voyage trouvé: ${routeName}, prix: ${reservation.voyage.price}, quantité: ${reservation.quantity}`);
      } else if (reservation.bus) {
        // Utiliser le trajet du bus s'il existe, sinon le nom du bus
        if (reservation.bus.from && reservation.bus.to) {
          routeKey = `bus-${reservation.bus.from}-${reservation.bus.to}`;
          routeName = `${reservation.bus.from} → ${reservation.bus.to}`;
        } else {
          routeKey = `bus-${reservation.bus._id}`;
          routeName = `${reservation.bus.name} (${reservation.bus.plateNumber})`;
        }
        revenue = (reservation.bus.price || 0) * (reservation.quantity || 1);
        console.log(`Bus trouvé: ${routeName}, prix: ${reservation.bus.price}, quantité: ${reservation.quantity}`);
      } else {
        console.log("Aucun voyage ou bus trouvé pour cette réservation");
      }
      
      if (routeKey) {
        if (!routeStats[routeKey]) {
          routeStats[routeKey] = {
            route: routeName,
            bookings: 0,
            revenue: 0
          };
        }
        routeStats[routeKey].bookings += (reservation.quantity || 1);
        routeStats[routeKey].revenue += revenue;
        console.log(`Route ${routeKey} mise à jour:`, routeStats[routeKey]);
      }
    });
    
    console.log("Statistiques des routes:", routeStats);
    
    // Convertir en tableau et trier par nombre de réservations
    const result = Object.values(routeStats)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 3); // nbrs routes
    
    console.log("Routes populaires finales:", result);
    return result;
  };

   
  const animateNumber = (key, targetValue) => {
    setAnimatedStats(prev => ({
      ...prev,
      [key]: targetValue
    }));
  };

  const statConfig = {
    utilisateurs: { 
      color: "#b6660abd", 
      icon: PeopleIcon, 
      label: "Utilisateurs Inscrits",
    },
    conducteurs: { 
      color: "#b6660abd", 
      icon: DriveEtaIcon, 
      label: "Chaufeurs Actifs",
    },
    reservations: { 
      color: "#b6660abd", 
      icon: ConfirmationNumberIcon, 
      label: "Réservations Totales",
    },
    bus: { 
      color: "#b6660abd", 
      icon: DirectionsBusIcon, 
      label: "Bus Disponibles",
    },
    voyages: { 
      color: "#b6660abd", 
      icon: MapIcon, 
      label: "Voyages Planifiés",
    },
  };

  

  const Top5Tables = () => {
    const topChauffeurs = demoTopChauffeurs;
    const topClientsColis = demoTopClients;
  };

  return (
    <div style={{ 
      padding: "5px", 
      fontFamily: "'Inter', 'Roboto', sans-serif",
  
      minHeight: "100vh",
      color: "#1a1a1a"
    }}>

      {/* Bloc statistiques */}
      <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px", 
          marginBottom: "32px",
          backgroundColor: "white",
          padding:"20px",
          borderRadius: "15px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
        {Object.entries(animatedStats).map(([key, value]) => {
          const config = statConfig[key] || { color: "#ffcc33", icon: WarningIcon, label: key, trend: "+0%" };
          const IconComponent = config.icon; 
          return (
            <div
              key={key}
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "8px",
                color: "#1a1a1a",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                border: "1px solid #e0e0e0",
                borderLeft: `4px solid ${config.color}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = config.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                e.currentTarget.style.borderColor = "#e0e0e0";
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "500", color: "#666666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {config.label}
                  </div>
                  
                </div>
                <div style={{ 
                  background: "rgba(255, 204, 51, 0.1)", 
                  borderRadius: "8px", 
                  padding: "3px",
                  border: `1px solid ${config.color}`
                }}>
                  <IconComponent style={{ fontSize: "20px", color: config.color }} />
                </div>
              </div>
              
              <div style={{ 
                fontSize: "20px", 
                fontWeight: "700", 
                marginBottom: "4px",
                color: config.color
              }}>
                {value.toLocaleString()}
              </div>
              
            </div>
          );
        })}
      </div>

      {/* Graphique + Top 5 Clients Réservations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
      {/* Graphique */}
      <div style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
        border: "1px solid #e0e0e0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <BarChartIcon style={{ fontSize: "24px", color: "#ffcc33", marginRight: "8px" }} />
          <h3 style={{ color: "#1a1a1a", margin: 0, fontSize: "18px", fontWeight: "600" }}>
            Statistiques des Réservations
          </h3>
        </div>

        <div style={{ height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }} isAnimationActive={false}>
              <CartesianGrid strokeDasharray="3 3" />

              {/* Axe X avec jours */}
              <XAxis dataKey="day" 
                    tick={{ fontSize: 12, fill: "#666" }}
                    label={{ value: "Jours", position: "insideBottom", offset: -15 }} />

              {/* Axe Y avec nombre de réservations */}
              <YAxis tick={{ fontSize: 12, fill: "#666" }}
                    label={{ value: "Réservations", angle: -90, position: "insideLeft", offset: 10 }} />

              <Tooltip cursor={{ fill: "rgba(255, 204, 51, 0.1)" }} />

              {/* Barres avec valeurs au-dessus */}
              <Bar dataKey="value" fill="#b6660abd" radius={[8, 8, 0, 0]} barSize={60} isAnimationActive={false}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 12, fill: "#1a1a1a" }} />
              </Bar>

              
              <Line type="monotone" dataKey="value" stroke="#ffCC33" strokeWidth={2} dot={{ r: 4 }} 
                    isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Top 5 Clients avec le plus de Réservations */}
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #e0e0e0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
            <Star size={20} color="#ffcc33" style={{ marginRight: "8px" }} />
            <h3 style={{ color: "#1a1a1a", margin: 0, fontSize: "18px", fontWeight: "600" }}>
              Meilleurs clients
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {topReservationsClients.length > 0 ? (
              topReservationsClients.map((client, index) => (
                <div
                  key={client._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    background: index < 3 ? 'rgba(255, 204, 51, 0.05)' : '#fafafa',
                    borderRadius: '10px',
                    border: `2px solid ${index < 3 ? getMedalColor(index) + '40' : '#e0e0e0'}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    minWidth: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: index < 3 ? getMedalColor(index) : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '13px',
                    color: index < 3 ? '#1a1a1a' : '#666',
                    marginRight: '12px',
                    boxShadow: index < 3 ? `0 4px 8px ${getMedalColor(index)}40` : 'none'
                  }}>
                    {index + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '2px'
                    }}>
                      {client.name}
                    </div>
                    {client.numero && (
                      <div style={{
                        fontSize: '11px',
                        color: '#666'
                      }}>
                        {client.numero}
                      </div>
                    )}
                  </div>

                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: 'rgba(182, 102, 10, 0.15)',
                    color: '#b6660a'
                  }}>
                    {client.reservationCount} 🎫
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                  🎫
                </div>
                <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                  Aucun client trouvé
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        
        {/* Répartition des utilisateurs par rôle */}
        <div style={{ 
          background: "#ffffff",
          borderRadius: "12px", 
          padding: "20px",
          color: "#1a1a1a",
          border: "1px solid #e0e0e0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
        }}>
          <h4 style={{ 
            margin: "0 0 16px 0", 
            fontSize: "18px", 
            fontWeight: "600",
            display: 'flex', 
            alignItems: 'center',
            color: "#1a1a1a"
          }}>
            <PeopleIcon style={{ marginRight: '8px', fontSize: '20px', color: '#ffcc33' }} /> 
            Utilisateurs par Rôle
          </h4>
          
          <div style={{ height: "200px" }}>
            {userRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#666',
                fontSize: '14px'
              }}>
              </div>
            )}
          </div>
          
          {/* Légende */}
          {userRoleData.length > 0 && (
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "8px", 
              marginTop: "16px" 
            }}>
              {userRoleData.map((item, index) => (
              <div key={index} style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "rgba(255, 204, 51, 0.05)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 204, 51, 0.2)"
              }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ 
                    width: "12px", 
                    height: "12px", 
                    borderRadius: "50%", 
                    backgroundColor: item.color,
                    marginRight: "8px"
                  }} />
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>{item.name}</span>
                </div>
                <span style={{ 
                  fontSize: "16px", 
                  fontWeight: "700", 
                  color: item.color 
                }}>
                  {item.value}
                </span>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Section Réservations Récentes */}
        <div style={{ 
          background: "#ffffff",
          borderRadius: "12px", 
          padding: "20px",
          color: "#1a1a1a",
          border: "1px solid #e0e0e0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
        }}>
          <h4 style={{ 
            margin: "0 0 16px 0", 
            fontSize: "18px", 
            fontWeight: "600",
            display: 'flex', 
            alignItems: 'center',
            color: "#1a1a1a"
          }}>
            <AccessTimeIcon style={{ marginRight: '8px', fontSize: '20px', color: '#ffcc33' }} /> 
            Réservations Récentes
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentReservations.length > 0 ? (
              recentReservations.map((reservation) => (
              <div key={reservation.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px',
                background: 'rgba(255, 204, 51, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 204, 51, 0.2)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: '#ffcc33', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#1a1a1a',
                    fontWeight: '700'
                  }}>
                    {reservation.client.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>
                      {reservation.client}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {reservation.route} • {reservation.time}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: reservation.status === 'Confirmé' 
                    ? 'rgba(76, 175, 80, 0.1)' 
                    : reservation.status === 'Passé'
                    ? 'rgba(158, 158, 158, 0.1)'
                    : 'rgba(255, 152, 0, 0.1)',
                  color: reservation.status === 'Confirmé' 
                    ? '#4caf50' 
                    : reservation.status === 'Passé'
                    ? '#9e9e9e'
                    : '#ff9800'
                }}>
                  {reservation.status}
                </div>
              </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#666',
                fontSize: '14px'
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '16px',
                  opacity: 0.3
                }}>
                  📋
                </div>
                <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                  Aucune réservation récente
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  Les nouvelles réservations apparaîtront ici
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section des tableaux Top Chauffeurs et Top Clients */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <TrendingUp size={24} color="#ffcc33" />
          Tableaux des meilleurs
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile || userRole === 'admin' || userRole === 'gestionnaireColis' ? '1fr' : '2fr 1.5fr',
          gap: '16px',
          width: '100%'
        }}>
          {/* Top 5 Chauffeurs - Masqué pour admin et gestionnaireColis */}
          {userRole !== 'gestionnaireColis' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            border: '1px solid #e0e0e0',
            height: 'fit-content',
            gridColumn: 'auto'
          }}>
          <h4 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            color: '#1a1a1a'
          }}>
            <Award size={20} color="#ffcc33" style={{ marginRight: '8px' }} />
            Top 5 Chauffeurs
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topChauffeurs.length > 0 ? (
              topChauffeurs.map((chauffeur, index) => (
                <div
                  key={chauffeur._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    background: index < 3 ? 'rgba(255, 204, 51, 0.05)' : '#fafafa',
                    borderRadius: '12px',
                    border: `2px solid ${index < 3 ? getMedalColor(index) + '40' : '#e0e0e0'}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Rang avec médaille */}
                  <div style={{
                    minWidth: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: index < 3 ? getMedalColor(index) : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px',
                    color: index < 3 ? '#1a1a1a' : '#666',
                    marginRight: '16px',
                    position: 'relative',
                    boxShadow: index < 3 ? `0 4px 8px ${getMedalColor(index)}40` : 'none'
                  }}>
                    {index < 3 ? (
                      index + 1
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Informations du chauffeur */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '4px'
                    }}>
                      {chauffeur.name || 'Chauffeur sans nom'}
                    </div>
                    {chauffeur.phone && (
                      <div style={{
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        {chauffeur.phone}
                      </div>
                    )}
                  </div>

                  {/* Statistiques */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        padding: '6px 12px',
                        color: '#1a1a1a',
                        fontSize: '14px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{chauffeur.tripCount || 0}</span>
                        <span>voyage{chauffeur.tripCount !== 1 ? 's' : ''}</span>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: chauffeur.isActive
                        ? 'rgba(76, 175, 80, 0.1)'   // Actif
                        : 'rgba(244, 67, 54, 0.1)', // Inactif
                      color: chauffeur.isActive
                        ? '#4caf50'
                        : '#f44336'
                      }}>
                        {chauffeur.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                  🚗
                </div>
                <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                  Aucun chauffeur trouvé
                </div>
              </div>
            )}
          </div>
        </div>
          )}

        {/* Top 5 Clients - Masqué pour les administrateurs */}
        {userRole !== 'admin' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          border: '1px solid #e0e0e0',
          height: 'fit-content'
        }}>
          <h4 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            color: '#1a1a1a'
          }}>
            <Package size={20} color="#ffcc33" style={{ marginRight: '8px' }} />
            Top 5 Clients Colis
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topClientsColis.length > 0 ? (
              topClientsColis.map((client, index) => (
                <div
                  key={client._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    background: index < 3 ? 'rgba(255, 204, 51, 0.05)' : '#fafafa',
                    borderRadius: '12px',
                    border: `2px solid ${index < 3 ? getMedalColor(index) + '40' : '#e0e0e0'}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Rang avec médaille */}
                  <div style={{
                    minWidth: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: index < 3 ? getMedalColor(index) : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px',
                    color: index < 3 ? '#1a1a1a' : '#666',
                    marginRight: '16px',
                    position: 'relative',
                    boxShadow: index < 3 ? `0 4px 8px ${getMedalColor(index)}40` : 'none'
                  }}>
                    {index < 3 ? (
                      index + 1//<Star size={20} fill="currentColor" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Informations du client */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '4px'
                    }}>
                      {client.name || 'Client sans nom'}
                    </div>
                    {client.phone && (
                      <div style={{
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        {client.phone}
                      </div>
                    )}
                  </div>

                  {/* Statistiques */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px'
                  }}>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      background: 'rgba(196, 191, 180, 0.15)', // jaune soft
                      color: '#ff9800'
                    }}>
                      {client.totalColis} colis
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      {client.lastActivity 
                        ? new Date(client.lastActivity).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })
                        : 'Aucune activité'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                  📦
                </div>
                <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                  Aucun client trouvé
                </div>
              </div>
            )}
          </div>
        </div>
        )}
        </div>
      </div>

      {/* Widget des revenus */}
      <div style={{ marginBottom: "24px" }}>
        <RevenueWidget />
      </div>
      
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
}

export default Dashboard;
