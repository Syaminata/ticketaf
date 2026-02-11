import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  Security,
  CalendarToday
} from '@mui/icons-material';
import axios from '../api/axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    numero: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Charger les données utilisateur depuis localStorage ou API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const storedUser = JSON.parse(sessionStorage.getItem('user'));

        if (!token || !storedUser?._id) {
          if (storedUser) {
            setUser(storedUser);
            setFormData({
              name: storedUser.name || '',
              email: storedUser.email || '',
              numero: storedUser.numero || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            });
          }
          return;
        }

        const response = await axios.get(`/users/${storedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const userData = response.data;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          numero: userData.numero || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        sessionStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        console.error(err);
        const fallbackUser = JSON.parse(sessionStorage.getItem('user'));
        if (fallbackUser) {
          setUser(fallbackUser);
          setFormData({
            name: fallbackUser.name || '',
            email: fallbackUser.email || '',
            numero: fallbackUser.numero || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      }
    };

    fetchUserData();
  }, []);

  // Gestion des champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation simple
    if (!formData.name || !formData.email || !formData.numero) {
      setError('Tous les champs sont requis');
      setLoading(false);
      return;
    }

    const phoneRegex = /^(77|78|76|70|75|33|71)\d{7}$/;
    if (!phoneRegex.test(formData.numero)) {
      setError('Numéro invalide : doit commencer par 77, 78, 76, 70, 75, 33 ou 71 et contenir 9 chiffres');
      setLoading(false);
      return;
    }

    // Validation mot de passe
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('Le mot de passe actuel est requis pour le changer');
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Les nouveaux mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
        setLoading(false);
        return;
      }
    }

    try {
      const token = sessionStorage.getItem('token');
      const dataToSubmit = {
        name: formData.name,
        email: formData.email,
        numero: formData.numero
      };
      if (formData.newPassword) {
        dataToSubmit.currentPassword = formData.currentPassword;
        dataToSubmit.newPassword = formData.newPassword;
      }

      await axios.put(`/users/${user._id}`, dataToSubmit, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = { ...user, ...dataToSubmit };
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setEditMode(false);
      setSuccess('Profil mis à jour avec succès');

      setTimeout(() => setSuccess(''), 5000);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  // Annuler modification
  const handleCancel = () => {
    setEditMode(false);
    setError('');
    setSuccess('');
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      numero: user?.numero || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Initiales pour avatar
  const getInitials = (name) =>
    name
      .split(' ')
      .map(w => w.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

  if (!user) return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>Chargement...</Typography></Box>;

  return (
    <Box sx={{ p: 5, backgroundColor: '#ffff', minHeight: '100vh', ml: -4 }}>
      {/* Alertes */}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Mon Profil</Typography>
        <Typography sx={{ color: '#666' }}>Gérez vos informations personnelles et paramètres de sécurité</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* Carte profil */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 40%' } }}>
          <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ width: 70, height: 70, bgcolor: '#ffcc33', color: '#1a1a1a', mx: 'auto', mb: 2, fontWeight: 700 }}>
                {getInitials(user.name)}
              </Avatar>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{user.name}</Typography>
              <Box sx={{ px: 2, py: 0.5, backgroundColor: '#ffcc33', borderRadius: 20, color: '#1a1a1a', mb: 2, display: 'inline-block', fontWeight: 600 }}>
                {user.role === 'admin' ? 'Administrateur' : user.role}
              </Box>
              <Divider sx={{ borderColor: 'rgba(85,82,74,0.33)', mb: 2 }} />

              <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Email */}
                <Box sx={{ p: 1.5, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 0.8, backgroundColor: '#ffcc33', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Email sx={{ color: '#1a1a1a' }} /></Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>EMAIL</Typography>
                    <Typography sx={{ fontSize: '0.85rem' }}>{user.email || 'Non renseigné'}</Typography>
                  </Box>
                </Box>

                {/* Téléphone */}
                <Box sx={{ p: 1.5, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 0.8, backgroundColor: '#ffcc33', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone sx={{ color: '#1a1a1a' }} /></Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>TÉLÉPHONE</Typography>
                    <Typography sx={{ fontSize: '0.85rem' }}>{user.numero || 'Non renseigné'}</Typography>
                  </Box>
                </Box>

                {/* Date création */}
                <Box sx={{ p: 1.5, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 0.8, backgroundColor: '#ffcc33', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarToday sx={{ color: '#1a1a1a' }} /></Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>DATE DE CRÉATION</Typography>
                    <Typography sx={{ fontSize: '0.85rem' }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Non disponible'}</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Informations personnelles */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 60%' } }}>
          <Paper sx={{ p: 5, borderRadius: 3, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}><Person sx={{ color: '#ffcc33' }} /> Informations personnelles</Typography>
              {!editMode && (
                <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditMode(true)} sx={{ color: '#ffcc33', borderColor: '#ffcc33', '&:hover': { borderColor: '#ffb300', backgroundColor: 'rgba(255,204,51,0.1)' } }}>
                  Modifier
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField fullWidth label="Nom complet" name="name" value={formData.name} onChange={handleChange} disabled={!editMode}
                InputProps={{ startAdornment: (<InputAdornment position="start"><Person sx={{ color: '#666' }} /></InputAdornment>) }} />

              <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={!editMode}
                InputProps={{ startAdornment: (<InputAdornment position="start"><Email sx={{ color: '#666' }} /></InputAdornment>) }} />

              <TextField fullWidth label="Numéro de téléphone" name="numero" value={formData.numero} onChange={handleChange} disabled={!editMode} placeholder="77......."
                InputProps={{ startAdornment: (<InputAdornment position="start"><Phone sx={{ color: '#666' }} /></InputAdornment>) }} />

              <TextField fullWidth label="Rôle" value={user.role === 'admin' ? 'Administrateur' : user.role} disabled
                InputProps={{ startAdornment: (<InputAdornment position="start"><Security sx={{ color: '#666' }} /></InputAdornment>) }} />
            </Box>

            {/* Changement de mot de passe */}
            {editMode && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><Security sx={{ color: '#ffcc33' }} /> Changement de mot de passe (optionnel)</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Mot de passe actuel" name="currentPassword" type={showPassword ? 'text' : 'password'} value={formData.currentPassword} onChange={handleChange}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Nouveau mot de passe" name="newPassword" type={showPassword ? 'text' : 'password'} value={formData.newPassword} onChange={handleChange} helperText="Laissez vide si vous ne voulez pas changer" />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Confirmer le nouveau mot de passe" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} sx={{ color: '#666', borderColor: '#ddd', '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' } }}>Annuler</Button>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={loading} sx={{ backgroundColor: '#ffcc33', color: '#1a1a1a', fontWeight: 600, '&:hover': { backgroundColor: '#ffb300' } }}>
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;
