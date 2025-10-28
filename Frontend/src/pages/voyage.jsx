import React, { useState, useEffect } from 'react';
import { voyageAPI } from '../api/voyage';
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
  Alert
} from '@mui/material';
import { Edit, Delete, Add, DirectionsBus, LocationOn, AccessTime, AttachMoney, DoubleArrow } from '@mui/icons-material';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function Voyage() {
  const [voyages, setVoyages] = useState([]);
  const [drivers, setDrivers] = useState([]);
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
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  return (
    <Box sx={{ 
      p: 1, 
      backgroundColor: '#f8f9fa', 
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
          Planifier un voyage
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      {voyages.length > 0 ? (
        <Paper sx={{ 
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
              {voyages.map((voyage, index) => (
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
                        {voyage.driver?.matricule}
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
          background: 'linear-gradient(135deg, #ffcc33 0%, #ffb300 100%)',
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
            background: 'linear-gradient(90deg, #ff6b35, #f7931e, #ffcc33)'
          }
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
              <TextField
                label="Choisir un conducteur"
                name="driverId"
                value={formData.driverId}
                onChange={handleChange}
                select
                fullWidth
                required
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
              >
                {selectableDrivers.map((driver) => (
                  <MenuItem key={driver._id} value={driver._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {driver.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666666' }}>
                          {driver.marque} • {driver.capacity} places 
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
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
                <TextField
                  label="Ville de départ"
                  name="from"
                  value={formData.from}
                  onChange={handleChange}
                  fullWidth
                  required
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
                  label="Ville de destination"
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  fullWidth
                  required
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
