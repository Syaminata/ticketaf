import React, { useState, useEffect } from 'react';
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
  Person
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

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  const fetchColis = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError('Authentification manquante. Veuillez vous reconnecter.');
      return;
    }

    try {
      let res;
      if (isAdmin) {
        res = await colisAPI.getAllColis();
      } else {
        res = await colisAPI.getUserColis();
      }
      setColis(res);
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
      const res = await voyageAPI.getAllVoyages();
      setVoyages(res);
    } catch (err) {
      console.error('Erreur récupération des voyages:', err);
    }
  };

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
        voyageId: colisItem.voyage?._id || colisItem.reservation?.voyage?._id || '',
        description: colisItem.description || '',
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
        voyageId: '',
        description: '',
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

    if (!formData.voyageId || !formData.destinataire.nom || !formData.destinataire.telephone) {
      setError('Le voyage et les informations du destinataire sont requis.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      submitData.append('voyageId', formData.voyageId);
      submitData.append('description', formData.description || '');
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
        setError(err.response?.data?.message || 'Erreur serveur');
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
    return status.charAt(0).toUpperCase() + status.slice(1); // Met en majuscule la première lettre
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


  const filteredColis = colis.filter((colisItem) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (colisItem.destinataire?.nom || '').toLowerCase().includes(term) ||
      (colisItem.destinataire?.telephone || '').toLowerCase().includes(term) ||
      (colisItem.description || '').toLowerCase().includes(term) ||
      (colisItem.voyage?.from || '').toLowerCase().includes(term) ||
      (colisItem.voyage?.to || '').toLowerCase().includes(term);

    const matchesStatus = !statusFilter || colisItem.status === statusFilter;
    const matchesVoyage = !voyageFilter || (colisItem.voyage?._id === voyageFilter);

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
            {isAdmin ? 'Gérez tous les colis' : 'Gérez vos envois de colis'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => handleOpen()}
          startIcon={<Add />}
          sx={{
            backgroundColor: 'transparent',
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
          Envoyé un colis
        </Button>
      </Box>

      {/* Filtres */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Rechercher par destinataire, description..."
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
              '&:hover fieldset': { borderColor: '#ffcc33' },
              '&.Mui-focused fieldset': { borderColor: '#ffcc33', borderWidth: 2 },
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Statut"
            sx={{
              borderRadius: '8px',
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffcc33' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffcc33' },
            }}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="en attente">En attente</MenuItem>
            <MenuItem value="envoyé">Envoyé</MenuItem>
            <MenuItem value="reçu">Reçu</MenuItem>
            <MenuItem value="annulé">Annulé</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Voyage</InputLabel>
          <Select
            value={voyageFilter}
            onChange={(e) => setVoyageFilter(e.target.value)}
            label="Voyage"
            sx={{
              borderRadius: '8px',
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffcc33' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffcc33' },
            }}
          >
            <MenuItem value="">Tous les voyages</MenuItem>
            {voyages.map((voyage) => (
              <MenuItem key={voyage._id} value={voyage._id}>
                {voyage.from} → {voyage.to}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {colis.length > 0 ? (
        <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Table>
            <TableHead sx={{ borderBottom: '3px solid #ffcc33', '& .MuiTableCell-root': { borderBottom: '3px solid #ffcc33' } }}>
              <TableRow>
                <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px' }}>Image</TableCell>
                <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px' }}>Destinataire</TableCell>
                <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px' }}>Voyage</TableCell>
                <TableCell sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px' }}>Description</TableCell>
                {isAdmin && (
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
                    <Avatar
                      src={colisItem.imageUrl}
                      alt="Colis"
                      variant="rounded"
                      sx={{ width: 60, height: 60, bgcolor: '#f0f0f0' }}
                    >
                      <LocalShipping sx={{ color: '#999' }} />
                    </Avatar>
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
                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {colisItem.voyage?.from} → {colisItem.voyage?.to}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666666' }}>
                      {colisItem.voyage?.date ? new Date(colisItem.voyage.date).toLocaleDateString('fr-FR') : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#666666' }}>
                      {colisItem.description || 'Aucune description'}
                    </Typography>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#666666' }}>
                        {colisItem.expediteur?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip
                      icon={getStatusIcon(colisItem.status)}
                      label={getStatusText(colisItem.status)}
                      color={getStatusColor(colisItem.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton
                      onClick={() => handleOpen(colisItem)}
                      sx={{ color: '#ffcc33', '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' } }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(colisItem._id)}
                      sx={{ color: '#f44336', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}
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

            {/* ================== SECTION VOYAGE ================== */}
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
                Sélection du voyage
              </Typography>

              <FormControl fullWidth required>
                <InputLabel>Voyage</InputLabel>
                <Select
                  name="voyageId"
                  value={formData.voyageId}
                  onChange={handleChange}
                  label="Voyage"
                  sx={{
                    borderRadius: '12px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ffcc33',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ffcc33',
                      borderWidth: 2,
                    },
                  }}
                >
                  {voyages.map((voyage) => (
                    <MenuItem key={voyage._id} value={voyage._id}>
                      {voyage.from} → {voyage.to} •{' '}
                      {new Date(voyage.date).toLocaleDateString('fr-FR')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

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
                    label="Téléphone du destinataire"
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
                    label="Adresse du destinataire"
                    name="destinataire.adresse"
                    value={formData.destinataire.adresse || ''}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={2}
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
                multiline
                rows={3}
                sx={inputStyle}
              />
            </Box>

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
    </Box>
  );
}