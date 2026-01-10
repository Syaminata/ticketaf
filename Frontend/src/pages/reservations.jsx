import React, { useState, useEffect } from 'react';
import { reservationsAPI } from '../api/reservations';
import ConfirmationDialog from '../components/ConfirmationDialog';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Autocomplete,
  TablePagination,
  Menu,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add,
  Person, 
  DirectionsBus,
  DirectionsCar,
  EventSeat,
  LocalShipping,
  Visibility,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  LocationOn,
  Cancel,
  Receipt,
  AttachMoney,
  EventNote,
  Route,
  ArrowForward,
  AccessTime,
  ReceiptLong,
  ReceiptLongOutlined,
  AccountCircle,
  Phone,
  Info
} from '@mui/icons-material';
import { Divider, styled } from '@mui/material';

// Composant pour afficher une ligne d'information
const InfoRow = ({ label, children }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
    <Typography variant="subtitle2" sx={{ color: '#666', minWidth: '160px' }}>{label}</Typography>
    <Box sx={{ flex: 1, textAlign: 'right' }}>
      {children}
    </Box>
  </Box>
);

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [users, setUsers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loadingBuses, setLoadingBuses] = useState(false);
  const [open, setOpen] = useState(false);
  const [editReservation, setEditReservation] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsReservation, setDetailsReservation] = useState(null);
  const [formData, setFormData] = useState({
    userId: null,
    transportMode: '', // 'voyage' ou 'bus'
    voyageId: null,
    busId: null,
    ticket: 'place',
    quantity: 1,
    description: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false
  });

  // Etat pour création rapide d'utilisateur
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [newUserError, setNewUserError] = useState('');
  const [newUserData, setNewUserData] = useState({ name: '', email: '', numero: '', password: '', role: 'client' });



  // ----- Fetch data -----
  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationsAPI.getAllReservations();
      console.log('Réservations récupérées:', res); // Debug
      setReservations(res);
      setError('');
    } catch (err) {
      console.error('Erreur lors du chargement des réservations:', err);
      if (err.response?.status === 401) {
        setError('Token d\'authentification expiré. Veuillez vous reconnecter.');
      } else {
        setError("Erreur lors du chargement des réservations: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (reservation) => {
    setDetailsReservation(reservation);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setDetailsReservation(null);
  };

  const fetchVoyages = async () => {
    try {
      console.log(' Récupération des voyages...');
      const token = sessionStorage.getItem('token');
      console.log('Token:', token ? 'Présent' : 'Absent');
      
      const response = await fetch('https://ticket-taf.itea.africa/api/voyages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token d\'authentification expiré. Veuillez vous reconnecter.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(' Voyages récupérés:', data);
      console.log('Nombre de voyages:', data?.length || 0);
      setVoyages(data || []);
    } catch (err) {
      console.error(' Erreur lors de la récupération des voyages:', err);
      setError('Erreur lors du chargement des voyages: ' + err.message);
      setVoyages([]); // S'assurer que voyages est un tableau vide en cas d'erreur
    }
  };

  const upcomingVoyages = (voyages || []).filter((v) => {
    if (!v?.date) return false;
    const voyageDate = new Date(v.date);
    const now = new Date();
    return voyageDate >= now; // garder seulement les voyages futurs ou aujourd'hui
  });

  const fetchUsers = async () => {
    try {
      console.log('🔍 Récupération des utilisateurs...');
      const token = sessionStorage.getItem('token');
      console.log('Token:', token ? 'Présent' : 'Absent');
      
      const response = await fetch('https://ticket-taf.itea.africa/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token d\'authentification expiré. Veuillez vous reconnecter.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('👥 Utilisateurs récupérés:', data);
      console.log('👥 Nombre d\'utilisateurs:', data?.length || 0);
      setUsers(data || []);
    } catch (err) {
      console.error(' Erreur lors de la récupération des utilisateurs:', err);
      setError('Erreur lors du chargement des utilisateurs: ' + err.message);
      setUsers([]); // S'assurer que users est un tableau vide en cas d'erreur
    }
  };

  const fetchBuses = async () => {
    try {
      setLoadingBuses(true);
      console.log('Récupération des bus...');
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }
      
      const response = await fetch('https://ticket-taf.itea.africa/api/buses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setBuses(data);
      setError('');
      console.log(`${data.length} bus chargés avec succès`);
    } catch (error) {
      console.error('Erreur lors du chargement des bus:', error);
      setError('Erreur lors du chargement des bus. Veuillez réessayer.');
    } finally {
      setLoadingBuses(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchVoyages();
    fetchUsers();
    fetchBuses();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // ----- Dialog -----
  const handleOpen = (reservation = null) => {
    setError('');
    setSuccess('');
    
    // Réinitialiser les données
    setFormData({
      userId: null,
      transportMode: '',
      voyageId: null,
      busId: null,
      ticket: 'place',
      quantity: 1,
      description: ''
    });
    
    setEditReservation(reservation);
    if (reservation) {
      // Déterminer le mode de transport basé sur les données existantes
      const transportMode = reservation.voyage ? 'voyage' : reservation.bus ? 'bus' : '';
      setFormData({
        userId: reservation.user || null,
        transportMode: transportMode,
        voyageId: reservation.voyage || null,
        busId: reservation.bus || null,
        ticket: reservation.ticket,
        quantity: reservation.quantity || 1,
        description: reservation.description || ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditReservation(null);
    setFormData({ 
      userId: null, 
      transportMode: '', 
      voyageId: null, 
      busId: null, 
      ticket: 'place', 
      quantity: 1,
      description: ''
    });
  };

  // Handlers création utilisateur
  const openNewUser = () => {
    setNewUserError('');
    setNewUserData({ name: '', email: '', numero: '', password: '', role: 'client' });
    setNewUserOpen(true);
  };
  const closeNewUser = () => {
    setNewUserOpen(false);
    setNewUserError('');
  };
  const handleCreateUser = async () => {
    setNewUserError('');
    if (!newUserData.name || !newUserData.numero || !newUserData.password) {
      setNewUserError('Le nom, le numéro et le mot de passe sont requis');
      return;
    }
    const phoneRegex = /^(77|78|76|70|75|33|71)\d{7}$/;
    if (!phoneRegex.test(newUserData.numero)) {
      setNewUserError('Numéro invalide (format: 77/78/76/70/75/33/71 + 7 chiffres)');
      return;
    }
    setNewUserLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const resp = await fetch('https://ticket-taf.itea.africa/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUserData)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Erreur à la création de l'utilisateur");
      const created = data.user;
      setUsers(prev => [created, ...prev]);
      setFormData(prev => ({ ...prev, userId: created }));
      setSuccess('Utilisateur créé et sélectionné');
      setNewUserOpen(false);
    } catch (err) {
      setNewUserError(err.message || 'Erreur lors de la création');
    } finally {
      setNewUserLoading(false);
    }
  };


  // ----- CRUD -----
  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    // Validation
    if (!formData.userId) {
      setError('Veuillez sélectionner un utilisateur');
      return;
    }
    
    if (!formData.transportMode) {
      setError('Veuillez choisir un mode de transport');
      return;
    }
    
    if (formData.transportMode === 'voyage' && !formData.voyageId) {
      setError('Veuillez sélectionner un voyage');
      return;
    }
    
    if (formData.transportMode === 'bus' && !formData.busId) {
      setError('Veuillez sélectionner un bus');
      return;
    }

    // Vérifier les places disponibles (uniquement pour les places, pas les colis)
    if (formData.ticket === 'place' && formData.transportMode === 'voyage' && formData.voyageId) {
      const selectedVoyage = voyages.find(v => v._id === formData.voyageId._id);
      if (selectedVoyage && selectedVoyage.availableSeats < formData.quantity) {
        setError(`Pas assez de places disponibles. Places restantes: ${selectedVoyage.availableSeats}`);
        return;
      }
    }

    if (formData.ticket === 'place' && formData.transportMode === 'bus' && formData.busId) {
      const selectedBus = buses.find(b => b._id === formData.busId._id);
      if (selectedBus && selectedBus.availableSeats < formData.quantity) {
        setError(`Pas assez de places disponibles. Places restantes: ${selectedBus.availableSeats}`);
        return;
      }
    }
    
    // Validation plus stricte
    if (!formData.userId || !formData.userId._id) {
      setError('Utilisateur invalide');
      return;
    }
    
    if (formData.transportMode === 'voyage' && (!formData.voyageId || !formData.voyageId._id)) {
      setError('Voyage invalide');
      return;
    }

    if (formData.transportMode === 'bus' && (!formData.busId || !formData.busId._id)) {
      setError('Bus invalide');
      return;
    }
    // Champs colis obligatoires (description uniquement)
    if (formData.ticket === 'colis' && !formData.description) {
      setError('Veuillez saisir la description du colis');
      return;
    }
    
    setLoading(true);

    try {
      const reservationData = {
        userId: formData.userId._id || formData.userId,
        ticket: formData.ticket,
        quantity: formData.quantity || 1,
      };

      // Ajouter voyageId ou busId selon ce qui est sélectionné
      if (formData.voyageId) {
        reservationData.voyageId = formData.voyageId._id || formData.voyageId;
      }
      if (formData.busId) {
        reservationData.busId = formData.busId._id || formData.busId;
      }
      // Ajouter description si colis
      if (formData.ticket === 'colis') {
        reservationData.description = formData.description;
      }
      
      console.log('Données à envoyer:', reservationData); // Debug
      
      if (editReservation) {
        await reservationsAPI.updateReservation(editReservation._id, reservationData);
        setSuccess('Réservation mise à jour avec succès');
      } else {
        await reservationsAPI.createReservation(reservationData);
        setSuccess('Réservation créée avec succès');
      }
      
      await fetchReservations();
      handleClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
  const reservation = reservations.find(r => r._id === id);
  const info = reservation
    ? `${reservation.user?.name || 'Client'} - ${
        reservation.voyage
          ? `${reservation.voyage.from} → ${reservation.voyage.to}`
          : reservation.bus
          ? `${reservation.bus.from} → ${reservation.bus.to}`
          : 'Trajet non défini'
      }`
    : 'cette réservation';

  setConfirmDialog({
    open: true,
    title: 'Supprimer la réservation',
    message: `Êtes-vous sûr de vouloir supprimer définitivement ${info} ?`,
    onConfirm: () => confirmDelete(id),
    loading: false
  });
};

const confirmDelete = async (id) => {
  setConfirmDialog(prev => ({ ...prev, loading: true }));

  try {
    await reservationsAPI.deleteReservation(id);
    setSuccess('Réservation supprimée avec succès');
    await fetchReservations();
    setConfirmDialog(prev => ({ ...prev, open: false }));
  } catch (err) {
    console.error(err);
    setError('Erreur lors de la suppression.');
    setConfirmDialog(prev => ({ ...prev, loading: false }));
  }
};
  // ----- Helpers -----
  const getStatusColor = (dateString) => {
    const voyageDate = new Date(dateString);
    const now = new Date();
    const diffTime = voyageDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error';
    if (diffDays === 0) return 'warning';
    if (diffDays <= 7) return 'info';
    return 'success';
  };

  const getStatusText = (dateString) => {
    const voyageDate = new Date(dateString);
    const now = new Date();
    const diffTime = voyageDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Terminé';
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays <= 7) return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return 'Programmé';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format de date court et lisible avec heure (ex: 28/10/2025 14:30)
  const formatDateShort = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} à ${timeStr}`;
  };

  const getTicketIcon = (ticket) => {
    return ticket === 'colis' ? <LocalShipping /> : <EventSeat />;
  };

  const getTicketColor = (ticket) => {
    return ticket === 'colis' ? 'secondary' : 'primary';
  };

  // Masquer les réservations passées (affichées plutôt dans Historique)
  const isReservationPast = (reservation) => {
    const dateStr = reservation?.voyage?.date || reservation?.bus?.departureDate;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d < now; // si la date est passée
  };

  // Marquer comme annulée si entité liée supprimée (voyage/bus manquant)
  const isReservationCanceled = (reservation) => {
    const hasVoyageRef = Boolean(reservation?.voyageId || reservation?.voyage?._id);
    const hasBusRef = Boolean(reservation?.busId || reservation?.bus?._id);
    const voyageMissing = hasVoyageRef && !reservation?.voyage;
    const busMissing = hasBusRef && !reservation?.bus;
    return Boolean(voyageMissing || busMissing);
  };

  const visibleReservations = (reservations || []).filter(r => !isReservationPast(r) && !isReservationCanceled(r));

  // Filtrage des réservations
  const filteredReservations = visibleReservations.filter(reservation => {
    if (!reservation) return false;
    
    // Filtre par recherche textuelle
    const searchTermLower = searchTerm ? searchTerm.toLowerCase() : '';
    const userName = reservation.user?.name ? reservation.user.name.toLowerCase() : '';
    const voyageInfo = reservation.voyage ? `${reservation.voyage.from} ${reservation.voyage.to}`.toLowerCase() : '';
    const busInfo = reservation.bus ? reservation.bus.marque.toLowerCase() : '';
    const status = reservation.status ? reservation.status.toLowerCase() : '';
    
    const matchesSearch = searchTerm === '' ||
      userName.includes(searchTermLower) ||
      voyageInfo.includes(searchTermLower) ||
      busInfo.includes(searchTermLower) ||
      status.includes(searchTermLower) ||
      (reservation._id && reservation._id.toLowerCase().includes(searchTermLower));
    
    let matchesDateRange = true;
    
    // Vérifier si des dates de filtre sont définies
    if (dateRange.startDate || dateRange.endDate) {
      // Utiliser la date du voyage si disponible, sinon utiliser la date de création
      const voyageDate = reservation.voyage?.date || reservation.bus?.departureDate || reservation.createdAt;
      const reservationDate = voyageDate ? new Date(voyageDate) : null;
      
      if (!reservationDate) {
        // Si la réservation n'a pas de date, on la filtre si un filtre de date est actif
        matchesDateRange = false;
      } else {
        // Créer des copies des dates pour éviter de modifier les originaux
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        
        // Convertir en timestamp pour une comparaison plus fiable
        const reservationTimestamp = reservationDate.getTime();
        
        // Vérifier la date de début si elle est définie
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
          if (reservationTimestamp < startDate.getTime()) {
            matchesDateRange = false;
          }
        }
        
        // Vérifier la date de fin si elle est définie et que la date de début est valide
        if (matchesDateRange && endDate) {
          endDate.setHours(23, 59, 59, 999);
          if (reservationTimestamp > endDate.getTime()) {
            matchesDateRange = false;
          }
        }
      }
    }
    
    return matchesSearch && matchesDateRange;
  });

  const paginatedReservations = filteredReservations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Gérer le changement de type de transport
  const handleTransportModeChange = (event) => {
    const mode = event.target.value;
    setFormData(prev => ({
      ...prev,
      transportMode: mode,
      busId: null // Réinitialiser la sélection de bus
    }));
  };

  // Filtrer les bus en fonction du type sélectionné
  const filteredBuses = buses.filter(bus => {
    if (!bus.isActive) return false;
    if (formData.transportMode === 'minibus') {
      return bus.capacity <= 30;
    } else if (formData.transportMode === 'bus') {
      return bus.capacity > 30;
    }
    return false;
  });

  return (
    <Box sx={{ p: 1, backgroundColor: '#ffff', minHeight: '100vh' }}>
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title || 'Confirmation de suppression'}
        message={confirmDialog.message || "Voulez-vous vraiment supprimer cette réservation ?"}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="delete"
        loading={confirmDialog.loading}
      />
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '20px', color: '#1a1a1a', mb: 1 }}>
            Liste des Réservations
          </Typography>
          <Typography variant="body1" sx={{ color: '#666666', fontSize: '16px' }}>
            Gérez les réservations de vos clients ({visibleReservations.length} réservation{visibleReservations.length > 1 ? 's' : ''})
          </Typography>
          
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => handleOpen()} 
          startIcon={<Add />}
          sx={{ 
            backgroundColor: 'transparrent',
            border: '2px solid #ffcc33',
            color: '#b6660abd',
            fontWeight: 500,
            px: 3,
            py: 1.5,
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '14px',
            '&:hover': {
              backgroundColor: '#ffffffff',
              borderColor: '#ffb300',
              transform: 'translateY(-2px)',
            },
          }}
        >
          Nouvelle Réservation
        </Button>
      </Box>
      {/* Recherche */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        mb: 3,
        justifyContent: 'space-between',
        flexWrap: 'wrap'
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Rechercher par client, trajet ou date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#666', mr: 1, fontSize: 20 }} />
              }}
              sx={{
                width: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
            <Button
              variant="outlined"
              onClick={() => setShowDateFilter(!showDateFilter)}
              startIcon={<FilterListIcon />}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                borderColor: '#ffcc33',
                color: '#1a1a1a',
                '&:hover': {
                  borderColor: '#e6b800',
                  backgroundColor: 'rgba(255, 204, 51, 0.08)',
                },
              }}
            >
              Filtre par date
            </Button>
            
            {showDateFilter && (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                alignItems: 'center',
                p: 2, 
                bgcolor: 'background.paper',
                borderRadius: '12px',
                mt: 1,
                width: '100%',
                flexWrap: 'wrap'
              }}>
                <TextField
                  label="Date de début"
                  type="date"
                  size="small"
                  value={dateRange.startDate || ''}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: '#ffcc33',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ffcc33',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#ffcc33',
                    },
                  }}
                />
                <Typography>au</Typography>
                <TextField
                  label="Date de fin"
                  type="date"
                  size="small"
                  value={dateRange.endDate || ''}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: '#ffcc33',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ffcc33',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#ffcc33',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => setDateRange({ startDate: null, endDate: null })}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    backgroundColor: '#ff4d4d',
                    '&:hover': {
                      backgroundColor: '#ff1a1a',
                    },
                  }}
                >
                  Réinitialiser
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: '8px' }}
          action={
            error.includes('Token d\'authentification expiré') ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  sessionStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                sx={{ fontWeight: 600 }}
              >
                Se reconnecter
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }}>
          {success}
        </Alert>
      )}

      {/* Tableau des réservations */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#ffcc33' }} />
        </Box>
      ) : visibleReservations.length > 0 ? (
        <Paper sx={{ 
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(206, 204, 204, 0.43)'
        }}>
          <Table>
            <TableHead sx={{ 
              borderBottom: '3px solid #ffcc33',
              '& .MuiTableCell-root': {
                borderBottom: '3px solid #ffcc33',
                color: '#1a1a1a',
                fontWeight: 700,
                fontSize: '16px',
                py: 2
              }
            }}>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Trajet</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Prix</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReservations.map((reservation) => (
                <TableRow 
                  key={reservation._id}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                    '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' },
                    '& td': {
                      color: '#1a1a1a',
                      py: 2,
                      borderBottom: '1px solid #f0f0f0',
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Person sx={{ color: '#ffcc33', fontSize: 24 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {reservation.user?.name || 'Non spécifié'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666666', mt: 0.5 }}>
                          {reservation.user?.email || ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#1a1a1a' }}>
                      {reservation.user?.numero || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {isReservationCanceled(reservation)
                            ? 'Trajet annulé'
                            : reservation.voyage
                            ? `${reservation.voyage.from} → ${reservation.voyage.to}`
                            : reservation.bus
                            ? `${reservation.bus.from} → ${reservation.bus.to}`
                            : 'Non défini'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16, color: '#ffcc33' }} />
                      <Typography sx={{ color: '#1a1a1a' }}>
                        {formatDateShort(reservation.voyage?.date || reservation.bus?.departureDate || reservation.createdAt)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                      {reservation.voyage 
                        ? `${(reservation.voyage.price * (reservation.quantity || 1)).toLocaleString('fr-FR')} FCFA` 
                        : reservation.bus 
                          ? `${(reservation.bus.price * (reservation.quantity || 1)).toLocaleString('fr-FR')} FCFA` 
                          : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Voir les détails">
                        <IconButton 
                          onClick={() => handleOpenDetails(reservation)}
                          sx={{ 
                            color: '#21740cff',
                            '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)', color: '#4F4F4F' }
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton 
                          onClick={() => handleOpen(reservation)}
                          sx={{ 
                            color: '#ffcc33',
                            '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton 
                          onClick={() => handleDelete(reservation._id)}
                          sx={{ 
                            color: '#f44336',
                            '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <TablePagination
            component="div"
            count={visibleReservations.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Lignes par page :"
            sx={{
              '& .MuiTablePagination-toolbar': {
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e0e0e0',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px'
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                margin: 0,
                fontSize: '0.875rem',
                color: '#555'
              },
              '& .MuiSelect-select': {
                padding: '4px 24px 4px 4px',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                '&:focus': {
                  borderRadius: '4px',
                  borderColor: '#ffcc33'
                }
              },
              '& .MuiTablePagination-actions': {
                marginLeft: '8px',
                '& .MuiIconButton-root': {
                  padding: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 204, 51, 0.1)'
                  },
                  '&.Mui-disabled': {
                    color: '#bdbdbd'
                  }
                }
              }
            }}
          />
        </Paper>
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0'
        }}>
        </Box>
      )}

      {/* Dialog pour créer/modifier une réservation */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '3px solid #ffcc33',
          color: '#1a1a1a',
          fontWeight: 700,
          fontSize: '24px',
          textAlign: 'center',
          py: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <EventSeat sx={{ fontSize: 28 }} />
            {editReservation ? 'Modifier la réservation' : 'Nouvelle réservation'}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 0,
          backgroundColor: '#ffffff'
        }}>
          <Box sx={{ p: 4 }}>
            {/* Section Utilisateur */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 600, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Person sx={{ color: '#ffcc33' }} />
                  Sélection de l'utilisateur
                  {users?.length === 0 && (
                    <Typography variant="caption" sx={{ color: '#f44336', ml: 2 }}>
                      (Aucun utilisateur disponible)
                    </Typography>
                  )}
                </Typography>
                <Button 
                  variant="outlined"
                  onClick={openNewUser}
                  sx={{
                    borderColor: '#ffcc33',
                    color: '#ffcc33',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Ajouter un utilisateur
                </Button>
              </Box>
              <Autocomplete
                options={users || []}
                getOptionLabel={(option) => `${option.name} • ${option.numero}`}
                value={formData.userId}
                onChange={(e, newValue) => {
                  console.log('Utilisateur sélectionné:', newValue);
                  setFormData({ ...formData, userId: newValue });
                }}
                noOptionsText="Aucun utilisateur trouvé"
                loadingText="Chargement des utilisateurs..."
                ListboxProps={{
                  style: {
                    maxHeight: '100px',
                    overflow: 'auto'
                  }
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Utilisateur" 
                    required 
                    helperText={users?.length === 0 ? "Aucun utilisateur disponible" : `${users?.length || 0} utilisateur(s) disponible(s)`}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover fieldset': {
                          borderColor: '#ffcc33',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ffcc33',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#ffcc33',
                      },
                    }}
                  />
                )}
              />
            </Box>

            {/* Section Mode de Transport */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ 
                color: '#1a1a1a', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <DirectionsBus sx={{ color: '#ffcc33' }} />
                Mode de transport
              </Typography>
              
              <TextField
                select
                label="Choisissez votre mode de transport"
                value={formData.transportMode}
                onChange={handleTransportModeChange}
                fullWidth
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#ffcc33',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ffcc33',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#ffcc33',
                  },
                }}
              >
                <MenuItem value="voyage">Covoiturage</MenuItem>
                <MenuItem value="minibus">Minibus</MenuItem>
                <MenuItem value="bus">Bus</MenuItem>
              </TextField>
            </Box>

            {/* Section Voyage */}
            {formData.transportMode === 'voyage' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 600, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <DirectionsBus sx={{ color: '#ffcc33' }} />
                  Sélection du voyage
                  {voyages?.length === 0 && (
                    <Typography variant="caption" sx={{ color: '#f44336', ml: 2 }}>
                      (Aucun voyage disponible)
                    </Typography>
                  )}
                </Typography>
                <Autocomplete
                  options={voyages || []}
                  getOptionLabel={(option) => `${option.from} → ${option.to} • ${formatDateShort(option.date)} • ${option.price} FCFA • ${option.availableSeats || 0} places`}
                  value={formData.voyageId}
                  onChange={(e, newValue) => {
                    console.log('Voyage sélectionné:', newValue);
                    setFormData({ ...formData, voyageId: newValue });
                  }}
                  noOptionsText="Aucun voyage trouvé"
                  loadingText="Chargement des voyages..."
                  ListboxProps={{
                    style: {
                      maxHeight: '150px',
                      overflow: 'auto'
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {option.from} → {option.to}
                          </Typography>
                          <Chip 
                            label={`${option.availableSeats || 0} places`} 
                            size="small" 
                            color={option.availableSeats > 0 ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateShort(option.date)}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {option.price} FCFA
                          </Typography>
                        </Box>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Voyage" 
                      required
                      helperText={voyages?.length === 0 ? "Aucun voyage disponible" : `${voyages?.length || 0} voyage(s) disponible(s)`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover fieldset': {
                            borderColor: '#ffcc33',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#ffcc33',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#ffcc33',
                        },
                      }}
                    />
                  )}
                />
              </Box>
            )}

            {/* Section Bus */}
            {(formData.transportMode === 'bus' || formData.transportMode === 'minibus') && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 600, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <DirectionsBus sx={{ color: '#ffcc33' }} />
                  {formData.transportMode === 'minibus' ? 'Sélection du Minibus' : 'Sélection du Bus'}
                </Typography>
                
                <TextField
                  select
                  fullWidth
                  label={`Sélectionner un ${formData.transportMode === 'minibus' ? 'minibus' : 'bus'}`}
                  value={formData.busId || ''}
                  onChange={(e) => setFormData({...formData, busId: e.target.value})}
                  margin="normal"
                  required
                  disabled={loadingBuses}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderRadius: '12px',
                        borderColor: '#ffcc33',
                      },
                      '&.Mui-focused fieldset': {
                        borderRadius: '12px',
                        borderColor: '#ffcc33',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#ffcc33',
                    },
                  }}
                >
                  {loadingBuses ? (
                    <MenuItem disabled>Chargement des véhicules...</MenuItem>
                  ) : filteredBuses.length > 0 ? (
                    filteredBuses.map((bus) => (
                      <MenuItem key={bus._id} value={bus._id}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                            fontSize: '14px'
                          }}
                        >
                          <span>
                            <strong>{bus.name}</strong> {'   '}
                            <span style={{ color: '#666', fontWeight: 500 }}>
                              {bus.from} → {bus.to}
                            </span> {''}
                            {new Date(bus.departureDate).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>

                          <span style={{ fontWeight: 600 }}>
                            {bus.capacity} places · {bus.price}
                          </span>
                        </div>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      Aucun véhicule disponible pour cette catégorie
                    </MenuItem>
                  )}
                </TextField>
              </Box>
            )}

            {/* Section Quantité */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ 
                color: '#1a1a1a', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <LocalShipping sx={{ color: '#ffcc33' }} />
                Détails de la réservation
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {/* Nombre de ticket ou description */}
              {formData.ticket === 'place' ? (
                <TextField
                  label="Nombre de ticket"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1 }}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: '#ffcc33' },
                      '&.Mui-focused fieldset': { borderColor: '#ffcc33', borderWidth: 2 },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#ffcc33' },
                  }}
                />
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  <TextField
                    label="Description du colis"
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover fieldset': { borderColor: '#ffcc33' },
                        '&.Mui-focused fieldset': { borderColor: '#ffcc33', borderWidth: 2 },
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#ffcc33' },
                    }}
                  />
                </Box>
              )}
            </Box>

            </Box>

            {/* Résumé de la réservation */}
            {formData.userId && formData.transportMode && formData.ticket && (formData.ticket === 'colis' ? true : formData.quantity) && (
              <Box sx={{ 
                p: 3, 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                border: '2px solid #ffcc33',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 600, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <EventSeat sx={{ color: '#ffcc33' }} />
                  Résumé de la réservation
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Client</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {users.find(u => u._id === formData.userId?._id)?.name || 'Non sélectionné'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Mode de transport</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {formData.transportMode === 'voyage' ? ' Covoiturage' : ' Transport en bus'}
                    </Typography>
                  </Box>
                  {formData.transportMode === 'voyage' && formData.voyageId && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Voyage</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {voyages.find(v => v._id === formData.voyageId?._id) ? 
                          `${voyages.find(v => v._id === formData.voyageId._id).from} → ${voyages.find(v => v._id === formData.voyageId._id).to}` : 
                          'Non sélectionné'
                        }
                      </Typography>
                    </Box>
                  )}
                  {formData.transportMode === 'voyage' && formData.voyageId && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Prix</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                        {voyages.find(v => v._id === formData.voyageId?._id) ? 
                          `${voyages.find(v => v._id === formData.voyageId._id).price} FCFA` : 
                          'Non défini'
                        }
                      </Typography>
                    </Box>
                  )}
                  {formData.transportMode === 'bus' && formData.busId && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Bus</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {buses.find(b => b._id === formData.busId?._id) ? 
                          `${buses.find(b => b._id === formData.busId._id).name} (${buses.find(b => b._id === formData.busId._id).plateNumber})` : 
                          'Non sélectionné'
                        }
                      </Typography>
                    </Box>
                  )}
                  {formData.transportMode === 'bus' && formData.busId && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Trajet</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {buses.find(b => b._id === formData.busId?._id) ? 
                          `${buses.find(b => b._id === formData.busId._id).from} → ${buses.find(b => b._id === formData.busId._id).to}` : 
                          'Non défini'
                        }
                      </Typography>
                    </Box>
                  )}
                  {formData.transportMode === 'bus' && formData.busId && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Prix</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                        {buses.find(b => b._id === formData.busId?._id) ? 
                          `${buses.find(b => b._id === formData.busId._id).price} FCFA` : 
                          'Non défini'
                        }
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Type</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {formData.ticket === 'colis' ? 'Colis' : 'Place'}
                    </Typography>
                  </Box>
                  {formData.ticket === 'place' ? (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Nombre de ticket</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {formData.quantity}
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Description</Typography>
                        <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {formData.description || 'Non défini'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            )}

            {error && (
              <Box sx={{ 
                p: 3, 
                backgroundColor: '#ffebee', 
                borderRadius: '12px',
                border: '2px solid #f44336',
                mb: 3
              }}>
                <Typography color="error" variant="body1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {error}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 2, 
          backgroundColor: '#f8f9fa',
          gap: 2,
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            onClick={handleClose}
            variant="outlined"
            sx={{
              color: '#666666',
              borderColor: '#ddd',
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              '&:hover': {
                borderColor: '#999',
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#ffcc33',
              color: '#1a1a1a',
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(255, 204, 51, 0.3)',
              '&:hover': {
                backgroundColor: '#ffb300',
                boxShadow: '0 6px 16px rgba(255, 204, 51, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? "Traitement..." : editReservation ? 'Modifier la réservation' : 'Créer la réservation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Création d'un nouvel utilisateur */}
      <Dialog open={newUserOpen} onClose={closeNewUser} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle>Ajouter un utilisateur</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            {newUserError && (
              <Alert severity="error" onClose={() => setNewUserError('')}>{newUserError}</Alert>
            )}
            <TextField label="Nom complet" value={newUserData.name} onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })} required fullWidth />
            <TextField label="Email (optionnel)" type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} fullWidth />
            <TextField label="Numéro" value={newUserData.numero} onChange={(e) => setNewUserData({ ...newUserData, numero: e.target.value })} helperText="Format: 7. ... .. .." required fullWidth />
            <TextField label="Mot de passe" type="password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} required fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNewUser} disabled={newUserLoading}>Annuler</Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={newUserLoading}>{newUserLoading ? 'Création...' : 'Créer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Détails Réservation */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '3px solid #ffcc33',
            color: '#1a1a1a',
            fontWeight: 700,
            fontSize: '24px',
            textAlign: 'center',
            py: 3,
            backgroundColor: '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <EventSeat sx={{ fontSize: 28, color: '#ffcc33' }} />
            Détails de la réservation
          </Box>
        </DialogTitle>

        {/* ================= CONTENT ================= */}
        <DialogContent 
          sx={{ 
            p: 0,
            backgroundColor: '#f8f9fa',
            flex: '1 1 auto',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#d1d1d1',
              borderRadius: '4px',
              '&:hover': {
                background: '#b3b3b3',
              },
            },
          }}
        >
          {detailsReservation && (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Infos Client */}
              <Paper 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Person sx={{ color: '#ffcc33', fontSize: 28 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#1a1a1a',
                    }}
                  >
                    Informations du client
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gap: 2.5, pl: 2 }}>
                  <InfoRow label="Nom complet">
                    <Typography sx={{ fontWeight: 500 }}>
                      {detailsReservation.user?.name || 'Non spécifié'}
                    </Typography>
                  </InfoRow>
                  
                  <InfoRow label="Téléphone">
                      <Typography sx={{ fontWeight: 500 }}>
                        {detailsReservation.user?.numero || 'Non spécifié'}
                      </Typography>
                  </InfoRow>
                </Box>
              </Paper>

              {/* Détails de la réservation */}
              <Paper 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <EventSeat sx={{ color: '#ffcc33', fontSize: 28 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#1a1a1a',
                    }}
                  >
                    Détails de la réservation
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gap: 2.5, pl: 2 }}>
                  <InfoRow label="Référence">
                    <Chip 
                      label={`#${detailsReservation._id?.substring(0, 6).toUpperCase() || 'N/A'}`} 
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        color: '#555',
                      }}
                    />
                  </InfoRow>

                  {detailsReservation.ticket === 'place' ? (
                    <InfoRow label="Nombre de places">
                        <Typography sx={{ fontWeight: 600 }}>
                          {detailsReservation.quantity || 1} place{detailsReservation.quantity > 1 ? 's' : ''}
                        </Typography>
                    </InfoRow>
                  ) : (
                    <InfoRow label="Description du colis">
                      <Typography sx={{ 
                        fontStyle: detailsReservation.description ? 'normal' : 'italic',
                        color: detailsReservation.description ? 'inherit' : '#666',
                      }}>
                        {detailsReservation.description || 'Aucune description fournie'}
                      </Typography>
                    </InfoRow>
                  )}

                  <InfoRow label="Prix total">
                      <Typography sx={{ 
                        fontWeight: 700, 
                        color: '#4caf50',
                        fontSize: '1.1em'
                      }}>
                        {detailsReservation.voyage 
                          ? `${(detailsReservation.voyage.price * (detailsReservation.quantity || 1)).toLocaleString('fr-FR')} FCFA` 
                          : detailsReservation.bus 
                            ? `${(detailsReservation.bus.price * (detailsReservation.quantity || 1)).toLocaleString('fr-FR')} FCFA`
                            : 'Non défini'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', ml: 1 }}>
                        {detailsReservation.voyage 
                          ? `(${(detailsReservation.voyage.price || 0).toLocaleString('fr-FR')} FCFA × ${detailsReservation.quantity || 1})`
                          : detailsReservation.bus
                            ? `(${(detailsReservation.bus.price || 0).toLocaleString('fr-FR')} FCFA × ${detailsReservation.quantity || 1})`
                            : ''}
                      </Typography>
                  </InfoRow>

                  <InfoRow label="Date de réservation">
                      <Typography>
                        {new Date(detailsReservation.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                  </InfoRow>
                </Box>
              </Paper>

              {/* Informations du trajet */}
              <Paper 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Route sx={{ color: '#ffcc33', fontSize: 28 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#1a1a1a',
                    }}
                  >
                    Informations du trajet
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gap: 2.5, pl: 2 }}>
                  <InfoRow label="Trajet">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-end', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          backgroundColor: '#ff5722',
                          flexShrink: 0
                        }} />
                        <Typography sx={{ fontWeight: 600 }}>
                          {detailsReservation.voyage?.from || detailsReservation.bus?.from || 'Non spécifié'}
                        </Typography>
                        <ArrowForward sx={{ color: '#666', mx: 1 }} />
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          backgroundColor: '#4caf50',
                          flexShrink: 0
                        }} />
                        <Typography sx={{ fontWeight: 600 }}>
                          {detailsReservation.voyage?.to || detailsReservation.bus?.to || 'Non spécifié'}
                        </Typography>
                      </Box>
                    </Box>
                  </InfoRow>

                  <InfoRow label="Date et heure de départ">
                      <Typography>
                        {detailsReservation.voyage?.date
                          ? new Date(detailsReservation.voyage.date).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : detailsReservation.bus?.departureDate
                            ? new Date(detailsReservation.bus.departureDate).toLocaleString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Non spécifiée'}
                      </Typography>
                  </InfoRow>

                  {detailsReservation.voyage?.driver ? (
                    <>
                      <InfoRow label="Nom du chauffeur">
                        <Typography sx={{ fontWeight: 500 }}>
                          {detailsReservation.voyage.driver.name}
                        </Typography>
                      </InfoRow>
                      <InfoRow label="Téléphone du chauffeur">
                        {detailsReservation.voyage.driver.numero ? (
                            <Typography variant="body2" >
                              {detailsReservation.voyage.driver.numero}
                            </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary" fontStyle="italic">
                            Non renseigné
                          </Typography>
                        )}
                      </InfoRow>
                    </>
                  ) : detailsReservation.bus ? (
                    <InfoRow label="Véhicule">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DirectionsBus sx={{ color: '#666' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 500 }}>
                            {detailsReservation.bus.name} ({detailsReservation.bus.plateNumber})
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                            {detailsReservation.bus.model} - {detailsReservation.bus.seats} places
                          </Typography>
                        </Box>
                      </Box>
                    </InfoRow>
                  ) : null}

                  {detailsReservation.voyage?.vehicle && (
                    <InfoRow label="Véhicule">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DirectionsBus sx={{ color: '#666' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 500 }}>
                            {detailsReservation.voyage.vehicle.model} ({detailsReservation.voyage.vehicle.plateNumber})
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                            {detailsReservation.voyage.vehicle.seats} places • {detailsReservation.voyage.vehicle.type}
                          </Typography>
                        </Box>
                      </Box>
                    </InfoRow>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>

        {/* ================= ACTIONS ================= */}
        <DialogActions
          sx={{
            p: 3,
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #e0e0e0',
            position: 'sticky',
            bottom: 0,
            zIndex: 1,
          }}
        >
          <Button
            onClick={handleCloseDetails}
            variant="contained"
            sx={{
              backgroundColor: '#ffcc33',
              color: '#1a1a1a',
              fontWeight: 700,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(255, 204, 51, 0.3)',
              '&:hover': {
                backgroundColor: '#ffb300',
                boxShadow: '0 4px 12px rgba(255, 179, 0, 0.4)',
              },
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
