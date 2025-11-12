import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Grid,
  CardMedia,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

export default function Annonce() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [datePublication, setDatePublication] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [annonces, setAnnonces] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ id: null, title: '', description: '', datePublication: '', dateFin: '' });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDatePublication('');
    setDateFin('');
    setImageFile(null);
    setImagePreview('');
  };

  const openEdit = (a) => {
    setError('');
    setSuccess('');
    const toInput = (d) => d ? new Date(d).toISOString().slice(0,16) : '';
    setEditData({
      id: a._id,
      title: a.title || '',
      description: a.description || '',
      datePublication: toInput(a.datePublication),
      dateFin: toInput(a.dateFin)
    });
    setEditImageFile(null);
    const abs = a.imageUrl && a.imageUrl.startsWith('http') ? a.imageUrl : (a.imageUrl ? `https://ticket-taf.itea.africa${a.imageUrl}` : '');
    setEditImagePreview(abs);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditData({ id: null, title: '', description: '', datePublication: '', dateFin: '' });
    setEditImageFile(null);
    setEditImagePreview('');
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const submitEdit = async () => {
    setError('');
    setSuccess('');
    if (!editData.id) return;
    if (!editData.title.trim()) { setError('Le titre est requis'); return; }
    if (!editData.description.trim()) { setError('La description est requise'); return; }
    if (!editData.datePublication) { setError('La date de publication est requise'); return; }
    if (!editData.dateFin) { setError('La date de fin est requise'); return; }
    try {
      setEditLoading(true);
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      const formData = new FormData();
      formData.append('title', editData.title.trim());
      formData.append('description', editData.description.trim());
      formData.append('datePublication', new Date(editData.datePublication).toISOString());
      formData.append('dateFin', new Date(editData.dateFin).toISOString());
      if (editImageFile) formData.append('image', editImageFile);
      const resp = await fetch(`https://ticket-taf.itea.africa/api/annonces/${editData.id}`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.message || "Erreur lors de la mise à jour");
      setSuccess('Annonce mise à jour');
      setEditOpen(false);
      await fetchAnnonces();
    } catch (e) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setEditLoading(false);
    }
  };

  const deleteAnnonce = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try {
      setDeleteLoadingId(id);
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      const resp = await fetch(`https://ticket-taf.itea.africa/api/annonces/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.message || 'Erreur lors de la suppression');
      setSuccess('Annonce supprimée');
      await fetchAnnonces();
    } catch (e) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    if (!description.trim()) {
      setError('La description est requise');
      return;
    }
    if (!datePublication) {
      setError('La date de publication est requise');
      return;
    }
    if (!dateFin) {
      setError('La date de fin est requise');
      return;
    }
    if (!imageFile) {
      setError("L'image est requise");
      return;
    }

    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('datePublication', new Date(datePublication).toISOString());
      formData.append('dateFin', new Date(dateFin).toISOString());
      formData.append('image', imageFile);

      const resp = await fetch('https://ticket-taf.itea.africa/api/annonces', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.message || 'Erreur lors de la création de l\'annonce');
      }

      setSuccess("Annonce créée avec succès");
      resetForm();
      await fetchAnnonces();
    } catch (err) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnonces = async () => {
    try {
      setListLoading(true);
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      const resp = await fetch('https://ticket-taf.itea.africa/api/annonces', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Erreur chargement annonces');
      setAnnonces(Array.isArray(data) ? data : []);
    } catch (e) {
      // garder silencieux côté liste; l'erreur principale reste dans error
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnonces();
  }, []);

  return (
    <Box sx={{ p: 2, backgroundColor: '#ffff', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '22px', color: '#1a1a1a', mb: 0.5 }}>
            Annonces
          </Typography>
          <Typography variant="body1" sx={{ color: '#70757a', fontSize: '14px' }}>
            Créez une annonce avec un titre, une description et une image
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}

      <Card sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e5e7eb', maxWidth: '100%' , mx: 'auto' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <TextField
              label="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
              multiline
              minRows={3}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <Grid container spacing={1}>
              <Grid item xs={12} md={6}>
                <TextField
                  type="datetime-local"
                  label="Date de publication"
                  value={datePublication}
                  onChange={(e) => setDatePublication(e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  type="datetime-local"
                  label="Date de fin"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
            </Grid>

            <Box sx={{
              border: '1px dashed #d1d5db',
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              backgroundColor: '#fafafa'
            }}>
              <Box sx={{ color: '#6b7280', fontSize: 14 }}>
                Importez une image (jpg, png, webp)
              </Box>
              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ borderColor: '#e5e7eb', color: '#374151', textTransform: 'none', borderRadius: '8px' }}
              >
                Parcourir
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
              </Button>
            </Box>
            {imagePreview && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 72, height: 56, borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                  <img
                    src={imagePreview}
                    alt="Prévisualisation"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Box sx={{ color: '#6b7280', fontSize: 12 }}>Aperçu</Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 0.5 }}>
              <Button
                onClick={resetForm}
                variant="text"
                disabled={loading}
                size="small"
                sx={{ textTransform: 'none', color: '#6b7280' }}
              >
                Réinitialiser
              </Button>
              <Button
                onClick={handleSubmit}
                variant="outlined"
                disabled={loading}
                sx={{
                  backgroundColor: 'transparent',
                  color: '#ffcc33',
                  textTransform: 'none',
                  px: 3,
                  borderRadius: '8px',
                  border: '2px solid #ffcc33 '
                }}
              >
                {loading ? <CircularProgress size={16} sx={{ color: '#ffcc33' }} /> : 'Publier'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Annonces récentes ({annonces.length})
        </Typography>
        {listLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#ffcc33' }} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {annonces.map((a) => (
              <Grid item xs={12} sm={6} md={4} key={a._id}>
                <Card sx={{ borderRadius: '12px', border: '1px solid #eee', position: 'relative' }}>
                  {a.imageUrl && (
                    <CardMedia
                      component="img"
                      height="160"
                      image={a.imageUrl.startsWith('http') ? a.imageUrl : `https://ticket-taf.itea.africa${a.imageUrl}`}
                      alt={a.title}
                    />
                  )}
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{a.title}</Typography>
                    <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                      {a.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#555', display: 'block', mt: 0.5 }}>
                      Publication: {a.datePublication ? new Date(a.datePublication).toLocaleString('fr-FR') : '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#555', display: 'block' }}>
                      Fin: {a.dateFin ? new Date(a.dateFin).toLocaleString('fr-FR') : '—'}
                    </Typography>
                    {a.createdAt && (
                      <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                        Publié le {new Date(a.createdAt).toLocaleString('fr-FR')}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {/* Bouton Modifier */}
                      <IconButton
                        size="small"
                        onClick={() => openEdit(a)}
                        sx={{
                          color: '#ffcc33',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 204, 51, 0.1)',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      {/* Bouton Supprimer */}
                      <IconButton
                        size="small"
                        onClick={() => deleteAnnonce(a._id)}
                        disabled={deleteLoadingId === a._id}
                        sx={{
                          color: '#d32f2f', 
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.1)', 
                            color: '#b71c1c', 
                          },
                        }}
                      >
                        {deleteLoadingId === a._id ? (
                          <CircularProgress size={16} sx={{ color: '#d32f2f' }} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {annonces.length === 0 && !listLoading && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', color: '#888', py: 4, border: '1px dashed #ddd', borderRadius: '12px' }}>
                  Aucune annonce pour le moment
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '3px solid #ffcc33' }}>Modifier l'annonce</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Titre"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              required
              fullWidth
              multiline
              minRows={4}
            />
            <TextField
              type="datetime-local"
              label="Date de publication"
              value={editData.datePublication}
              onChange={(e) => setEditData({ ...editData, datePublication: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="datetime-local"
              label="Date de fin"
              value={editData.dateFin}
              onChange={(e) => setEditData({ ...editData, dateFin: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Box>
              <Button variant="outlined" component="label" sx={{ borderColor: '#ffcc33', color: '#ffcc33' }}>
                Remplacer l'image
                <input type="file" accept="image/*" hidden onChange={handleEditImageChange} />
              </Button>
              {editImagePreview && (
                <Box sx={{ mt: 2 }}>
                  <img src={editImagePreview} alt="Prévisualisation" style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid #eee' }} />
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{p:3}}>
          <Button onClick={closeEdit} disabled={editLoading}>Annuler</Button>
          <Button onClick={submitEdit} variant="contained" disabled={editLoading} sx={{ backgroundColor: '#ffcc33', color: '#1a1a1a' }}>
            {editLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
