import React, { useState, useEffect } from "react";
import axios from "../api/axios";
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
  Snackbar,
  TablePagination, 
  Switch, FormControlLabel,
  Menu
} from "@mui/material";
import {
  DirectionsBus as BusIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  FilterList as FilterListIcon
} from "@mui/icons-material";
import ConfirmationDialog from "../components/ConfirmationDialog";

function Buses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    plateNumber: "",
    capacity: "",
    from: "",
    to: "",
    departureDate: "",
    price: "",
    isActive: false
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false
  });

  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    bus: null
  });

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get("/buses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBuses(response.data);
      setError('');
    } catch (error) {
      console.error("Erreur lors de la récupération des bus:", error);
      setBuses([]);
      if (error.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError("Erreur lors du chargement des bus: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (bus = null) => {
    setError('');
    setEditingBus(bus);
    if (bus) {
      setFormData({
        name: bus.name,
        plateNumber: bus.plateNumber,
        capacity: bus.capacity.toString(),
        from: bus.from || "",
        to: bus.to || "",
        departureDate: bus.departureDate ? new Date(bus.departureDate).toISOString().slice(0, 16) : "",
        price: bus.price ? bus.price.toString() : ""
      });
    } else {
      setFormData({
        name: "",
        plateNumber: "",
        capacity: "",
        from: "",
        to: "",
        departureDate: "",
        price: ""
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBus(null);
    setError('');
  };

  const handleViewDetails = (bus) => {
    setDetailsDialog({
      open: true,
      bus: bus
    });
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialog({
      open: false,
      bus: null
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return setError("Authentification nécessaire.");

    if (!formData.name || !formData.plateNumber || !formData.capacity || 
        !formData.from || !formData.to || !formData.departureDate || !formData.price) {
      setError("Tous les champs sont requis.");
      return;
    }

    if (isNaN(formData.capacity) || formData.capacity <= 0) {
      setError("La capacité doit être un nombre positif.");
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
      const busData = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      if (editingBus) {
        // Mise à jour
        await axios.put(`/buses/${editingBus._id}`, busData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBuses(prev => prev.map(bus => 
          bus._id === editingBus._id 
            ? { ...bus, ...busData }
            : bus
        ));
        setSuccess('Bus mis à jour avec succès');
      } else {
        // Création
        const response = await axios.post("/buses", busData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBuses(prev => [response.data.bus, ...prev]);
        setSuccess('Bus ajouté avec succès');
      }
      handleCloseDialog();
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      if (error.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError(error.response?.data?.message || "Erreur lors de la sauvegarde");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (busId) => {
    const bus = buses.find(b => b._id === busId);
    const busInfo = bus 
      ? `"${bus.name}" (${bus.plateNumber}) avec ${bus.capacity} places`
      : 'ce bus';
    
    setConfirmDialog({
      open: true,
      title: "Supprimer le bus",
      message: `Êtes-vous sûr de vouloir supprimer définitivement le bus ${busInfo} ?`,
      onConfirm: () => confirmDelete(busId),
      loading: false
    });
  };

  const confirmDelete = async (busId) => {
    setConfirmDialog(prev => ({ ...prev, loading: true }));
    
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError("Authentification manquante");
      setConfirmDialog(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      await axios.delete(`/buses/${busId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBuses(prev => prev.filter(bus => bus._id !== busId));
      setSuccess('Bus supprimé avec succès');
      setConfirmDialog(prev => ({ ...prev, open: false }));
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError("Erreur lors de la suppression du bus.");
      setConfirmDialog(prev => ({ ...prev, loading: false }));
    }
  };
  // Changement de statut (Actif / Inactif)
  const handleToggleStatus = async (bus) => {
    try {
      const token = sessionStorage.getItem('token');
      const newStatus = !bus.isActive;

      await axios.put(
        `/bus/${bus._id}/${newStatus ? 'activate' : 'deactivate'}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Mise à jour locale
      setBuses(prev =>
        prev.map(b =>
          b._id === bus._id ? { ...b, isActive: newStatus } : b
        )
      );

      setSuccess(`Bus ${newStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      setError('Erreur lors de la mise à jour du statut du bus');
    }
  };


  // --- FILTRAGE DES BUS ---
  const filteredBuses = buses.filter(bus => {
    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      const busFrom = bus.from?.toLowerCase() || '';
      const busTo = bus.to?.toLowerCase() || '';
      const busDate = bus.departureDate 
        ? new Date(bus.departureDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).toLowerCase()
        : '';

    return (
      bus.plateNumber?.toLowerCase().includes(search) ||
      bus.name?.toLowerCase().includes(search) ||
      busFrom.includes(search) ||
      busTo.includes(search) || 
      (busFrom + ' ' + busTo).includes(search) || 
      (busFrom + ' - ' + busTo).toLowerCase().includes(search) || 
      busDate.includes(search)                          
      );
      
      if (!matchesSearch) return false;
    }
    
    // Filtre par statut
    if (statusFilter === 'active') return bus.isActive === true;
    if (statusFilter === 'inactive') return bus.isActive === false;
    
    return true; // Si 'all' ou autre valeur non gérée
  });
  
  // Tri des bus
  const sortedBuses = [...filteredBuses].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
  );
  
  // --- PAGINATION ---
  const paginatedBuses = sortedBuses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Fermeture Snackbar
  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  // Gestion du filtre de statut
  const handleOpenFilter = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseFilter = (status) => {
    setAnchorEl(null);
    if (status !== undefined) {
      setStatusFilter(status);
      setPage(0); // Réinitialiser à la première page lors du changement de filtre
    }
  };

  return (
    <Box sx={{ 
      p: 1, 
      backgroundColor: '#ffff', 
      minHeight: '100vh',
      color: '#1a1a1a'
    }}>
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
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
            Gestion des Bus
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#666666',
            fontSize: '16px'
          }}>
            Gérez votre flotte de véhicules de transport
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => handleOpenDialog()} 
          startIcon={<AddIcon />}
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
          Ajouter un Bus
        </Button>
      </Box>


      {/* Recherche et filtres */}
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
            placeholder="Rechercher par plaque, nom, trajet ou date..."
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
            onClick={handleOpenFilter}
            startIcon={<FilterListIcon />}
            sx={{ 
              textTransform: 'none',
              borderColor: '#ffcc33',
              color: '#666',
              '&:hover': {
                borderColor: '#ffcc33',
                color: '#1a1a1a',
                backgroundColor: 'rgba(255, 204, 51, 0.04)'
              }
            }}
          >
            {statusFilter === 'all' ? 'Tous' : statusFilter === 'active' ? 'Actifs' : 'Inactifs'}
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => handleCloseFilter()}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem 
              onClick={() => handleCloseFilter('all')} 
              selected={statusFilter === 'all'}
              sx={{ 
                '&.Mui-selected': { 
                  backgroundColor: 'rgba(255, 204, 51, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 204, 51, 0.12)'
                  }
                }
              }}
            >
              Tous les statuts
            </MenuItem>
            <MenuItem 
              onClick={() => handleCloseFilter('active')} 
              selected={statusFilter === 'active'}
              sx={{ 
                '&.Mui-selected': { 
                  backgroundColor: 'rgba(255, 204, 51, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 204, 51, 0.12)'
                  }
                }
              }}
            >
              Actifs
            </MenuItem>
            <MenuItem 
              onClick={() => handleCloseFilter('inactive')} 
              selected={statusFilter === 'inactive'}
              sx={{ 
                '&.Mui-selected': { 
                  backgroundColor: 'rgba(255, 204, 51, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 204, 51, 0.12)'
                  }
                }
              }}
            >
              Inactifs
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Table */}
      {filteredBuses.length > 0 ? (
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
                  Bus
                </TableCell>
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
                  Date
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
              {paginatedBuses.map((bus) => (
                <TableRow 
                  key={bus._id}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                    '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <BusIcon sx={{ color: '#ffcc33', fontSize: 24 }} />
                      <Box>
                        <Typography sx={{ 
                          fontWeight: 600,
                          color: '#1a1a1a',
                          fontSize: '16px'
                        }}>
                          {bus.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666666', fontSize: '14px' }}>
                          {bus.plateNumber}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '15px' }}>
                      {bus.from && bus.to ? `${bus.from} → ${bus.to}` : 'Non défini'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '15px' }}>
                      {bus.departureDate ? new Date(bus.departureDate).toLocaleDateString('fr-FR') : 'Non défini'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={bus.isActive || false}
                          onChange={() => handleToggleStatus(bus)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4caf50' },
                            '& .MuiSwitch-track': { backgroundColor: '#f44336' }
                          }}
                        />
                      }
                      label={bus.isActive ? 'Actif' : 'Inactif'}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(bus)}
                        sx={{
                          borderColor: '#ffcc33',
                          color: '#ffcc33',
                          fontSize: '12px',
                          px: 2,
                          py: 0.5,
                          borderRadius: '8px',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 204, 51, 0.1)',
                            borderColor: '#ffb300'
                          }
                        }}
                      >
                        Voir détails
                      </Button>
                      <IconButton 
                        onClick={() => handleOpenDialog(bus)}
                        size="small"
                        sx={{ 
                          color: '#ffcc33',
                          '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(bus._id)}
                        size="small"
                        sx={{ 
                          color: '#f44336',
                          '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filteredBuses.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Bus par page"
          />
        </Paper>
      ) : (
        <Paper sx={{ 
          p: 6, 
          textAlign: 'center',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <BusIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
            {searchTerm ? "Aucun bus trouvé" : "Aucun bus enregistré"}
          </Typography>
          <Typography variant="body2" sx={{ color: '#999' }}>
            {searchTerm ? "Essayez avec d'autres termes de recherche" : "Commencez par ajouter votre premier bus"}
          </Typography>
        </Paper>
      )}

      {/* Dialog d'ajout/modification */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
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
            <BusIcon sx={{ fontSize: 28 }} />
            {editingBus ? 'Modifier le bus' : 'Ajouter un nouveau bus'}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 0,
          backgroundColor: '#ffffff'
        }}>
          <Box sx={{ p: 4 }}>
            {/* Section Informations du bus */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ 
                color: '#1a1a1a', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <BusIcon sx={{ color: '#ffcc33' }} />
                Informations du bus
              </Typography>
              <TextField
                label="Nom du bus"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                placeholder="Ex: Bus Express 1"
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
              />
            </Box>

            {/* Section Détails techniques */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ 
                color: '#1a1a1a', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <LocationIcon sx={{ color: '#ffcc33' }} />
                Détails du bus
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <TextField
                  label="Numéro de plaque"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="Ex: DK-123-AB"
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
                  label="Capacité"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="Ex: 25"
                  inputProps={{ min: 1, max: 100 }}
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

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
                <TextField
                  label="Ville de départ"
                  name="from"
                  value={formData.from}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="Ex: Dakar"
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
                  label="Ville d'arrivée"
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="Ex: Saint-Louis"
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

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
                <TextField
                  label="Date de départ"
                  name="departureDate"
                  type="datetime-local"
                  value={formData.departureDate}
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
                  label="Prix de la place (FCFA)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="Ex: 5000"
                  inputProps={{ min: 1 }}
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

            {/* Résumé du bus */}
            {formData.name && formData.plateNumber && formData.capacity && formData.from && formData.to && formData.departureDate && formData.price && (
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
                  <BusIcon sx={{ color: '#ffcc33' }} />
                  Résumé du bus
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Nom</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {formData.name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Plaque</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {formData.plateNumber}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Capacité</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                      {formData.capacity} places
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Trajet</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {formData.from} → {formData.to}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Date de départ</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {new Date(formData.departureDate).toLocaleDateString('fr-FR')}
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
            onClick={handleCloseDialog}
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
            {loading ? 'Traitement...' : (editingBus ? 'Modifier le bus' : 'Créer le bus')}
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

      {/* Dialogue des détails du bus */}
      <Dialog 
        open={detailsDialog.open} 
        onClose={handleCloseDetailsDialog}
        maxWidth="sm"
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
          py: 3,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,  }}>
            <BusIcon sx={{ fontSize: 28 }} />
            Détails du bus
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {detailsDialog.bus && (
            <Box>
              {/* Informations principales */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 600, 
                  mb: 3,
                  pt: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <BusIcon sx={{ color: '#ffcc33' }} />
                  {detailsDialog.bus.name}
                </Typography>
                
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Numéro de plaque</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {detailsDialog.bus.plateNumber}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Capacité totale</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                      {detailsDialog.bus.capacity} places
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Places disponibles</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#ffcc33' }}>
                      {detailsDialog.bus.availableSeats || detailsDialog.bus.capacity} places
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Trajet</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {detailsDialog.bus.from && detailsDialog.bus.to ? `${detailsDialog.bus.from} → ${detailsDialog.bus.to}` : 'Non défini'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Date de départ</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {detailsDialog.bus.departureDate ? new Date(detailsDialog.bus.departureDate).toLocaleDateString('fr-FR') : 'Non défini'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Prix de la place</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                      {detailsDialog.bus.price ? `${detailsDialog.bus.price} FCFA` : 'Non défini'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            onClick={handleCloseDetailsDialog}
            variant="contained"
            sx={{
              backgroundColor: '#ffcc33',
              color: '#1a1a1a',
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              '&:hover': {
                backgroundColor: '#ffb300'
              }
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Buses;
