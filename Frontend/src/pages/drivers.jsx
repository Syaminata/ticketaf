import React, { useState, useEffect } from 'react';
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
  Avatar,
  Alert,
  FormControlLabel,
  Checkbox,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Switch,
  InputAdornment
} from '@mui/material';
import { Edit, Delete, Add, CloudUpload, AttachFile, Visibility, Download, Person, Email, Phone, Lock, DirectionsCar, EventSeat, Luggage, Badge} from '@mui/icons-material';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    numero: '',
    password: '',
    matricule: '',
    marque: '',
    capacity: '',
    capacity_coffre: '',
    climatisation: false
  });
  const [files, setFiles] = useState({
    permis: null,
    photo: null
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
  const [fileViewer, setFileViewer] = useState({
    open: false,
    file: null,
    type: null
  });

  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    driver: null
  });

  const fetchDrivers = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error("Authentification manquante");
      setError("Authentification manquante. Veuillez vous reconnecter.");
      return;
    }
    
    try {
      console.log("Récupération des conducteurs...");
      const res = await axios.get('/drivers', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log("Conducteurs récupérés:", res.data);
      setDrivers(res.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error("Erreur récupération des conducteurs :", err);
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError("Erreur lors du chargement des conducteurs.");
      }
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpen = (driver = null) => {
    setError('');
    setEditDriver(driver);
    if (driver) {
      console.log('Driver climatisation:', driver.climatisation);
      setFormData({
        name: driver.name,
        email: driver.email,
        numero: driver.numero,
        password: '',
        matricule: driver.matricule,
        marque: driver.marque,
        capacity: driver.capacity,
        capacity_coffre: driver.capacity_coffre,
        climatisation: driver.climatisation || false
      });
    } else {
      setFormData({
        name: '',
        email: '',
        numero: '',
        password: '',
        matricule: '',
        marque: '',
        capacity: '',
        capacity_coffre: '',
        climatisation: false
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setFiles({ permis: null, photo: null });
    // Ne pas effacer le message de succès pour qu'il reste visible
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Validation spéciale pour le numéro de téléphone
    if (name === 'numero') {
      // Formatage automatique : ne garder que les chiffres
      const cleanValue = value.replace(/\D/g, '');
      
      // Limiter à 9 chiffres maximum
      if (cleanValue.length <= 9) {
        setFormData(prev => ({ ...prev, [name]: cleanValue }));
      }
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
    
    // Debug pour la climatisation
    if (name === 'climatisation') {
      console.log('Climatisation changée:', checked);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: files[0] || null
    }));
  };

  const handleSubmit = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return setError("Authentification nécessaire.");

    // Validation côté frontend (email optionnel)
    if (!formData.name || !formData.numero || !formData.matricule || !formData.marque || !formData.capacity || !formData.capacity_coffre) {
      setError("Le nom, numéro, matricule, marque, capacité et capacité coffre sont requis.");
      return;
    }

    // Validation du format du numéro de téléphone
    const phoneRegex = /^(77|78|76|70|75|33|71)\d{7}$/;
    if (!phoneRegex.test(formData.numero)) {
      setError("Le numéro de téléphone doit commencer par 77, 78, 76, 70, 75, 33 ou 71 et contenir exactement 9 chiffres.");
      return;
    }

    if (!editDriver && !formData.password) {
      setError("Le mot de passe est requis pour un nouveau conducteur.");
      return;
    }

    if (isNaN(formData.capacity) || formData.capacity <= 0) {
      setError("La capacité doit être un nombre positif.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Créer FormData pour gérer les fichiers
      const formDataToSubmit = new FormData();
      
      // Debug pour la climatisation
      console.log('FormData climatisation avant envoi:', formData.climatisation);
      
      // Ajouter tous les champs du formulaire
      Object.keys(formData).forEach(key => {
        if (key === 'climatisation') {
          formDataToSubmit.append(key, formData[key]);
        } else if (formData[key] !== '' && formData[key] !== null) {
          formDataToSubmit.append(key, formData[key]);
        }
      });
      
      // Ajouter les fichiers s'ils existent
      if (files.permis) {
        formDataToSubmit.append('permis', files.permis);
      }
      if (files.photo) {
        formDataToSubmit.append('photo', files.photo);
      }
      
      // Pour l'édition, supprimer le mot de passe seulement s'il est vide
      if (editDriver && formData.password === '') {
        formDataToSubmit.delete('password');
      }

      if (editDriver) {
        console.log("Mise à jour du conducteur:", editDriver._id);
        const response = await axios.put(`/drivers/${editDriver._id}`, formDataToSubmit, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        });
        console.log("Réponse mise à jour:", response.data);
        setSuccess('Conducteur mis à jour avec succès');
      } else {
        console.log("Création d'un nouveau conducteur");
        const response = await axios.post('/drivers', formDataToSubmit, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        });
        setSuccess('Conducteur créé avec succès');
      }

      console.log("Succès de l'opération");
      await fetchDrivers();
      handleClose();
      setError('');

      setTimeout(() => {
        setSuccess('');
      }, 5000); 
    } catch (err) {
      console.error("Erreur soumission :", err);
      console.error("Détails de l'erreur:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } else if (err.response?.data?.missing) {
        const missingFields = Object.keys(err.response.data.missing).filter(field => err.response.data.missing[field]);
        setError(`Champs manquants: ${missingFields.join(', ')}`);
      } else {
        setError(err.response?.data?.message || 'Erreur serveur');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const driver = drivers.find(d => d._id === id);
    const driverInfo = driver 
      ? `"${driver.name}" - Matricule: ${driver.marque} ${driver.matricule}`
      : 'ce conducteur';
    
    setConfirmDialog({
      open: true,
      title: "Supprimer le conducteur",
      message: `Êtes-vous sûr de vouloir supprimer définitivement le conducteur ${driverInfo} ?`,
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
      await axios.delete(`/drivers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Conducteur supprimé avec succès');
      fetchDrivers();
      setConfirmDialog(prev => ({ ...prev, open: false }));
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error("Erreur suppression :", err);
      setError("Erreur lors de la suppression du conducteur.");
      setConfirmDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleActivate = async (id) => {
    const token = sessionStorage.getItem('token');
    if (!token) return setError('Authentification nécessaire.');
    try {
      await axios.put(`/drivers/${id}/activate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Conducteur activé');
      await fetchDrivers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'activation");
    }
  };

  const handleDeactivate = async (id) => {
    const token = sessionStorage.getItem('token');
    if (!token) return setError('Authentification nécessaire.');
    try {
      await axios.put(`/drivers/${id}/deactivate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Conducteur désactivé');
      await fetchDrivers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la désactivation');
    }
  };

  const handleViewFile = (file, type) => {
    setFileViewer({
      open: true,
      file: file,
      type: type
    });
  };

  const handleDownloadFile = (file, type) => {
    const link = document.createElement('a');
    link.href = `/uploads/drivers/${file.filename}`;
    link.download = file.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDetails = (driver) => {
    setDetailsDialog({
      open: true,
      driver: driver
    });
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialog({
      open: false,
      driver: null
    });
  };

  return (
    <Box sx={{ 
      p:1, 
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
            color: '#1a1a1a',
            mb: 1,
            fontSize: '20px'
          }}>
            Liste des Conducteurs
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#666666',
            fontSize: '16px'
          }}>
            Gérez les conducteurs et leurs informations
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
          Ajouter un conducteur
        </Button>
      </Box>

      {/* Table */}
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
                Conducteur
              </TableCell>
              
              <TableCell sx={{ 
                color: '#1a1a1a', 
                fontWeight: 700,
                fontSize: '16px'
              }}>
                Numero
              </TableCell>
              <TableCell sx={{ 
                color: '#1a1a1a', 
                fontWeight: 700,
                fontSize: '16px'
              }}>
                Véhicule
              </TableCell>
              <TableCell sx={{ 
                color: '#1a1a1a', 
                fontWeight: 700,
                fontSize: '16px',
                textAlign: 'center'
              }}>
                Documents
              </TableCell>
              <TableCell sx={{ 
                color: '#1a1a1a', 
                fontWeight: 700,
                fontSize: '16px',
                textAlign: 'center'
              }}>
                Status
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
            {drivers.map((driver, index) => (
              <TableRow 
                key={driver._id}
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                  '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: '#ffcc33',
                      color: '#1a1a1a',
                      width: 32,
                      height: 32,
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography sx={{ 
                        fontWeight: 600,
                        color: '#1a1a1a',
                        fontSize: '16px'
                      }}>
                        {driver.name}
                      </Typography>
                      
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '15px' }}>
                    {driver.numero}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '15px' }}>
                      {driver.marque}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666666', fontSize: '14px' }}>
                      {driver.capacity} places
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                    {driver.permis && driver.permis.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewFile(driver.permis[0], 'permis')}
                          sx={{ 
                            color: '#ffcc33',
                            '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadFile(driver.permis[0], 'permis')}
                          sx={{ 
                            color: '#4caf50',
                            '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                          }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '10px' }}>
                          Permis
                        </Typography>
                      </Box>
                    )}
                    {driver.photo && driver.photo.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewFile(driver.photo[0], 'photo')}
                          sx={{ 
                            color: '#ffcc33',
                            '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadFile(driver.photo[0], 'photo')}
                          sx={{ 
                            color: '#4caf50',
                            '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                          }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '10px' }}>
                          Photo
                        </Typography>
                      </Box>
                    )}
                    {(!driver.permis || driver.permis.length === 0) && (!driver.photo || driver.photo.length === 0) && (
                      <Typography variant="caption" sx={{ color: '#999', fontStyle: 'italic' }}>
                        Aucun document
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Switch
                    checked={!!driver.isActive}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleActivate(driver._id);
                      } else {
                        handleDeactivate(driver._id);
                      }
                    }}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4caf50' },
                      '& .MuiSwitch-track': { backgroundColor: '#f44336' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(driver)}
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
                      onClick={() => handleOpen(driver)}
                      size="small"
                      sx={{ 
                        color: '#ffcc33',
                        '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(driver._id)}
                      size="small"
                      sx={{ 
                        color: '#f44336',
                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '3px solid #ffcc33',
          color: '#1a1a1a',
          fontWeight: 700,
          fontSize: '20px',
          textAlign: 'center',
          py: 2
        }}>
          {editDriver ? 'Modifier le conducteur' : 'Ajouter un nouveau conducteur'}
        </DialogTitle>
        <DialogContent sx={{ 
          p: 3,
          backgroundColor: '#ffffff'
        }}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2.5,
            padding: "15px",
            pt: '35px'
          }}>
            {/* Ligne 1: Nom et Email */}
            <TextField
              label="Nom complet"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#ffcc33' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
            <TextField
              label="Adresse email (optionnel)"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              helperText="L'email est optionnel."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#ffcc33' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
            {/* Ligne 2: Téléphone et Matricule */}
            <TextField
              label="Numéro de téléphone"
              name="numero"
              type="tel"
              value={formData.numero}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ color: '#ffcc33' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
            <TextField
              label="Matricule"
              name="matricule"
              value={formData.matricule}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge sx={{ color: '#ffcc33' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
            {/* Ligne 3: Marque et Nombre de places */}
            <TextField
              label="Marque du véhicule"
              name="marque"
              value={formData.marque}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DirectionsCar sx={{ color: '#ffcc33' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
            <TextField
              label="Nombre de places"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventSeat sx={{ color: '#ffcc33' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
            {/* Ligne 4: Capacité coffre et Mot de passe */}
            <FormControl fullWidth required>
              <InputLabel sx={{ 
                '&.Mui-focused': {
                  color: '#ffcc33',
                }
              }}>
                Capacité du coffre
              </InputLabel>
              <Select
                name="capacity_coffre"
                value={formData.capacity_coffre}
                onChange={handleChange}
                label="Capacité du coffre"
                startAdornment={
                  <InputAdornment position="start">
                    <Luggage sx={{ color: '#ffcc33', ml: 1 }} />
                  </InputAdornment>
                }
                sx={{
                  borderRadius: '8px',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ffcc33',
                  },
                }}
              >
                <MenuItem value="petit">Petit</MenuItem>
                <MenuItem value="moyen">Moyen</MenuItem>
                <MenuItem value="grand">Grand</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required={!editDriver}
              helperText={editDriver ? "Laissez vide pour conserver le mot de passe actuel" : "Mot de passe requis pour le nouveau conducteur"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#ffcc33' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#ffcc33',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffcc33',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffcc33',
                },
              }}
            />
            
            {/* Ligne 5: Climatisation  */}
            <FormControlLabel
              control={
                <Checkbox
                  name="climatisation"
                  checked={formData.climatisation || false}
                  onChange={handleChange}
                  sx={{
                    color: '#ffcc33',
                    '&.Mui-checked': {
                      color: '#ffcc33',
                    },
                  }}
                />
              }
              label="Véhicule équipé de climatisation"
              sx={{
                gridColumn: 'span 2',
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.9rem',
                  fontWeight: 500
                }
              }}
            />
            
            {/* Upload du permis (pleine largeur) */}
            <FormControl fullWidth sx={{ gridColumn: 'span 2' }}>
              <InputLabel sx={{ 
                color: '#ffcc33',
                '&.Mui-focused': {
                  color: '#ffcc33',
                }
              }}>
                
              </InputLabel>
              <Box sx={{ mt: 1 }}>
                <input
                  type="file"
                  name="permis"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="permis-upload"
                />
                <label htmlFor="permis-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AttachFile />}
                    sx={{
                      borderColor: '#ffcc33',
                      color: 'black',
                      '&:hover': {
                        borderColor: '#ffb300',
                        backgroundColor: 'rgba(255, 204, 51, 0.1)'
                      }
                    }}
                  >
                    {files.permis ? files.permis.name : 'Permis de conduire (PDF/Image)'}
                  </Button>
                </label>
              </Box>
            </FormControl>
            
            {/* Upload de la photo (pleine largeur) */}
            <FormControl fullWidth sx={{ gridColumn: 'span 2' }}>
              <InputLabel sx={{ 
                color: '#ffcc33',
                '&.Mui-focused': {
                  color: '#ffcc33',
                }
              }}>
              </InputLabel>
              <Box sx={{ mt: 1 }}>
                <input
                  type="file"
                  name="photo"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{
                      borderColor: '#ffcc33',
                      color: '#44423fff',
                      '&:hover': {
                        borderColor: '#ffcc33',
                        backgroundColor: 'rgba(255, 204, 51, 0.1)'
                      }
                    }}
                  >
                    {files.photo ? files.photo.name : 'photo du vehicule(profil et face)'}
                  </Button>
                </label>
              </Box>
            </FormControl>
            
            {error && (
              <Box sx={{ 
                gridColumn: 'span 2',
                p: 2, 
                backgroundColor: '#ffebee', 
                borderRadius: '8px',
                border: '1px solid #f44336'
              }}>
                <Typography color="error" variant="body2" sx={{ fontWeight: 500 }}>
                  {error}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          backgroundColor: '#f8f9fa',
          gap: 2
        }}>
          <Button 
            onClick={handleClose}
            sx={{
              color: '#666666',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              py: 1
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
              px: 3,
              py: 1,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: loading ? '#ccc' : '#ffb300',
              }
            }}
          >
            {loading ? 'Traitement...' : (editDriver ? 'Modifier' : 'Créer')}
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

      {/* Dialogue de visualisation des fichiers */}
      <Dialog
        open={fileViewer.open}
        onClose={() => setFileViewer({ open: false, file: null, type: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '3px solid #ffcc33',
          color: '#1a1a1a',
          fontWeight: 700,
          fontSize: '18px',
          textAlign: 'center',
          py: 2
        }}>
          {fileViewer.type === 'permis' ? 'Permis de conduire' : 'Photo du véhicule'}
        </DialogTitle>
        <DialogContent sx={{ p: 0, textAlign: 'center' }}>
          {fileViewer.file && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                {fileViewer.file.originalName}
              </Typography>
              {fileViewer.file.filename && (
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  maxHeight: '60vh'
                }}>
                  {fileViewer.type === 'photo' ? (
                    <img
                      src={`/uploads/drivers/${fileViewer.file.filename}`}
                      alt={fileViewer.file.originalName}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '60vh',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : (
                    <iframe
                      src={`/uploads/drivers/${fileViewer.file.filename}`}
                      style={{
                        width: '100%',
                        height: '60vh',
                        border: 'none'
                      }}
                      title={fileViewer.file.originalName}
                    />
                  )}
                  <Box sx={{ 
                    display: 'none',
                    p: 3,
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Fichier non disponible
                    </Typography>
                    <Typography variant="body2">
                      Le fichier ne peut pas être affiché. Utilisez le bouton de téléchargement.
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 2, 
          backgroundColor: '#f8f9fa',
          gap: 2
        }}>
          <Button 
            onClick={() => setFileViewer({ open: false, file: null, type: null })}
            sx={{
              color: '#666666',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              py: 1
            }}
          >
            Fermer
          </Button>
          {fileViewer.file && (
            <Button 
              onClick={() => handleDownloadFile(fileViewer.file, fileViewer.type)}
              variant="contained"
              startIcon={<Download />}
              sx={{
                backgroundColor: '#4caf50',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#45a049',
                }
              }}
            >
              Télécharger
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialogue des détails du conducteur */}
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
          py: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Person sx={{ fontSize: 28 }} />
            Détails du conducteur
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {detailsDialog.driver && (
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
                  <Person sx={{ color: '#ffcc33' }} />
                  {detailsDialog.driver.name}
                </Typography>
                
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Email</Typography>
                    <Typography sx={{ fontWeight: 600, color: detailsDialog.driver.email ? '#1a1a1a' : '#999999' }}>
                      {detailsDialog.driver.email || 'Non renseigné'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Numéro de téléphone</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {detailsDialog.driver.numero}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Matricule</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {detailsDialog.driver.matricule}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Marque du véhicule</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {detailsDialog.driver.marque}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Capacité</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {detailsDialog.driver.capacity} places
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Capacité du coffre</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' }}>
                      {detailsDialog.driver.capacity_coffre}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>Climatisation</Typography>
                    <Typography sx={{ fontWeight: 600, color: detailsDialog.driver.climatisation ? '#4caf50' : '#f44336' }}>
                      {detailsDialog.driver.climatisation ? 'Oui' : 'Non'}
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
