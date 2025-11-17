import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import axios from '../api/axios';
import storage from '../utils/storage';

export default function RevenueWidget() {
  const [period, setPeriod] = useState('month');
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole] = useState(storage.getUser()?.role || null);

  useEffect(() => {
    if (userRole !== 'superadmin') {
      setLoading(false);
      return;
    }
    fetchRevenue();
  }, [period, userRole]);

  const fetchRevenue = async () => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`/stats/revenue?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRevenueData(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des revenus:', err);
      
      // Gestion des erreurs spécifiques
      if (err.code === 'ERR_NETWORK' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError('Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 3000.');
      } else if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (err.response?.status === 403) {
        setError('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      } else {
        setError(err.response?.data?.message || 'Erreur lors du chargement des revenus');
      }
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'superadmin') {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress sx={{ color: '#ffcc33' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: '#f44336' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const getPeriodLabel = () => {
    switch(period) {
      case 'today': return "Aujourd'hui";
      case 'week': return '7 derniers jours';
      case 'month': return 'Ce mois';
      case 'year': return 'Cette année';
      default: return 'Période';
    }
  };

  return (
    <Box>
      {/* Header avec sélecteur de période */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoneyIcon sx={{ color: '#ffcc33', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            Revenus
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            sx={{
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ffcc33',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ffb300',
              },
            }}
          >
            <MenuItem value="today">Aujourd'hui</MenuItem>
            <MenuItem value="week">7 derniers jours</MenuItem>
            <MenuItem value="month">Ce mois</MenuItem>
            <MenuItem value="year">Cette année</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Cartes de statistiques */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 3, mb: 1.5 }}>
        {/* Revenu total */}
        <Box sx={{
          background: '#fff9e6',
          borderRadius: '10px',
          padding: '10px 12px',
          color: '#1a1a1a',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '80px',
          border: '1px solid #ffcc33',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
        }}>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '14px', display: 'block', mb: 0.3 }}>
            Revenu Total
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px', mb: 0.3 }}>
            {formatCurrency(revenueData?.totalRevenue || 0)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <TrendingUpIcon sx={{ fontSize: 12 }} />
            <Typography variant="caption" sx={{ fontSize: '12px' }}>{getPeriodLabel()}</Typography>
          </Box>
          <AttachMoneyIcon sx={{
            position: 'absolute',
            right: -3,
            top: -3,
            fontSize: 55,
            opacity: 0.06
          }} />
        </Box>

        {/* Nombre de réservations */}
        <Box sx={{
          background: '#f1f8f4',
          borderRadius: '10px',
          padding: '10px 12px',
          color: '#1a1a1a',
          minHeight: '80px',
          border: '1px solid #4caf50',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
        }}>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '14px', display: 'block', mb: 0.3 }}>
            Réservations
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px', mb: 0.3 }}>
            {revenueData?.reservationsCount || 0}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '12px' }}>{getPeriodLabel()}</Typography>
        </Box>

        {/* Revenu moyen */}
        <Box sx={{
          background: '#fcf1e68f',
          borderRadius: '10px',
          padding: '10px 12px',
          color: '#1a1a1a',
          minHeight: '80px',
          border: '1px solid #e69151ff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
        }}>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '14px', display: 'block', mb: 0.3 }}>
            Revenu Moyen
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px', mb: 0.3 }}>
            {formatCurrency(Math.round(revenueData?.averageRevenue || 0))}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '12px' }}>Par réservation</Typography>
        </Box>
      </Box>

      {/* Top 5 routes par revenu */}
      {revenueData?.routeRevenue && revenueData.routeRevenue.length > 0 && (
        <Box sx={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#1a1a1a', fontSize: '15px' }}>
            Top 5 Routes par Revenu
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {revenueData.routeRevenue.map((route, index) => (
              <Box key={index} sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(255, 204, 51, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 204, 51, 0.15)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255, 204, 51, 0.1)',
                  transform: 'translateX(3px)'
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#ffcc33',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    fontSize: '12px'
                  }}>
                    {index + 1}
                  </Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '13px' }}>
                    {route.route}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700, color: '#4caf50', fontSize: '14px' }}>
                  {formatCurrency(route.revenue)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
