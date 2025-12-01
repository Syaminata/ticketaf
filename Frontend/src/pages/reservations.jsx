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
  Menu
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
} from '@mui/icons-material';
import { Divider } from '@mui/material';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [users, setUsers] = useState([]);
  const [buses, setBuses] = useState([]);
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
      console.log(' Récupération des bus...');
      const token = sessionStorage.getItem('token');
      console.log('Token:', token ? 'Présent' : 'Absent');
      
      const response = await fetch('https://ticket-taf.itea.africa/api/buses', {
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
      console.log('🚌 Bus récupérés:', data);
      console.log('🚌 Nombre de bus:', data?.length || 0);
      setBuses(data || []);
    } catch (err) {
      console.error(' Erreur lors de la récupération des bus:', err);
      setError('Erreur lors du chargement des bus: ' + err.message);
      setBuses([]); // S'assurer que buses est un tableau vide en cas d'erreur
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
    } else {
      setFormData({ 
        userId: null, 
        transportMode: '', 
        voyageId: null, 
        busId: null, 
        ticket: 'place', 
        quantity: 1,
        description: ''
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

  const [typeFilter, setTypeFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenFilter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = (value) => {
    setAnchorEl(null);
    if (value !== undefined) {
      setTypeFilter(value);
      setPage(0); // Réinitialiser à la première page lors du changement de filtre
    }
  };

  // Filtrage des réservations
  const filteredReservations = visibleReservations.filter(reservation => {
    if (!reservation) return false;
    
    // Filtre par type (place/colis)
    if (typeFilter !== 'all' && reservation.ticket !== typeFilter) {
      return false;
    }
    
    // Si pas de terme de recherche, on garde tout
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    // Récupération des données imbriquées
    // Les données utilisateur peuvent être directement dans l'objet reservation
    const user = {
      name: reservation.userName || reservation.user?.name,
      username: reservation.userName || reservation.user?.username,
      email: reservation.userEmail || reservation.user?.email,
      phone: reservation.userPhone || reservation.user?.phone || reservation.user?.numero
    };
    
    const voyage = reservation.voyageId || reservation.voyage || {};
    const bus = reservation.busId || reservation.bus || {};
    
    // Débogage des données utilisateur
    if (searchTerm.trim() !== '') {
      console.log('Recherche de:', searchTerm);
      console.log('Données utilisateur:', user);
      console.log('Données complètes de la réservation:', reservation);
    }

    // Liste des champs à rechercher
    const searchFields = [
      user?.name || '',
      user?.username || '',
      user?.email || '',
      user?.phone || user?.numero || '',
      voyage?.from || '',
      voyage?.to || '',
      bus?.from || '',
      bus?.to || '',
      bus?.name || '',
      reservation?.reference || '',
      reservation?.ticket || '',
      reservation?.createdAt ? new Date(reservation.createdAt).toLocaleDateString() : ''
    ].filter(Boolean).map(field => field.toString().toLowerCase());

    // Vérifie si le terme de recherche est présent dans l'un des champs
    return searchFields.some(field => field.includes(search));
  });

  const paginatedReservations = filteredReservations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
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
            color: '#ffcc33',
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
          
          {/* Filtre par type */}
          <Button
            variant="outlined"
            onClick={handleOpenFilter}
            startIcon={<FilterListIcon />}
            sx={{ 
              textTransform: 'none',
              borderColor: '#ffcc33',
              color: '#666',
              '&:hover': {
                borderColor: '#ffcc33',
                backgroundColor: 'rgba(255, 204, 51, 0.04)',
              }
            }}
          >
            {typeFilter === 'all' ? 'Tous les types' : typeFilter === 'place' ? 'Places' : 'Colis'}
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => handleCloseFilter()}
          >
            <MenuItem onClick={() => handleCloseFilter('all')}>
              Tous les types
            </MenuItem>
            <MenuItem onClick={() => handleCloseFilter('place')}>
              Places
            </MenuItem>
            <MenuItem onClick={() => handleCloseFilter('colis')}>
              Colis
            </MenuItem>
          </Menu>
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

      {/* Liste des réservations */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#ffcc33' }} />
        </Box>
      ) : visibleReservations.length > 0 ? (
        <>
        <Grid container spacing={2}>
          {paginatedReservations.map((reservation) => (
            <Grid item xs={12} sm={6} lg={4} key={reservation._id}>
              <Card
                sx={{
                  minHeight: '400px',
                  height: 'auto',
                  width: '300px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    borderColor: '#ffcc33',
                  },
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {reservation.voyage ? (
                        <DirectionsCar sx={{ color: '#4caf50', fontSize: 20, mr: 1 }} />
                      ) : (
                        <DirectionsBus sx={{ color: '#2196f3', fontSize: 20, mr: 1 }} />
                      )}
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px' }}>
                        {reservation.voyage ? 'Covoiturage' : 'Bus'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={reservation.ticket === 'colis' ? 'Colis' : 'Place'} size="small" sx={{ backgroundColor: '#f5f5f5', color: '#666', fontSize: '11px' }} />
                      {isReservationCanceled(reservation) && (
                        <Chip label="Annulée" size="small" color="error" sx={{ color: '#fff', fontSize: '11px' }} />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px', mb: 0.5 }}>
                      {reservation.user?.name || 'Client'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '13px' }}>
                      {reservation.user?.numero || ''}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '12px', mb: 0.5 }}>
                      Trajet
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '14px', color: isReservationCanceled(reservation) ? '#f44336' : 'inherit' }}>
                      {isReservationCanceled(reservation)
                        ? 'Trajet annulé (voyage/bus supprimé)'
                        : reservation.voyage
                        ? `${reservation.voyage.from} → ${reservation.voyage.to}`
                        : reservation.bus
                        ? `${reservation.bus.name}  - ${reservation.bus.from} → ${reservation.bus.to}`
                        : 'Non défini'}
                    </Typography>
                  </Box>

                  <Box sx={{ backgroundColor: '#f8f9fa', borderRadius: '4px', p: 2, mb: 2 }}>
                    {reservation.ticket === 'colis' ? (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '12px' }}>
                          Description
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                          {'voir  details'}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '12px' }}>
                          Nombre de place
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                          {reservation.quantity}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '12px' }}>
                        Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {formatDateShort(reservation.voyage?.date || reservation.bus?.departureDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '12px' }}>
                        Prix
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50', fontSize: '13px' }}>
                        {reservation.voyage 
                          ? `${(reservation.voyage.price * (reservation.quantity || 1)).toLocaleString('fr-FR')} FCFA` 
                          : reservation.bus 
                            ? `${(reservation.bus.price * (reservation.quantity || 1)).toLocaleString('fr-FR')} FCFA` 
                            : 'Non défini'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ flexGrow: 1 }} />

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                    {reservation.ticket === 'colis' && (
                      <IconButton onClick={() => handleOpenDetails(reservation)} sx={{ color: '#377c1cff', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' } }}>
                        <Visibility />
                      </IconButton>
                    )}
                    <IconButton onClick={() => { handleOpen(reservation); }} sx={{ color: '#ffcc33', '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' } }}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => { handleDelete(reservation._id); }} sx={{ color: '#f44336', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}>
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <TablePagination
          component="div"
          count={filteredReservations.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[6, 12, 24]}
          labelRowsPerPage="Réservations par page"
        />
        </>
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
                onChange={(e) => {
                  const mode = e.target.value;
                  setFormData({ 
                    ...formData, 
                    transportMode: mode,
                    voyageId: null, // Réinitialiser les sélections
                    busId: null
                  });
                }}
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
                <MenuItem value="voyage"> Covoiturage</MenuItem>
                <MenuItem value="bus"> Transport en bus</MenuItem>
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
                  options={voyages?.slice(0, 3) || []}
                  getOptionLabel={(option) => `${option.from} → ${option.to} • ${formatDateShort(option.date)} • ${option.price} FCFA • ${option.availableSeats || 0} places`}
                  value={formData.voyageId}
                  onChange={(e, newValue) => {
                    console.log('Voyage sélectionné:', newValue);
                    setFormData({ ...formData, voyageId: newValue });
                  }}
                  noOptionsText="Aucun voyage trouvé"
                  loadingText="Chargement des voyages..."
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

            {/* Section Bus  */}
            {formData.transportMode === 'bus' && (
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
                  Sélection du bus
                  {buses?.length === 0 && (
                    <Typography variant="caption" sx={{ color: '#f44336', ml: 2 }}>
                      (Aucun bus disponible)
                    </Typography>
                  )}
                </Typography>
                <Autocomplete
                  options={buses?.slice(0, 3) || []}
                  getOptionLabel={(option) => `${option.name} • ${option.from} → ${option.to}`}
                  value={formData.busId}
                  onChange={(e, newValue) => {
                    console.log('Bus sélectionné:', newValue);
                    setFormData({ ...formData, busId: newValue });
                  }}
                  noOptionsText="Aucun bus trouvé"
                  loadingText="Chargement des bus..."
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {option.name}
                          </Typography>
                          <Chip 
                            label={`${option.availableSeats || 0}/${option.capacity} places`} 
                            size="small" 
                            color={option.availableSeats > 0 ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {option.from} → {option.to}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateShort(option.departureDate)}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {option.price} FCFA
                          </Typography>
                        </Box>
                        {!option.isActive && (
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label="Non disponible" 
                              size="small" 
                              color="error"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        )}
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Bus" 
                      required
                      helperText={buses?.length === 0 ? "Aucun bus disponible" : `${buses?.length || 0} bus disponible(s)`}
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

            {/* Section Type et Quantité */}
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
              {/* Type de ticket */}
              <TextField
                select
                label="Type de Ticket"
                value={formData.ticket}
                onChange={(e) => {
                  const ticketType = e.target.value;
                  setFormData({ 
                    ...formData, 
                    ticket: ticketType,
                    quantity: 1, 
                    description: ticketType === 'colis' ? '' : '',
                  });
                }}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: '#ffcc33' },
                    '&.Mui-focused fieldset': { borderColor: '#ffcc33', borderWidth: 2 },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#ffcc33' },
                }}
              >
                <MenuItem value="place">Place</MenuItem>
                <MenuItem value="colis">Colis</MenuItem>
              </TextField>

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
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle>
          Détails de la réservation
        </DialogTitle>
        <DialogContent dividers>
          {detailsReservation && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#666' }}>Client</Typography>
                <Typography sx={{ fontWeight: 300 }}>
                  {detailsReservation.user?.name} • {detailsReservation.user?.numero}
                </Typography>
                
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#666' }}>Trajet</Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {detailsReservation.voyage ? (
                    `${detailsReservation.voyage.from} → ${detailsReservation.voyage.to}`
                  ) : detailsReservation.bus ? (
                    `${detailsReservation.bus.name} • ${detailsReservation.bus.from} → ${detailsReservation.bus.to}`
                  ) : 'Non défini'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#666' }}>Type</Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {detailsReservation.ticket === 'colis' ? 'Colis' : 'Place'}
                </Typography>
              </Box>
              {detailsReservation.ticket === 'place' ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#666' }}>Quantité</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{detailsReservation.quantity}</Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#666' }}>Description</Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {detailsReservation.colisDescription || 'Non défini'}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#666' }}>Prix</Typography>
                <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                  {detailsReservation.voyage ? (
                    `${detailsReservation.voyage.price} FCFA`
                  ) : detailsReservation.bus ? (
                    `${detailsReservation.bus.price} FCFA`
                  ) : 'Non défini'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#666' }}>Date de départ</Typography>
                <Typography>
                  {formatDateShort(detailsReservation.voyage?.date || detailsReservation.bus?.departureDate)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} variant="outlined">Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
