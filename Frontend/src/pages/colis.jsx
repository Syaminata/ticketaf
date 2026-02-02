import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import storage from '../utils/storage';
import { Description } from '@mui/icons-material';
import { colisAPI } from '../api/colis';
import { voyageAPI } from '../api/voyage';
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
  Chip,
  Alert,
  TablePagination,
  MenuItem,
  Avatar,
  Card,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  LocalShipping,
  Image as ImageIcon,
  Cancel,
  CheckCircle,
  HourglassEmpty,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudUpload,
  Person,
  Visibility as VisibilityIcon,
  Inventory,
  Route,
  Image,
  AttachMoney 
} from '@mui/icons-material';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function Colis() {
  const [colis, setColis] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [open, setOpen] = useState(false);
  const [editColis, setEditColis] = useState(null);
  const [formData, setFormData] = useState({
    voyageId: '',
    description: '',
    prix: '',
    villeDepart: '',
    destination: '',
    dateEnvoi: new Date().toISOString().split('T')[0], // Date du jour par défaut
    destinataire: {
      nom: '',
      telephone: '',
      adresse: ''
    }
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [voyageFilter, setVoyageFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedColis, setSelectedColis] = useState(null);

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const fetchColis = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError('Authentification manquante. Veuillez vous reconnecter.');
      return;
    }

    try {
      let res;
      if (user.role === 'superadmin' || user.role === 'gestionnaireColis') {
        res = await colisAPI.getAllColis();
      } else {
        res = await colisAPI.getUserColis();
      }
      
      console.log('📦 Données des colis:', res);
      
      const now = new Date();
      // Afficher la structure du premier colis pour le débogage
      if (res.length > 0) {
        console.log('📦 Structure du premier colis:', res[0]);
      }

      const filteredColis = res.filter(colisItem => {
        const voyageDate = colisItem.voyage?.date || colisItem.reservation?.voyage?.date;
        if (!voyageDate) return true;
        return new Date(voyageDate) >= now;
      });

      setColis(filteredColis);
      setError('');
    } catch (err) {
      console.error('Erreur récupération des colis:', err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError('Erreur lors du chargement des colis: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const fetchVoyages = async () => {
  try {
    console.log('Début de fetchVoyages');
    const colisRes = await colisAPI.getAllColis();
    console.log('Réponse de getAllColis:', colisRes);
    
    const colisData = colisRes.data || colisRes; 
    console.log('Données des colis:', colisData);
    const uniqueRoutes = new Map();
    colisData.forEach((colisItem, index) => {
      console.log(`Traitement du colis ${index}:`, colisItem);
      
      const from = colisItem.villeDepart;
      const to = colisItem.destination;
      if (from && to) {
        const key = `${from}-${to}`;
        console.log(`Trajet trouvé: ${key}`);
        if (!uniqueRoutes.has(key)) {
          uniqueRoutes.set(key, { from, to });
          console.log('Nouveau trajet ajouté:', { from, to });
        }
      } else {
        console.log(`Aucun trajet valide trouvé pour le colis ${index}`);
      }
    });
    const routesArray = Array.from(uniqueRoutes.values());
    console.log('Liste finale des trajets uniques:', routesArray);
    setVoyages(routesArray);
  } catch (err) {
    console.error('Erreur récupération des voyages:', err);
    setVoyages([]);
  }
};

// Ajouter ce useEffect pour suivre les changements de l'état voyages
useEffect(() => {
  console.log('État voyages mis à jour:', voyages);
}, [voyages]);

// Ajouter ce useEffect pour suivre les changements du filtre
useEffect(() => {
  console.log('Filtre de voyage changé:', voyageFilter);
}, [voyageFilter]);


  useEffect(() => {
    fetchColis();
    fetchVoyages();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, voyageFilter]);

  const handleOpen = (colisItem = null) => {
    setError('');
    setEditColis(colisItem);
    setImageFile(null);
    setImagePreview(null);

    if (colisItem) {
      setFormData({
        description: colisItem.description || '',
        prix: colisItem.prix || '',
        villeDepart: colisItem.villeDepart || '',
        destination: colisItem.destination || '',
        dateEnvoi: colisItem.dateEnvoi ? new Date(colisItem.dateEnvoi).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        destinataire: {
          nom: colisItem.destinataire?.nom || '',
          telephone: colisItem.destinataire?.telephone || '',
          adresse: colisItem.destinataire?.adresse || ''
        }
      });
      if (colisItem.imageUrl) {
        setImagePreview(colisItem.imageUrl);
      }
    } else {
      setFormData({
        description: '',
        prix: '',
        villeDepart: '',
        destination: '',
        dateEnvoi: new Date().toISOString().split('T')[0],
        destinataire: {
          nom: '',
          telephone: '',
          adresse: ''
        }
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('destinataire.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        destinataire: {
          ...prev.destinataire,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5 MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError('Authentification nécessaire.');
      return;
    }

    if (!formData.villeDepart || !formData.destination || !formData.dateEnvoi || !formData.destinataire.nom || !formData.destinataire.telephone) {
      setError('Tous les champs sont obligatoires.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      
      submitData.append('description', formData.description || '');
      
      if (user.role === 'superadmin' || user.role === 'gestionnaireColis') {
        if (formData.prix !== '' && formData.prix !== null) {
          submitData.append('prix', parseFloat(formData.prix));
          // Le statut reste 'en attente' par défaut dans le backend
          // Le client devra accepter le prix pour passer à 'enregistré'
        }
      }
      
      submitData.append('villeDepart', formData.villeDepart);
      submitData.append('destination', formData.destination);
      submitData.append('dateEnvoi', formData.dateEnvoi);
      
      submitData.append('destinataire[nom]', formData.destinataire.nom);
      submitData.append('destinataire[telephone]', formData.destinataire.telephone);
      submitData.append('destinataire[adresse]', formData.destinataire.adresse || '');
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editColis) {
        await colisAPI.updateColis(editColis._id, submitData);
        setSuccess('Colis mis à jour avec succès');
      } else {
        await colisAPI.createColis(submitData);
        setSuccess('Colis créé avec succès');
      }

      await fetchColis();
      handleClose();

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Erreur soumission:', err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la création du colis');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const colisItem = colis.find(c => c._id === id);
    const colisInfo = colisItem
      ? `le colis de ${colisItem.destinataire?.nom}`
      : 'ce colis';

    setConfirmDialog({
      open: true,
      title: 'Supprimer le colis',
      message: `Êtes-vous sûr de vouloir supprimer définitivement ${colisInfo} ?`,
      onConfirm: () => confirmDelete(id),
      loading: false
    });
  };

  const handleOpenDetails = (colisItem) => {
    setSelectedColis(colisItem);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedColis(null);
  };

  const handleStatusChange = async (colisId, newStatus) => {
    console.log(`[handleStatusChange] Début pour colis ${colisId}, newStatus=${newStatus}`);
    
    if (newStatus !== 'envoyé') {
      console.log(`[handleStatusChange] Statut non autorisé, sortie`);
      return; // uniquement "envoyé"
    }

    if (!window.confirm('Êtes-vous sûr de vouloir marquer ce colis comme envoyé ?')) return;

    try {
      setLoading(true);

      // Récupérer le colis avant modification pour debug
      const colisBefore = await colisAPI.getColis(colisId);
      console.log(`[handleStatusChange] Avant update:`, colisBefore);

      await colisAPI.updateColis(colisId, { status: newStatus });

      const colisAfter = await colisAPI.getColis(colisId);
      console.log(`[handleStatusChange] Après update:`, colisAfter);

      await fetchColis();
      setSuccess('Colis marqué comme envoyé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour que le client accepte le prix
  const handleAcceptPrice = async (colisId) => {
  console.log(`[handleAcceptPrice] Début pour colis ${colisId}`);

  if (!window.confirm('Êtes-vous sûr de vouloir accepter ce prix ? Le colis sera enregistré.')) return;

  try {
    setLoading(true);

    // Récupérer le colis avant modification pour debug
    const colisBefore = await colisAPI.getColis(colisId);
    console.log(`[handleAcceptPrice] Avant update:`, colisBefore);

    await colisAPI.updateColis(colisId, { status: 'enregistré' });

    const colisAfter = await colisAPI.getColis(colisId);
    console.log(`[handleAcceptPrice] Après update:`, colisAfter);

    await fetchColis();
    setSuccess('Prix accepté avec succès. Le colis est maintenant enregistré.');
    setTimeout(() => setSuccess(''), 3000);
  } catch (err) {
    console.error('Erreur lors de l\'acceptation du prix:', err);
    setError('Erreur lors de l\'acceptation du prix');
  } finally {
    setLoading(false);
  }
};

  const confirmDelete = async (id) => {
    setConfirmDialog(prev => ({ ...prev, loading: true }));

    try {
      await colisAPI.deleteColis(id);
      setSuccess('Colis supprimé avec succès');
      fetchColis();
      setConfirmDialog(prev => ({ ...prev, open: false }));

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression du colis.');
      setConfirmDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'enregistré':
        return <Inventory sx={{ fontSize: 16 }} />;
      case 'envoyé':
        return <LocalShipping sx={{ fontSize: 16 }} />;
      case 'reçu':
        return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'annulé':
        return <Cancel sx={{ fontSize: 16 }} />;
      default:
        return <HourglassEmpty sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enregistré':
        return 'primary';
      case 'envoyé':
        return 'info';
      case 'reçu':
        return 'success';
      case 'annulé':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const inputStyle = {
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
  };

  const InfoRow = ({ label, children }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
      }}
    >
      <Typography 
        variant="body2" 
        sx={{ color: '#666666', fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Box 
        sx={{ 
          textAlign: 'right', 
          fontWeight: 600, 
          color: '#1a1a1a',
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        {children}
      </Box>
    </Box>
  );

  const filteredColis = colis.filter(colisItem => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (colisItem.destinataire?.nom || '').toLowerCase().includes(term) ||
      (colisItem.destinataire?.telephone || '').toLowerCase().includes(term) ||
      (colisItem.description || '').toLowerCase().includes(term) ||
      (colisItem.villeDepart || '').toLowerCase().includes(term) ||
      (colisItem.destination || '').toLowerCase().includes(term);
    const matchesStatus = !statusFilter || colisItem.status === statusFilter;
    const matchesVoyage = !voyageFilter || 
      (colisItem.villeDepart && colisItem.destination && 
      `${colisItem.villeDepart}-${colisItem.destination}` === voyageFilter);
    return matchesSearch && matchesStatus && matchesVoyage;
  });

  const paginatedColis = filteredColis.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 1, backgroundColor: '#ffff', minHeight: '100vh', color: '#1a1a1a' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '20px', color: '#1a1a1a', mb: 1 }}>
            Gestion des Colis
          </Typography>
          <Typography variant="body1" sx={{ color: '#666666', fontSize: '16px' }}>
            {user.role === 'superadmin' || user.role === 'gestionnaireColis' ? 'Gérez tous les colis' : 'Gérez vos envois de colis'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => handleOpen()}
          startIcon={<Add />}
          sx={{
            backgroundColor: 'transparent',
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
          Envoyer un colis
        </Button>
      </Box>

      {/* Filtres */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3, 
        alignItems: 'center',
        flexWrap: 'nowrap',
        p: 1.5,
        borderRadius: '10px',
        '& > *': {
          marginBottom: '0 !important',
          flexShrink: 0
        }
      }}>
        <TextField
          placeholder="Destinataire, description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#666', mr: 1, fontSize: 20 }} />,
            sx: {
              height: '40px',
              '& input': {
                padding: '10px 14px 10px 6px',
                height: '20px'
              }
            }
          }}
          sx={{
            width: 280,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '&:hover fieldset': { borderColor: '#ffcc33' },
              '&.Mui-focused fieldset': { borderColor: '#ffcc33', borderWidth: 2 },
            },
            '& .MuiInputLabel-root': {
              transform: 'translate(14px, 10px) scale(1)',
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -6px) scale(0.75)',
              },
            },
            '& .MuiInputBase-input': {
              padding: '8px 14px 8px 6px',
            },
          }}
        />

        <FormControl 
          size="small" 
          sx={{ 
            minWidth: 150,
            '& .MuiInputBase-root': {
              height: '40px',
              '& .MuiSelect-select': {
                paddingTop: '10px',
                paddingBottom: '10px'
              }
            },
            '& .MuiInputLabel-root': {
              transform: 'translate(14px, 10px) scale(1)',
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -6px) scale(0.75)',
              },
            },
          }}
        >
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            renderValue={(selected) => selected ? selected : 'Statut'}
            sx={{
              borderRadius: '8px',
              backgroundColor: 'white',
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffcc33' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffcc33' },
              '& .MuiSelect-select': {
                color: statusFilter ? 'inherit' : '#666',
                
              },
            }
            
            }
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="en attente">En attente</MenuItem>
            <MenuItem value="enregistré">Enregistré</MenuItem>
            <MenuItem value="envoyé">Envoyé</MenuItem>
            <MenuItem value="reçu">Reçu</MenuItem>
            <MenuItem value="annulé">Annulé</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200, marginLeft: 2 }}>
          <Select
            value={voyageFilter}
            onChange={(e) => {
              console.log('Nouvelle valeur sélectionnée:', e.target.value);
              setVoyageFilter(e.target.value);
            }}
            displayEmpty
            renderValue={(selected) => selected ? selected.replace('-', ' → ') : 'Tous les trajets'}
            sx={{
              backgroundColor: 'white',
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ddd',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ffcc33',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ffcc33',
              },
            }}
          >
            <MenuItem value="">
              <em>Tous les trajets</em>
            </MenuItem>
            {voyages.map((voyage, index) => {
              const value = `${voyage.from}-${voyage.to}`;
              return (
                <MenuItem key={value} value={value}>
                  {voyage.from} → {voyage.to}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {colis.length > 0 ? (
        <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(206, 204, 204, 0.43)' }}>
          <Table>
            <TableHead sx={{ borderBottom: '3px solid #ffcc33', '& .MuiTableCell-root': { borderBottom: '3px solid #ffcc33' } }}>
              <TableRow>
                <TableCell sx={{ width: '60px' }}></TableCell>
                <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px' }}>Destinataire</TableCell>
                <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px' }}>Trajet</TableCell>
                <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px' }}>Date d'envoi souhaité</TableCell>
                {user.role === 'superadmin' || user.role === 'gestionnaireColis' && (
                  <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px' }}>Expéditeur</TableCell>
                )}
                <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px', textAlign: 'center' }}>Statut</TableCell>
                <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedColis.map((colisItem) => (
                <TableRow
                  key={colisItem._id}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                    '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                  }}
                >
                  <TableCell>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFA000'
                      }}
                    >
                      <LocalShipping />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {colisItem.destinataire?.nom}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666666' }}>
                      {colisItem.destinataire?.telephone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{colisItem.villeDepart || 'Non spécifiée'}</span>
                        <span>→</span>
                        <span>{colisItem.destination}</span>
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                      {new Date(colisItem.dateEnvoi).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </Typography>
                  </TableCell>
                  {user.role === 'superadmin' || user.role === 'gestionnaireColis' && (
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {colisItem.expediteur?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666666' }}>
                        {colisItem.expediteur?.numero || 'N/A'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell sx={{ textAlign: 'center' }}>
                    {colisItem.status === 'enregistré' ? (
                      <Select
                        value={colisItem.status}
                        onChange={(e) => handleStatusChange(colisItem._id, e.target.value)}
                        size="small"
                        sx={{
                          minWidth: 120,
                          '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontWeight: 500,
                            backgroundColor: '#e3f2fd',
                            color: '#1565c0'
                          }
                        }}
                        disabled={loading}
                      >
                        <MenuItem value="enregistré">Enregistré</MenuItem>
                        <MenuItem value="envoyé">Marquer comme Envoyé</MenuItem>
                      </Select>
                    ) : (
                      <Chip
                        icon={getStatusIcon(colisItem.status)}
                        label={getStatusText(colisItem.status)}
                        color={getStatusColor(colisItem.status)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDetails(colisItem)}
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
                    
                    {/* Bouton Accepter le prix pour les clients quand le statut est "en attente" */}
                    {colisItem.status === 'en attente' && user.role !== 'superadmin' && user.role !== 'gestionnaireColis' && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAcceptPrice(colisItem._id)}
                        sx={{
                          ml: 1,
                          backgroundColor: '#4caf50',
                          color: 'white',
                          fontSize: '12px',
                          px: 2,
                          py: 0.5,
                          borderRadius: '8px',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: '#45a049'
                          }
                        }}
                      >
                        Accepter le prix
                      </Button>
                    )}
                    
                    <IconButton
                      onClick={() => handleOpen(colisItem)}
                      sx={{ color: '#ffcc33', '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' } }}
                      title="Modifier"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(colisItem._id)}
                      sx={{ color: '#f44336', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}
                      title="Supprimer"
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
            count={filteredColis.length}
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
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LocalShipping sx={{ fontSize: 80, color: '#ddd', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#999' }}>
            Aucun colis trouvé
          </Typography>
        </Box>
      )}

      {/* Dialog Création/Modification */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}>
        <DialogTitle sx={{ borderBottom: '3px solid #ffcc33', color: '#1a1a1a', fontWeight: 700, fontSize: '24px', textAlign: 'center', py: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <LocalShipping sx={{ fontSize: 28 }} />
            {editColis ? 'Modifier le colis' : 'Envoyé un nouveau colis'}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4, backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

            {/* ================== SECTION INFORMATIONS DE LIVRAISON ================== */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#1a1a1a',
                }}
              >
                <LocalShipping sx={{ color: '#ffcc33' }} />
                Informations de livraison
              </Typography>

              <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Ville de départ *"
                  name="villeDepart"
                  value={formData.villeDepart}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={inputStyle}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Destination *"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={inputStyle}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Date d'envoi souhaitée *"
                  name="dateEnvoi"
                  type="date"
                  value={formData.dateEnvoi}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={inputStyle}
                />
              </Grid>
            </Grid>

            {/* ================== SECTION DESTINATAIRE ================== */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#1a1a1a',
                }}
              >
                <Person sx={{ color: '#ffcc33' }} />
                Informations du destinataire
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nom du destinataire"
                    name="destinataire.nom"
                    value={formData.destinataire.nom}
                    onChange={handleChange}
                    fullWidth
                    required
                    sx={inputStyle}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Téléphone "
                    name="destinataire.telephone"
                    value={formData.destinataire.telephone}
                    onChange={handleChange}
                    fullWidth
                    required
                    sx={inputStyle}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Adresse"
                    name="destinataire.adresse"
                    value={formData.destinataire.adresse || ''}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    sx={inputStyle}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* ================== SECTION DESCRIPTION ================== */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#1a1a1a',
                }}
              >
                <Description sx={{ color: '#ffcc33' }} />
                Détails du colis
              </Typography>

              <TextField
                label="Description du colis"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                sx={inputStyle}
              />
            </Box>

            {/* ================== SECTION PRIX (ADMIN UNIQUEMENT) ================== */}
            {(user.role === 'superadmin' || user.role === 'gestionnaireColis') && (
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#1a1a1a',
                  }}
                >
                  <AttachMoney sx={{ color: '#ffcc33' }} />
                  Prix du colis
                </Typography>

                <TextField
                  label="Prix (FCFA)"
                  name="prix"
                  type="number"
                  value={formData.prix}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 0, step: 100 }}
                  helperText="Veuiller definir le prix pour ce colis"
                  sx={inputStyle}
                />
              </Box>
            )}

            {/* ================== SECTION IMAGE ================== */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#1a1a1a',
                }}
              >
                <CloudUpload sx={{ color: '#ffcc33' }} />
                Image du colis
              </Typography>

              <Box sx={{ textAlign: 'center' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{
                      borderColor: '#ffcc33',
                      color: '#ffcc33',
                      borderRadius: '12px',
                      textTransform: 'none',
                      px: 4,
                      '&:hover': {
                        borderColor: '#ffb300',
                        backgroundColor: 'rgba(255, 204, 51, 0.1)',
                      },
                    }}
                  >
                    Télécharger une image
                  </Button>
                </label>

                {imagePreview && (
                  <Card sx={{ mt: 3, maxWidth: 280, mx: 'auto', borderRadius: '12px' }}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={imagePreview}
                      alt="Aperçu du colis"
                    />
                  </Card>
                )}
              </Box>
            </Box>

            {/* ================== ERREUR ================== */}
            {error && (
              <Alert severity="error" sx={{ borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

          </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, backgroundColor: '#f8f9fa', gap: 2, borderTop: '1px solid #e0e0e0' }}>
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
              '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' }
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
            {loading ? 'Traitement...' : (editColis ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation */}
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

      {/* Dialog Détails */}
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
            flexDirection: 'column'
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
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <LocalShipping sx={{ fontSize: 28 }} />
            Détails du colis
          </Box>
        </DialogTitle>

        {/* ================= CONTENT ================= */}
        <DialogContent sx={{ p: 4, backgroundColor: '#ffffff'}}>
          {selectedColis && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: '400px' }}>
              
              {/* Destinataire */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Person sx={{ color: '#ffcc33' }} />
                  Destinataire
                </Typography>

                <Box sx={{ display: 'grid', gap: 2 }}>
                  <InfoRow label="Nom">
                    {selectedColis.destinataire?.nom}
                  </InfoRow>

                  <InfoRow label="Téléphone">
                    {selectedColis.destinataire?.telephone}
                  </InfoRow>

                  {selectedColis.destinataire?.adresse && (
                    <InfoRow label="Adresse">
                      {selectedColis.destinataire.adresse}
                    </InfoRow>
                  )}
                </Box>
              </Box>

              {/* Expéditeur */}
              {(selectedColis.expediteur?.name || selectedColis.expediteur?.numero) && (
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Person sx={{ color: '#ffcc33' }} />
                    Expéditeur
                  </Typography>

                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {selectedColis.expediteur?.name && (
                      <InfoRow label="Nom">
                        {selectedColis.expediteur.name}
                      </InfoRow>
                    )}

                    {selectedColis.expediteur?.numero && (
                      <InfoRow label="Téléphone">
                        {selectedColis.expediteur.numero}
                      </InfoRow>
                    )}
                  </Box>
                </Box>
              )}

              {/* Infos Colis */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Inventory sx={{ color: '#ffcc33' }} />
                  Informations du colis
                </Typography>

                <Box sx={{ display: 'grid', gap: 2 }}>
                  <InfoRow label="Statut">
                    <Chip
                      icon={getStatusIcon(selectedColis.status)}
                      label={getStatusText(selectedColis.status)}
                      color={getStatusColor(selectedColis.status)}
                      sx={{ fontWeight: 600 }}
                    />
                  </InfoRow>

                  <InfoRow label="Description">
                    {selectedColis.description || 'Aucune description'}
                  </InfoRow>
                  {(user.role === 'superadmin' || user.role === 'gestionnaireColis') && (
                    <InfoRow label="Prix">
                      {selectedColis.prix 
                        ? `${selectedColis.prix.toLocaleString('fr-FR')} FCFA` 
                        : 'Non défini'}
                    </InfoRow>
                  )}

                  <InfoRow label="Enregistré le">
                    {new Date(selectedColis.createdAt).toLocaleString('fr-FR')}
                  </InfoRow>
                </Box>
              </Box>

              {/* Infos Voyage */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Route sx={{ color: '#ffcc33' }} />
                  Informations du voyage
                </Typography>

                <Box sx={{ display: 'grid', gap: 2 }}>
                  <InfoRow label="Trajet">
                    {selectedColis.villeDepart} → {selectedColis.destination}
                  </InfoRow>

                  <InfoRow label="Date d'envoi souhaitée">
                    {selectedColis.dateEnvoi
                      ? new Date(selectedColis.dateEnvoi).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : 'Non spécifiée'}
                  </InfoRow>
                </Box>
              </Box>
              {/* Image */}
              {selectedColis.imageUrl && selectedColis.imageUrl.trim() !== '' && (
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Image sx={{ color: '#ffcc33' }} />
                    Photo du colis
                  </Typography>

                  <Box
                    sx={{
                      backgroundColor: '#f8f9fa',
                      p: 2,
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'center',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <img
                      src={selectedColis.imageUrl}
                      alt="Colis"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '280px',
                        borderRadius: '10px',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        {/* ================= ACTIONS ================= */}
        <DialogActions
          sx={{
            p: 3,
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #e0e0e0',
          }}
        >
          <Button
            onClick={handleCloseDetails}
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
                backgroundColor: '#ffb300',
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