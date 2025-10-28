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
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Paper,
  Chip,
  Avatar,
  Alert
} from '@mui/material';
import { Edit, Delete, Add, Person } from '@mui/icons-material';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    numero: '',
    password: '',
    role: 'client'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false
  });

  const fetchUsers = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      
      console.error("Token d'authentification manquant.");
      return;
    }
    try {
      const res = await axios.get('/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    
  }, []);

  const handleOpen = (user = null) => {
    setError('');
    setEditUser(user);
    if (user) {
      
      setFormData({ ...user, numero: user.numero || '', password: '' });
    } else {
      setFormData({ name: '', email: '', numero: '', password: '', role: 'client' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    // Ne pas effacer le message de succès pour qu'il reste visible
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validation spéciale pour le numéro de téléphone
    if (name === 'numero') {
      // Formatage automatique : ne garder que les chiffres
      const cleanValue = value.replace(/\D/g, '');
      
      // Limiter à 9 chiffres maximum
      if (cleanValue.length <= 9) {
        setFormData(prev => ({ ...prev, [name]: cleanValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return setError("Authentification nécessaire.");

    // Validation du format du numéro de téléphone sénégalais
    if (formData.numero) {
      const phoneRegex = /^(77|78|76|70|75|33|71)\d{7}$/;
      if (!phoneRegex.test(formData.numero)) {
        setError("Le numéro de téléphone doit commencer par 77, 78, 76, 70, 75, 33 ou 71 et contenir exactement 9 chiffres.");
        return;
      }
    }

    try {
      if (editUser) {
        
        const dataToSubmit = { ...formData };
        if (dataToSubmit.password === '') {
          delete dataToSubmit.password;
        }
        
        await axios.put(`/users/${editUser._id}`, dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Utilisateur mis à jour avec succès');
      } else {
        await axios.post('/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Utilisateur créé avec succès');
      }
      fetchUsers();
      handleClose();
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error("Erreur lors de la soumission du formulaire:", err);
      setError(err.response?.data?.message || 'Erreur lors de la communication avec le serveur.');
    }
  };

  const handleDelete = (id) => {
    const user = users.find(u => u._id === id);
    const userInfo = user 
      ? `"${user.name}" (${user.email})`
      : 'cet utilisateur';
    
    setConfirmDialog({
      open: true,
      title: "Supprimer l'utilisateur",
      message: `Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${userInfo} ?`,
      onConfirm: () => confirmDelete(id),
      loading: false
    });
  };

  const confirmDelete = async (id) => {
    setConfirmDialog(prev => ({ ...prev, loading: true }));
    
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError("Authentification nécessaire pour la suppression.");
      setConfirmDialog(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      await axios.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Utilisateur supprimé avec succès');
      fetchUsers();
      setConfirmDialog(prev => ({ ...prev, open: false }));
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      setError("Erreur lors de la suppression de l'utilisateur.");
      setConfirmDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ffcc33';
      case 'conducteur': return '#4caf50';
      case 'client': return '#2196f3';
      default: return '#666666';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'conducteur': return 'Conducteur';
      case 'client': return 'Client';
      default: return role;
    }
  };

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
            fontSize: "20px",
            color: '#1a1a1a',
            mb: 1
          }}>
            Liste des Utilisateurs
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#666666',
            fontSize: '16px'
          }}>
            Gérez les comptes utilisateurs et leurs rôles
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
          Ajouter un utilisateur
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
                Utilisateurs
              </TableCell>
              <TableCell sx={{ 
                color: '#1a1a1a', 
                fontWeight: 700,
                fontSize: '16px'
              }}>
                Email
              </TableCell>
              <TableCell sx={{ 
                color: '#1a1a1a', 
                fontWeight: 700,
                fontSize: '16px'
              }}>
                Numéro
              </TableCell>
              <TableCell sx={{ 
                color: '#1a1a1a', 
                fontWeight: 700,
                fontSize: '16px'
              }}>
                Rôle
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
            {users.map((user, index) => (
              <TableRow 
                key={user._id}
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                  '&:hover': { backgroundColor: 'rgba(128, 127, 125, 0.1)' }
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
                    <Typography sx={{ 
                      fontWeight: 600,
                      color: '#1a1a1a'
                    }}>
                      {user.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#666666' }}>
                  {user.email}
                </TableCell>
                <TableCell sx={{ color: '#666666' }}>
                  {user.numero || 'Non renseigné'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getRoleLabel(user.role)}
                    variant="outlined"
                    sx={{
                      color: '#1a1a1a',
                      fontWeight: 600,
                      fontSize: '12px',
                      backgroundColor: 'transparent',
                      borderColor: '#e0e0e0'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <IconButton 
                    onClick={() => handleOpen(user)}
                    sx={{ 
                      color: '#ffcc33',
                      '&:hover': { backgroundColor: 'rgba(255, 204, 51, 0.1)' }
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(user._id)}
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
          backgroundColor: '#ffcc33',
          color: '#1a1a1a',
          fontWeight: 700,
          fontSize: '20px',
          textAlign: 'center',
          py: 2,
          borderRadius: "0px 0px 5px 5px",
        }}>
          {editUser ? 'Modifier l\'utilisateur' : 'Ajouter un nouveau utilisateur'}
        </DialogTitle>
        <DialogContent sx={{ 
          p: 3,
          backgroundColor: '#ffffff'
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            padding: "15px"
          }}>
            <TextField
              label="Nom complet"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
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
              label="Numéro de téléphone"
              name="numero"
              type="tel"
              value={formData.numero}
              onChange={handleChange}
              fullWidth
              helperText="Format: 77, 78, 76, 70, 75, 33 ou 71 suivi de 7 chiffres"
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
              label="Mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required={!editUser}
              helperText={editUser ? "Laissez vide pour conserver le mot de passe actuel" : "Mot de passe requis pour le nouvel utilisateur"}
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
              select
              label="Rôle utilisateur"
              name="role"
              value={formData.role}
              onChange={handleChange}
              fullWidth
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
            >
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="admin">Administrateur</MenuItem>
            </TextField>
            {error && (
              <Box sx={{ 
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
            sx={{
              backgroundColor: '#ffcc33',
              color: '#1a1a1a',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#ffb300',
              }
            }}
          >
            {editUser ? 'Modifier' : 'Créer'}
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
