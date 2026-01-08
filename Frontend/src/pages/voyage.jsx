import React, { useState, useEffect } from 'react';
import { voyageAPI } from '../api/voyage';
import { villeAPI } from '../api/ville';
import axios from '../api/axios';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Paper,
  MenuItem,
  Chip,
  Alert,
  TablePagination,
  InputAdornment,
  Menu
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add, 
  DirectionsBus, 
  LocationOn, 
  AccessTime, 
  AttachMoney, 
  DoubleArrow, 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  AddLocation, 
  Close 
} from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function Voyage() {
  const [voyages, setVoyages] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [newCityDialogOpen, setNewCityDialogOpen] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editVoyage, setEditVoyage] = useState(null);
  const [formData, setFormData] = useState({
    driverId: '',
    from: '',
    to: '',
    date: '',
    price: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false
  });

  const fetchVoyages = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error("Authentification manquante");
      setError("Authentification manquante. Veuillez vous reconnecter.");
      return;
    }
    
    try {
      console.log("Récupération des voyages...");
      const res = await voyageAPI.getAllVoyages();
      console.log("Voyages récupérés:", res);
      
      setVoyages(res);
      setError('');
    } catch (err) {
      console.error("Erreur récupération des voyages :", err);
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } else if (err.response?.status === 500) {
        setError("Erreur serveur. Veuillez réessayer plus tard.");
      } else {
        setError("Erreur lors du chargement des voyages: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const fetchDrivers = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await axios.get('/drivers', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setDrivers(res.data);
    } catch (err) {
      console.error("Erreur récupération des conducteurs :", err);
    }
  };

  useEffect(() => {
    fetchVoyages();
    fetchDrivers();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleOpen = (voyage = null) => {
    setError('');
    setEditVoyage(voyage);
    if (voyage) {
      setFormData({
        driverId: voyage.driver._id,
        from: voyage.from,
        to: voyage.to,
        date: new Date(voyage.date).toISOString().slice(0, 16),
        price: voyage.price
      });
    } else {
      setFormData({
        driverId: '',
        from: '',
        to: '',
        date: '',
        price: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setEditVoyage(null);
    setFormData({
      driverId: '',
      from: '',
      to: '',
      date: '',
      price: ''
    });
  };

  // Charger les villes au montage du composant
  useEffect(() => {
    const loadCities = async () => {
      try {
        const villes = await villeAPI.getAllVilles();
        setCities(villes.map(v => v.nom).sort());
      } catch (error) {
        console.error('Erreur lors du chargement des villes:', error);
        setError('Erreur lors du chargement des villes');
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, []);

  const handleAddNewCity = async () => {
    if (!newCityName.trim()) return;
    
    try {
      const cityName = newCityName.trim().charAt(0).toUpperCase() + newCityName.trim().slice(1).toLowerCase();
      
      // Vérifier si la ville existe déjà localement
      if (!cities.includes(cityName)) {
        // Créer la ville via l'API
        await villeAPI.createVille({ nom: cityName });
        
        // Recharger la liste des villes depuis l'API
        const updatedVilles = await villeAPI.getAllVilles();
        const updatedCities = updatedVilles.map(v => v.nom).sort();
        
        setCities(updatedCities);
        setFormData(prev => ({
          ...prev,
          from: cityName
        }));
        setSuccess(`Ville "${cityName}" ajoutée avec succès`);
      } else {
        setFormData(prev => ({
          ...prev,
          from: cityName
        }));
      }
      
      setNewCityName('');
      setNewCityDialogOpen(false);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la ville:', error);
      setError('Erreur lors de l\'ajout de la ville');
    }
  };

  const handleDeleteClick = async (cityName, e) => {
    e.stopPropagation();

    try {
      const villes = await villeAPI.getAllVilles();

      const villeTrouvee = villes.find(v =>
        v.nom.toLowerCase() === cityName.toLowerCase()
      );

      if (!villeTrouvee) {
        throw new Error('Ville non trouvée');
      }

      setConfirmDialog({
        open: true,
        title: "Supprimer la ville",
        message: `Êtes-vous sûr de vouloir supprimer définitivement la ville "${villeTrouvee.nom}" ?`,
        loading: false,
        onConfirm: () => handleConfirmDelete(villeTrouvee), 
      });

    } catch (error) {
      setError(error.message);
    }
  };

  const handleConfirmDelete = async (ville) => {
    if (!ville || !ville._id) {
      console.error('Ville invalide');
      return;
    }

    try {
      await villeAPI.deleteVille(ville._id);

      const updatedVilles = await villeAPI.getAllVilles();
      setCities(updatedVilles.map(v => v.nom).sort());

      setFormData(prev => ({
        ...prev,
        from: prev.from === ville.nom ? '' : prev.from,
        to: prev.to === ville.nom ? '' : prev.to
      }));

      setSuccess(`Ville "${ville.nom}" supprimée avec succès`);
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      setError("Impossible de supprimer cette ville car elle est utilisée dans des voyages");
    } finally {
      setConfirmDialog(prev => ({ ...prev, open: false }));
    }
  };

  // Fonction pour annuler la suppression (utilisée par ConfirmDialog)
  const handleCancelDelete = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
    setVilleToDelete(null);
    setDeleteEvent(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return setError("Authentification nécessaire.");

    if (!formData.driverId || !formData.from || !formData.to || !formData.date || !formData.price) {
      setError("Tous les champs sont requis.");
      return;
    }

    if (formData.from === formData.to) {
      setError("La ville de départ et d'arrivée doivent être différentes");
      return;
    }

    if (isNaN(formData.price) || formData.price <= 0) {
      setError("Le prix doit être un nombre positif.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const dataToSubmit = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editVoyage) {
        console.log("Mise à jour du voyage:", editVoyage._id);
        await voyageAPI.updateVoyage(editVoyage._id, dataToSubmit);
        console.log("Voyage mis à jour avec succès");
        setSuccess('Voyage mis à jour avec succès');
      } else {
        console.log("Création d'un nouveau voyage");
        await voyageAPI.createVoyage(dataToSubmit);
        console.log("Voyage créé avec succès");
        setSuccess('Voyage créé avec succès');
      }

      console.log("Succès de l'opération");
      await fetchVoyages();
      handleClose();
     
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      setError('');
    } catch (err) {
      console.error("Erreur soumission :", err);
      console.error("Détails de l'erreur:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.message || 'Erreur serveur');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const voyage = voyages.find(v => v._id === id);
    const voyageInfo = voyage 
      ? `"${voyage.from} → ${voyage.to}" du ${new Date(voyage.date).toLocaleDateString('fr-FR')} à ${voyage.price} FCFA`
      : 'ce voyage';
    
    setConfirmDialog({
      open: true,
      title: "Supprimer le voyage",
      message: `Êtes-vous sûr de vouloir supprimer définitivement le voyage ${voyageInfo} ?`,
      onConfirm: () => confirmDelete(id),
      loading: false
    });
  };

  const confirmDelete = async (id) => {
    setConfirmDialog(prev => ({ ...prev, loading: true }));
    
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError("Authentification manquante");
      setConfirmDialog(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      await voyageAPI.deleteVoyage(id);
      setSuccess('Voyage supprimé avec succès');
      fetchVoyages();
      setConfirmDialog(prev => ({ ...prev, open: false }));
      
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error("Erreur suppression :", err);
      setError("Erreur lors de la suppression du voyage.");
      setConfirmDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      day: 'numeric',
      month: 'short',  
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return date.toLocaleDateString('fr-FR', options);
  };

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

  const selectableDrivers = editVoyage
    ? drivers.filter(d => d.isActive || d._id === formData.driverId)
    : drivers.filter(d => d.isActive);


  const filteredVoyages = voyages.filter(voyage => {
    if (!voyage) return false;
    
    const searchTermLower = searchTerm ? searchTerm.toLowerCase() : '';
    const driverName = typeof voyage.driverName === 'string' ? voyage.driverName : '';
    const from = typeof voyage.from === 'string' ? voyage.from : '';
    const to = typeof voyage.to === 'string' ? voyage.to : '';
    
    const matchesSearch = searchTerm === '' || 
      driverName.toLowerCase().includes(searchTermLower) ||
      from.toLowerCase().includes(searchTermLower) ||
      to.toLowerCase().includes(searchTermLower);
      
    const voyageDate = voyage.date ? new Date(voyage.date) : null;
    const now = new Date();
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'upcoming' && voyageDate && voyageDate > now) ||
      (statusFilter === 'past' && voyageDate && voyageDate <= now);

    const matchesDateRange = !dateRange.startDate || !dateRange.endDate || !voyageDate || 
      (voyageDate >= new Date(dateRange.startDate) && 
       voyageDate <= new Date(new Date(dateRange.endDate).setHours(23, 59, 59, 999)));
      
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const paginatedVoyages = filteredVoyages.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ 
      p: 1, 
      backgroundColor: '#ffff', 
      minHeight: '100vh',
      color: '#1a1a1a'
    }}>
      {/* Messages d'alerte */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: '8px' }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: '8px' }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            fontSize: '20px',
            color: '#1a1a1a',
            mb: 1
          }}>
            Liste des voyages Planifiés
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#666666',
            fontSize: '16px'
          }}>
            Planifiez et gérez les voyages 
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => handleOpen()} 
          startIcon={<Add />}
          sx={{ 
            backgroundColor: 'transparrent',
            border: '2px solid #b6660abd',
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
          Planifier un voyage
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      {/* Recherche simple */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        mb: 3,
        justifyContent: 'space-between'
      }}>
        <TextField
          placeholder="Rechercher un voyage..."
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
          startIcon={<FilterIcon />}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            borderColor: '#b6660abd',
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

      {/* Table */}
      {voyages.length > 0 ? (
        <Paper sx={{ 
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(206, 204, 204, 0.43)'
        }}>
          <Table>
            <TableHead sx={{ 
              borderBottom: '3px solid #ffcc33',
              '& .MuiTableCell-root': {
                borderBottom: '3px solid #ffcc33'
              }
            }}>
              <TableRow>
                <TableCell sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 700,
                  fontSize: '16px'
                }}>
                  Trajet
                </TableCell>
                <TableCell sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 700,
                  fontSize: '16px'
                }}>
                  Conducteur
                </TableCell>
                <TableCell sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 700,
                  fontSize: '16px'
                }}>
                  Date & Heure
                </TableCell>
                <TableCell sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 700,
                  fontSize: '16px'
                }}>
                  Prix
                </TableCell>
                <TableCell sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 700,
                  fontSize: '16px',
                  textAlign: 'center'
                }}>
                  Statut
                </TableCell>
                <TableCell sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 700,
                  fontSize: '16px',
                  textAlign: 'center'
                }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedVoyages.map((voyage, index) => (
                <TableRow 
                  key={voyage._id}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                    '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <DoubleArrow sx={{ color: '#ffcc33', fontSize: 24 }} />
                      <Box>
                        <Typography sx={{ 
                          fontWeight: 600,
                          color: '#1a1a1a'
                        }}>
                          {voyage.from} → {voyage.to}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <LocationOn sx={{ fontSize: 16, color: '#666666' }} />
                          <Typography variant="body2" sx={{ color: '#666666' }}>
                            {voyage.driver?.marque} - {voyage.driver?.capacity} places
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {voyage.driver?.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666666' }}>
                        {voyage.driver?.numero}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16, color: '#666666' }} />
                      <Typography sx={{ color: '#666666' }}>
                        {formatDate(voyage.date)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                        {voyage.price} FCFA
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={getStatusText(voyage.date)}
                      color={getStatusColor(voyage.date)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton 
                      onClick={() => handleOpen(voyage)}
                      sx={{ 
                        color: '#ffcc33',
                        '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(voyage._id)}
                      sx={{ 
                        color: '#f44336',
                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredVoyages.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Lignes par page"
          />
              
        </Paper>
      ) : null}

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
            <DirectionsBus sx={{ fontSize: 28 }} />
            {editVoyage ? 'Modifier le voyage' : 'Planifier un nouveau voyage'}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 0,
          backgroundColor: '#ffffff'
        }}>
          <Box sx={{ p: 4 }}>
            {/* Section Conducteur */}
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
                Sélection du conducteur
              </Typography>
              <Autocomplete
                options={drivers}
                getOptionLabel={(option) => `${option.name} (${option.marque})`}
                value={drivers.find(driver => driver._id === formData.driverId) || null}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    driverId: newValue ? newValue._id : ''
                  }));
                }}
                ListboxProps={{
                  style: {
                    maxHeight: 280,
                    overflowY: 'auto',
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rechercher un conducteur"
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
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
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {option.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666666' }}>
                          {option.marque} • {option.capacity} places 
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
                noOptionsText="Aucun conducteur trouvé"
                filterOptions={(options, { inputValue }) => {
                  const input = inputValue.toLowerCase();
                  return options
                    .filter(option => 
                      option.name.toLowerCase().includes(input) ||
                      option.marque?.toLowerCase().includes(input) ||
                      option.capacity?.toString().includes(input)
                    )
                }}
              />
            </Box>

            {/* Section Trajet */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ 
                color: '#1a1a1a', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <LocationOn sx={{ color: '#ffcc33' }} />
                Détails du trajet
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Autocomplete
                    options={cities}
                    value={formData.from}
                    onChange={(_, newValue) => {
                      setFormData(prev => ({ ...prev, from: newValue || '' }));
                    }}
                    sx={{ flex: 1 }}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <li
                          key={key}
                          {...otherProps}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          <span>{option}</span>

                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation(); // empêche la sélection
                              handleDeleteClick(option, e);
                            }}
                            sx={{
                              color: 'red',
                              ml: 1,
                              '&:hover': {
                                color: 'darkred',
                                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                              },
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Ville de départ"
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '&:hover fieldset': { borderColor: '#ffcc33' },
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

                  <Button
                    variant="outlined"
                    onClick={() => setNewCityDialogOpen(true)}
                    sx={{
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      borderColor: '#ffcc33',
                      color: '#ffcc33',
                      '&:hover': {
                        borderColor: '#e6b800',
                        backgroundColor: 'rgba(255, 204, 51, 0.08)'
                      }
                    }}
                  >
                    <AddLocation />
                  </Button>
                </Box>
                <Autocomplete
                options={cities.filter(city => city !== formData.from)}
                value={formData.to}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, to: newValue || '' }));
                }}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{option}</span>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVille(option, e);
                        }}
                        sx={{ '&:hover': { color: 'red' } }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ville de destination"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover fieldset': { borderColor: '#ffcc33' },
                        '&.Mui-focused fieldset': { 
                          borderColor: '#ffcc33', 
                          borderWidth: 2 
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': { 
                        color: '#ffcc33' 
                      },
                    }}
                  />
                )}
              />
              </Box>
            </Box>

            {/* Section Date et Prix */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ 
                color: '#1a1a1a', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <AccessTime sx={{ color: '#ffcc33' }} />
                Planification et tarif
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <TextField
                  label="Date et heure de départ"
                  name="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={handleChange}
                  fullWidth
                  required
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
                <TextField
                  label="Prix unitaire par passager"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{
                    
                    endAdornment: (
                      <Box sx={{ color: '#666666', ml: 1 }}>FCFA</Box>
                    )
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
              </Box>
            </Box>

            {/* Résumé du voyage */}
            {formData.driverId && formData.from && formData.to && formData.date && formData.price && (
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
                  <DirectionsBus sx={{ color: '#ffcc33' }} />
                  Résumé du voyage
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Conducteur</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {drivers.find(d => d._id === formData.driverId)?.name || 'Non sélectionné'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Trajet</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {formData.from} → {formData.to}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Date</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {formData.date ? new Date(formData.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Non définie'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Prix</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                      {formData.price} FCFA
                    </Typography>
                  </Box>
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
                  ⚠️ {error}
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
              backgroundColor: loading ? '#ccc' : '#ffcc33',
              color: '#1a1a1a',
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(255, 204, 51, 0.3)',
              '&:hover': {
                backgroundColor: loading ? '#ccc' : '#ffb300',
                boxShadow: '0 6px 16px rgba(255, 204, 51, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Traitement...' : (editVoyage ? 'Modifier le voyage' : 'Créer le voyage')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Boîte de dialogue pour ajouter une nouvelle ville */}
      <Dialog 
        open={newCityDialogOpen} 
        onClose={() => setNewCityDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>
          Ajouter une nouvelle ville
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom de la ville"
            fullWidth
            variant="outlined"
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddNewCity()}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': { borderColor: '#ffcc33' },
                '&.Mui-focused fieldset': { 
                  borderColor: '#ffcc33',
                  borderWidth: 2 
                },
              },
              '& .MuiInputLabel-root.Mui-focused': { 
                color: '#ffcc33' 
              },
              mt: 1
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => {
              setNewCityDialogOpen(false);
              setNewCityName('');
            }}
            sx={{
              color: '#666',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleAddNewCity}
            variant="contained"
            disabled={!newCityName.trim()}
            sx={{
              backgroundColor: '#ffcc33',
              color: '#1a1a1a',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#e6b800',
              },
              '&.Mui-disabled': {
                backgroundColor: '#f5f5f5',
                color: '#bdbdbd'
              }
            }}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        loading={confirmDialog.loading}
        type="delete"
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
      />

    </Box>
  );
}
